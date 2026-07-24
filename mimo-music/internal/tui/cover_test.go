package tui

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"io"
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// ==================== 协议检测矩阵(Seam 3,issue #63 验收) ====================

func envOf(pairs map[string]string) func(string) string {
	return func(k string) string { return pairs[k] }
}

// TestDetectCoverProtocol env 各组合 → 协议选择;MUSICCTL_IMAGE_PROTOCOL 覆盖生效。
func TestDetectCoverProtocol(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name string
		env  map[string]string
		want coverProtocol
	}{
		{"ghostty TERM", map[string]string{"TERM": "xterm-ghostty"}, coverKitty},
		{"kitty TERM", map[string]string{"TERM": "xterm-kitty"}, coverKitty},
		{"KITTY_WINDOW_ID", map[string]string{"TERM": "xterm-256color", "KITTY_WINDOW_ID": "1"}, coverKitty},
		{"iTerm2", map[string]string{"TERM": "xterm-256color", "TERM_PROGRAM": "iTerm.app"}, coverITerm2},
		{"WezTerm", map[string]string{"TERM": "xterm-256color", "WEZTERM_EXECUTABLE": "/usr/bin/wezterm"}, coverITerm2},
		{"tmux 降级半块", map[string]string{"TERM": "screen-256color", "TERM_PROGRAM": "tmux"}, coverHalfblock},
		{"ssh 通用降级", map[string]string{"TERM": "xterm-256color"}, coverHalfblock},
		{"覆盖 kitty", map[string]string{"MUSICCTL_IMAGE_PROTOCOL": "kitty", "TERM": "dumb"}, coverKitty},
		{"覆盖 iterm2", map[string]string{"MUSICCTL_IMAGE_PROTOCOL": "iterm2", "TERM": "xterm-kitty"}, coverITerm2},
		{"覆盖 halfblock", map[string]string{"MUSICCTL_IMAGE_PROTOCOL": "halfblock", "TERM": "xterm-kitty"}, coverHalfblock},
		{"覆盖 off", map[string]string{"MUSICCTL_IMAGE_PROTOCOL": "off", "TERM": "xterm-kitty"}, coverOff},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			if got := detectCoverProtocol(envOf(tc.env)); got != tc.want {
				t.Errorf("detectCoverProtocol(%v) = %v, want %v", tc.env, got, tc.want)
			}
		})
	}
}

// ==================== 渲染(高度保持 + transmit-once) ====================

// synthPNG 合成已知像素分布的测试图(4×4 纯色块)。
func synthPNG(t *testing.T, c color.Color) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 4, 4))
	for y := range 4 {
		for x := range 4 {
			img.Set(x, y, c)
		}
	}
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}

func decodePNG(t *testing.T, b []byte) image.Image {
	t.Helper()
	img, err := png.Decode(bytes.NewReader(b))
	if err != nil {
		t.Fatal(err)
	}
	return img
}

// TestCoverRectLines_EqualAcrossProtocols 三种协议渲染同一 rect 行数一致(高度保持)。
func TestCoverRectLines_EqualAcrossProtocols(t *testing.T) {
	t.Parallel()
	pngData := synthPNG(t, color.RGBA{R: 200, G: 100, B: 50, A: 255})
	img := decodePNG(t, pngData)
	for _, proto := range []coverProtocol{coverKitty, coverITerm2, coverHalfblock} {
		lines := renderCoverLines(proto, pngData, img, 20, 10)
		if len(lines) != 10 {
			t.Errorf("proto %v 渲染应 10 行(高度保持),got %d", proto, len(lines))
		}
	}
}

// TestKittyTransmitOnce kitty:加载 Cmd 一次性含 base64;View 行只含 placement 不含 base64。
func TestKittyTransmitOnce(t *testing.T) {
	t.Parallel()
	pngData := synthPNG(t, color.RGBA{A: 255})
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMetaWithCover(), nil, 75, WithInitialSize(80, 24),
		WithEnviron(envOf(map[string]string{"MUSICCTL_IMAGE_PROTOCOL": "kitty"})))

	tm, cmd := m.Update(coverLoadedMsg{img: decodePNG(t, pngData), png: pngData})
	m = tm.(Model)
	if cmd == nil {
		t.Fatal("kitty 加载应返回传输 Cmd")
	}
	// 传输 Cmd → RawMsg:含 a=t 传输 + image id + base64 PNG(一次性)。
	msg, ok := cmd().(tea.RawMsg)
	if !ok {
		t.Fatalf("传输 Cmd 应产生 RawMsg,got %T", cmd())
	}
	seq, _ := msg.Msg.(string)
	if !strings.Contains(seq, "a=t") || !strings.Contains(seq, "i=1") || !strings.Contains(seq, "iVBOR") {
		t.Errorf("传输序列应含 a=t / image id / base64 PNG,got %q", seq[:min(80, len(seq))])
	}
	// View 输出不含 base64,只含 placement(a=p)。
	view := viewOf(m)
	if strings.Contains(view, "iVBOR") {
		t.Error("View 输出不应含 base64(transmit-once)")
	}
	if !strings.Contains(view, "a=p") {
		t.Error("View 应含 placement 转义(a=p)")
	}
}

