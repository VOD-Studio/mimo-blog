package tui

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	_ "image/jpeg" // 封面格式注册(jpg/png 为主)
	"image/png"
	"strings"

	tea "charm.land/bubbletea/v2"
	"github.com/charmbracelet/lipgloss"

	"github.com/VOD-Studio/mimo-music/internal/cli/songdl"
)

// ==================== 协议矩阵(PRD-0016,参考 oh-my-pi 图片子系统) ====================

// coverProtocol 封面渲染协议。优先级:kitty → iterm2 → halfblock。
type coverProtocol int

const (
	// coverOff 关闭封面(MUSICCTL_IMAGE_PROTOCOL=off),直接占位。
	coverOff coverProtocol = iota
	// coverKitty Kitty 图形协议(ghostty/kitty):transmit-once place-many——
	// 加载时一次性 base64 传输分配 image id(U=1 virtual placement),View 行只含 Unicode placeholder。
	coverKitty
	// coverITerm2 iTerm2 inline(OSC 1337):图像转义作为静态行嵌入 View,
	// bubbletea 行 diff 对未变化行不重发,天然 transmit-once。
	coverITerm2
	// coverHalfblock 半块字符画(▀,fg=上像素 bg=下像素),任意终端降级。
	coverHalfblock
)

// kittyImageID 封面图在 Kitty 协议里的固定 image id(单曲播放屏同时只 1 张 live 图)。
const kittyImageID = 1

// detectCoverProtocol 纯环境变量检测(快路径,不做 query-response 探测——
// 漏检的代价只是降级,cosmetic 而非 corrupting)。
// MUSICCTL_IMAGE_PROTOCOL=kitty|iterm2|halfblock|off 显式覆盖(逃生门)。
func detectCoverProtocol(getenv func(string) string) coverProtocol {
	switch getenv("MUSICCTL_IMAGE_PROTOCOL") {
	case "kitty":
		return coverKitty
	case "iterm2":
		return coverITerm2
	case "halfblock":
		return coverHalfblock
	case "off":
		return coverOff
	}
	if term := getenv("TERM"); term == "xterm-kitty" || term == "xterm-ghostty" ||
		getenv("KITTY_WINDOW_ID") != "" {
		return coverKitty
	}
	if getenv("TERM_PROGRAM") == "iTerm.app" || getenv("WEZTERM_EXECUTABLE") != "" {
		return coverITerm2
	}
	return coverHalfblock
}

// ==================== 拉取与解码 ====================

// coverFetcher 封面字节拉取 seam(生产:songdl.FetchCover;测试注入合成图)。
// 返回 nil = 拉取失败(静默降级占位)。
type coverFetcher func(picURL string) []byte

// coverLoadedMsg 封面拉取+解码成功。png 为重编码字节(kitty f=100 / iterm2 需要)。
type coverLoadedMsg struct {
	img image.Image
	png []byte
}

// coverFailedMsg 拉取或解码失败(静默降级,占位展示)。
type coverFailedMsg struct{}

// coverTransmittedMsg kitty 传输已落盘(Sequence 保序:transmit → placeholder)。
type coverTransmittedMsg struct {
	img image.Image
	png []byte
}

// fetchCoverCmd 异步拉取封面:字节 → 解码一次(同时喂渲染与 T4 取色)→ PNG 重编码。
func fetchCoverCmd(fetch coverFetcher, picURL string) tea.Cmd {
	return func() tea.Msg {
		b := fetch(picURL)
		if len(b) == 0 {
			return coverFailedMsg{}
		}
		img, _, err := image.Decode(bytes.NewReader(b))
		if err != nil {
			return coverFailedMsg{}
		}
		var buf bytes.Buffer
		if err := png.Encode(&buf, img); err != nil {
			return coverFailedMsg{}
		}
		return coverLoadedMsg{img: img, png: buf.Bytes()}
	}
}

// 生产拉取:复用 songdl.FetchCover(与 song download 同款,封面 CDN 无 Referer 检查)。
func defaultCoverFetcher(picURL string) []byte {
	return songdl.FetchCover(picURL)
}

// ==================== 渲染(rect 高度保持:三种协议同 cols×rows) ====================

// renderCoverLines 按协议渲染封面区,行数恒等于 rows(降级/切换不 reflow)。
// png 为协议负载(kitty/iterm2);img 为像素源(halfblock)。
func renderCoverLines(proto coverProtocol, pngData []byte, img image.Image, cols, rows int) []string {
	switch proto {
	case coverKitty:
		return kittyPlaceholderLines(cols, rows)
	case coverITerm2:
		return iterm2Lines(pngData, cols, rows)
	default:
		return halfblockLines(img, cols, rows)
	}
}

// kittyPlaceholderLines Unicode placeholder(ghostty/kitty 默认,oh-my-pi 同款):
// 前景色编码 image id(38;5;N),U+10EEEE 占位字符区域即图像显示区。
// 纯文本 cell——placement 走 APC 序列会被 bubbletea v2 cellbuf 剥离(实测),
// Unicode placeholder 是 View 内嵌图像的唯一可行路径;行内容恒定,diff 不重发。
func kittyPlaceholderLines(cols, rows int) []string {
	const placeholder = "\U0010eeee" // kitty unicode placeholder(宽 1,已验证)
	line := fmt.Sprintf("\x1b[38;5;%dm", kittyImageID) + strings.Repeat(placeholder, cols) + "\x1b[39m"
	lines := make([]string, rows)
	for i := range lines {
		lines[i] = line
	}
	return lines
}

// kittyTransmitSeq Kitty 传输序列(一次性):f=100 PNG + t=d 内嵌 base64 +
// U=1 创建 virtual placement(Unicode placeholder 引用),按 ≤4096 字节分块。
func kittyTransmitSeq(pngData []byte) string {
	b64 := base64.StdEncoding.EncodeToString(pngData)
	var sb strings.Builder
	const chunkSize = 4096
	first := true
	for len(b64) > 0 {
		n := min(chunkSize, len(b64))
		more := 0
		if n < len(b64) {
			more = 1
		}
		if first {
			fmt.Fprintf(&sb, "\x1b_Ga=t,f=100,t=d,i=%d,U=1,q=2,m=%d;%s\x1b\\", kittyImageID, more, b64[:n])
			first = false
		} else {
			fmt.Fprintf(&sb, "\x1b_Gi=%d,q=2,m=%d;%s\x1b\\", kittyImageID, more, b64[:n])
		}
		b64 = b64[n:]
	}
	return sb.String()
}

// kittyDeleteSeq 退出时按 id 删除图像,不残留像素内存。
func kittyDeleteSeq() string {
	return fmt.Sprintf("\x1b_Ga=d,d=i,i=%d,q=2\x1b\\", kittyImageID)
}

// iterm2Lines iTerm2 inline:首行 OSC 1337 转义(尺寸 N = N 单元格,官方文档)。
// preserveAspectRatio=0 强制铺满 cols×rows(封面近方形,形变不可感知)——
// 图像下推光标的行数恒等于 rows,CSI rows A 回退恒正确,渲染器光标追踪不失步。
// 转义为静态行内容,行 diff 不重发(天然 transmit-once)。
func iterm2Lines(pngData []byte, cols, rows int) []string {
	b64 := base64.StdEncoding.EncodeToString(pngData)
	seq := fmt.Sprintf("\x1b]1337;File=inline=1;width=%d;height=%d;preserveAspectRatio=0:%s\a",
		cols, rows, b64)
	lines := make([]string, rows)
	lines[0] = seq + fmt.Sprintf("\x1b[%dA", rows) + strings.Repeat(" ", cols)
	for i := 1; i < rows; i++ {
		lines[i] = strings.Repeat(" ", cols)
	}
	return lines
}

// halfblockLines 半块字符画:▀(fg=上像素,bg=下像素,2 像素/单元格),最近邻采样。
// 颜色经 lipgloss 按终端 profile 降级(truecolor → 256 → 16)。
func halfblockLines(img image.Image, cols, rows int) []string {
	b := img.Bounds()
	sw, sh := b.Dx(), b.Dy()
	lines := make([]string, rows)
	for r := range rows {
		var sb strings.Builder
		for c := range cols {
			ux := b.Min.X + c*sw/cols
			uyUp := b.Min.Y + (2*r)*sh/(2*rows)
			uyLo := b.Min.Y + (2*r+1)*sh/(2*rows)
			sb.WriteString(lipgloss.NewStyle().
				Foreground(lipgloss.Color(hexOf(img.At(ux, uyUp)))).
				Background(lipgloss.Color(hexOf(img.At(ux, uyLo)))).
				Render("▀"))
		}
		lines[r] = sb.String()
	}
	return lines
}

// hexOf 像素 → #rrggbb(丢弃 alpha,封面图无透明需求)。
func hexOf(c color.Color) string {
	r, g, b, _ := c.RGBA()
	return fmt.Sprintf("#%02x%02x%02x", r>>8, g>>8, b>>8)
}

// coverPlaceholder 占位:♪ 居中 + 调色板主色边框(拉取失败/无 PicUrl/off)。
// 与同 rect 的图像渲染行数一致(高度保持)。
func coverPlaceholder(cols, rows int, border lipgloss.Color) string {
	inner := lipgloss.Place(cols-2, rows-2, lipgloss.Center, lipgloss.Center, faintStyle.Render("♪"))
	return lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(border).
		Render(inner)
}