// TestITerm2ViewInline iterm2:OSC 1337 转义嵌 View 首行(静态行,行 diff 不重发)。
func TestITerm2ViewInline(t *testing.T) {
	t.Parallel()
	pngData := synthPNG(t, color.RGBA{A: 255})
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMetaWithCover(), nil, 75, WithInitialSize(80, 24),
		WithEnviron(envOf(map[string]string{"MUSICCTL_IMAGE_PROTOCOL": "iterm2"})))
	tm, cmd := m.Update(coverLoadedMsg{img: decodePNG(t, pngData), png: pngData})
	m = tm.(Model)
	if cmd != nil {
		t.Fatal("iterm2 无需传输 Cmd(序列嵌 View)")
	}
	view := viewOf(m)
	if !strings.Contains(view, "1337;File=inline=1") {
		t.Error("View 应含 OSC 1337 转义")
	}
	if !strings.Contains(view, "\x1b[15A") { // 无歌词 rect 30×15,光标回退 15 行
		t.Error("View 应含光标回退(图像下推补偿)")
	}
}

// TestCoverOff_NoFetch off:不拉取,直接占位。
func TestCoverOff_NoFetch(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	fetched := false
	m := New(p, testMetaWithCover(), nil, 75, WithInitialSize(80, 24),
		WithEnviron(envOf(map[string]string{"MUSICCTL_IMAGE_PROTOCOL": "off"})),
		WithCoverFetcher(func(string) []byte { fetched = true; return nil }))
	m.Init() // off 时 Init 不含 fetch Cmd
	if fetched {
		t.Error("off 不应拉取封面")
	}
	if v := m.coverView(); !strings.Contains(v, "♪") {
		t.Errorf("off 应 ♪ 占位,got %q", v)
	}
}

// TestCoverFailed_Placeholder 拉取失败 → 占位,布局行数不变(高度保持)。
func TestCoverFailed_Placeholder(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMetaWithCover(), nil, 75, WithInitialSize(80, 24),
		WithCoverFetcher(func(string) []byte { return nil })) // 拉取失败
	msg := fetchCoverCmd(m.coverFetch, m.meta.PicURL)()
	if _, ok := msg.(coverFailedMsg); !ok {
		t.Fatalf("拉取失败应产生 coverFailedMsg,got %T", msg)
	}
	tm, _ := m.Update(msg)
	m = tm.(Model)
	if !m.coverFailed {
		t.Fatal("coverFailed 应置位")
	}
	v := m.coverView()
	if !strings.Contains(v, "♪") {
		t.Errorf("失败应 ♪ 占位,got %q", v)
	}
	if got := len(strings.Split(v, "\n")); got != 15 {
		t.Errorf("占位应与图像同 rect(无歌词 15 行),got %d 行", got)
	}
}

// TestHalfblockContent 半块:▀ 双像素渲染,行数与 rect 一致。
func TestHalfblockContent(t *testing.T) {
	t.Parallel()
	pngData := synthPNG(t, color.RGBA{R: 255, A: 255})
	lines := halfblockLines(decodePNG(t, pngData), 20, 10)
	if len(lines) != 10 {
		t.Fatalf("半块应 10 行,got %d", len(lines))
	}
	for i, ln := range lines {
		if !strings.Contains(ln, "▀") {
			t.Errorf("第 %d 行应含 ▀,got %q", i, ln)
		}
	}
}

// delayedQuitReader 先等封面加载完成,再发 q(确定性集成:退出删图)。
type delayedQuitReader struct {
	delay time.Duration
	sent  bool
}

func (d *delayedQuitReader) Read(b []byte) (int, error) {
	if d.sent {
		return 0, io.EOF
	}
	time.Sleep(d.delay)
	d.sent = true
	return copy(b, "q"), nil
}

// TestCoverExitDeletesKittyImage 退出时 kitty 图像按 id 删除(Run 集成,q 路径)。
func TestCoverExitDeletesKittyImage(t *testing.T) {
	t.Parallel()
	pngData := synthPNG(t, color.RGBA{A: 255})
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	var out bytes.Buffer
	err := Run(p, testMetaWithCover(), nil, 75,
		WithInput(&delayedQuitReader{delay: 300 * time.Millisecond}),
		WithOutput(&out),
		WithInitialSize(80, 24),
		WithEnviron(envOf(map[string]string{"MUSICCTL_IMAGE_PROTOCOL": "kitty"})),
		WithCoverFetcher(func(string) []byte { return pngData }),
	)
	if err != nil {
		t.Fatalf("运行失败: %v", err)
	}
	got := out.String()
	// 加载:一次性传输含 base64;退出:a=d,d=i 按 id 删除。
	if !strings.Contains(got, "iVBOR") {
		t.Error("应有一次性 kitty 传输(base64)")
	}
	if !strings.Contains(got, "a=d,d=i") {
		t.Error("退出应按 id 删除 kitty 图像")
	}
}

// TestCoverFetchCmd_DecodeOnce 拉取→解码一次→PNG 重编码(喂渲染与取色)。
func TestCoverFetchCmd_DecodeOnce(t *testing.T) {
	t.Parallel()
	pngData := synthPNG(t, color.RGBA{G: 200, A: 255})
	msg := fetchCoverCmd(func(string) []byte { return pngData }, "http://x/cover.jpg")()
	loaded, ok := msg.(coverLoadedMsg)
	if !ok {
		t.Fatalf("应解码成功,got %T", msg)
	}
	if loaded.img.Bounds().Dx() != 4 {
		t.Errorf("解码图尺寸不符,got %v", loaded.img.Bounds())
	}
	if len(loaded.png) == 0 {
		t.Error("PNG 重编码应为非空")
	}
}

func testMetaWithCover() SongMeta {
	meta := testMeta()
	meta.PicURL = "http://cdn.example.com/cover.jpg"
	return meta
}
