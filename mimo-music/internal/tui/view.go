package tui

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/lipgloss"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// 底部固定行数:进度行 + 浮层行 + 键位栏。顶栏 1 行。
const fixedLines = 4

// 舞台视口行数:上 2 渐暗 + 当前行 + 下 2 渐暗(PRD-0016)。
const stageLines = 5

// render 主视图(纯函数,只读采样值)。
func (m Model) render() string {
	if m.width <= 0 || m.height <= 0 {
		return "" // 尺寸未就绪(首帧 WindowSizeMsg 前)
	}
	if m.width < minWidth || m.height < minHeight {
		return lipgloss.Place(m.width, m.height, lipgloss.Center, lipgloss.Center,
			dimStyle.Render("终端窗口过小(需 ≥ 40×12)")+"\n\n"+dimStyle.Render("q 退出"))
	}

	midH := m.height - fixedLines
	if midH < 1 {
		midH = 1
	}
	mid := lipgloss.Place(m.width, midH, lipgloss.Center, lipgloss.Center, m.midContent())

	return lipgloss.JoinVertical(lipgloss.Left,
		m.topBar(),
		mid,
		m.progressLine(),
		m.overlayLine(),
		" "+m.volumeBar()+"  "+dimStyle.Render("空格 暂停 · ← → ∓10s · ↑ ↓ 音量 · q 退出 · ? 帮助"),
	)
}

// midContent 屏幕中央区:help/info 居中 popup 优先;有歌词时封面 + 舞台并排;
// 无歌词时封面居中放大一档(不留空白面板)。
func (m Model) midContent() string {
	switch {
	case m.showHelp:
		return m.helpPopup()
	case m.showInfo:
		return m.infoPopup()
	case len(m.lyric) > 0:
		return lipgloss.JoinHorizontal(lipgloss.Center, m.coverView(), "   ", m.lyricStage())
	default:
		return m.coverView()
	}
}

// 封面 rect:有歌词 20×10(与舞台并排);无歌词 30×15(居中放大一档,PRD user story 6)。
// 三种协议渲染占用同一 rect(高度保持,降级不 reflow)。
const (
	coverColsWithLyric = 20
	coverRowsWithLyric = 10
	coverColsNoLyric   = 30
	coverRowsNoLyric   = 15
)

// coverRect 当前状态的封面区尺寸(单元格)。行数 clamp 到可用高度
// (min 3 行保底):修复 12-18 行高超裁底(布局行数恒 ≤ height)。
func (m Model) coverRect() (cols, rows int) {
	avail := max(3, m.height-fixedLines)
	if len(m.lyric) > 0 {
		return coverColsWithLyric, min(coverRowsWithLyric, avail)
	}
	return coverColsNoLyric, min(coverRowsNoLyric, avail)
}

// coverView 封面区渲染:已加载用 join 缓存;未加载/失败/off 用 ♪ 占位。
func (m Model) coverView() string {
	if m.coverViewCache != "" {
		return m.coverViewCache
	}
	cols, rows := m.coverRect()
	return coverPlaceholder(cols, rows, m.styles.palette.primary.color())
}

// topBar 顶栏:♪ 标题(左) + 音质徽章(右)。
func (m Model) topBar() string {
	title := m.styles.title.Render("♪ " + m.title())
	badge := ""
	if m.meta.Format != "" {
		badge = m.styles.badge.Render(fmt.Sprintf("%s %dkbps", m.meta.Format, m.meta.Bitrate/1000))
	}
	gap := m.width - lipgloss.Width(title) - lipgloss.Width(badge)
	if gap < 1 {
		// 宽度不足时徽章让位,标题截断交给终端(不换行即可)。
		return title
	}
	return title + strings.Repeat(" ", gap) + badge
}

// progressLine 进度行:状态图标 + 时钟 + 进度条 + 总时长。
//
// StateBuffering 时采样值是 (已缓冲, 水位),进度条天然展示水位填充
// (PRD「缓冲中(水位可见)」,语义沿旧状态栏)。
func (m Model) progressLine() string {
	left := fmt.Sprintf(" %s %s ", stateIcon(m.state), fmtClock(m.curMs))
	right := fmt.Sprintf(" %s", fmtClock(m.totalMs))
	barW := m.width - lipgloss.Width(left) - lipgloss.Width(right)
	return left + bar(m.curMs, m.totalMs, barW, m.styles) + right
}

// overlayLine 浮层行(音量/notice 同通道):音量键弹音量条,notice 弹提示文本。
// 弹簧入场由 overlayOffset 驱动(行粒度滑入);无浮层时空行保持布局稳定。
func (m Model) overlayLine() string {
	if m.overlay == overlayNone || int(math.Round(m.overlayOffset)) != 0 {
		return ""
	}
	switch m.overlay {
	case overlayVolume:
		return " " + m.volumeOverlay()
	case overlayNotice:
		return " " + m.styles.notice.Render(m.notice)
	}
	return ""
}

// lyricStage 歌词舞台:视口 5 行,上 2 渐暗、当前行高亮 bold、下 2 渐暗,
// 当前行固定视觉中心。换行弹簧:stageOffset 非零时窗口整体偏移
// (新行从 ±1 行滑入),终端行粒度下按 round(offset) 行渲染。
func (m Model) lyricStage() string {
	center := m.lastLyricIdx - int(math.Round(m.stageOffset))
	lines := make([]string, 0, stageLines)
	for d := -2; d <= 2; d++ {
		idx := center + d
		text := ""
		if idx >= 0 && idx < len(m.lyric) {
			text = m.lyric[idx].Text
		}
		switch d {
		case -2, 2:
			lines = append(lines, farStyle.Render(text))
		case -1, 1:
			lines = append(lines, nearStyle.Render(text))
		default:
			lines = append(lines, m.styles.lyric.Render("> "+text))
		}
	}
	return lipgloss.JoinVertical(lipgloss.Center, lines...)
}

// helpPopup 键位帮助(居中 styled popup,文案沿旧 helpLines)。
func (m Model) helpPopup() string {
	return m.styles.popup.Render(lipgloss.JoinVertical(lipgloss.Left,
		m.styles.title.Render("帮助"),
		"",
		" 空格        播放/暂停",
		" ← / →      快退/快进 10s(Shift 30s)",
		" ↑ / ↓      音量 ±5%",
		" m          静音切换",
		" 0-9        跳到 10% 刻度",
		" i          歌曲详情",
		" ?          关闭帮助",
		" q / Esc    退出",
	))
}

// infoPopup 歌曲详情(居中 styled popup,内容沿旧 infoLines)。
func (m Model) infoPopup() string {
	album := m.meta.Album
	if y := yearOf(m.meta.PublishTime); y != "" {
		album += "(" + y + ")"
	}
	return m.styles.popup.Render(lipgloss.JoinVertical(lipgloss.Left,
		m.styles.title.Render("歌曲详情"),
		"",
		" 艺人  "+m.meta.Artist,
		" 专辑  "+album,
		fmt.Sprintf(" 音质  level=%d %s %dkbps", m.meta.Level, m.meta.Format, m.meta.Bitrate/1000),
		" 音源  "+m.meta.URL,
	))
}

// title 「艺人 - 歌名 · 专辑(年份)」(沿旧 playUI.title)。
func (m Model) title() string {
	name := m.meta.Name
	if name == "" {
		name = strconv.FormatInt(m.meta.ID, 10)
	}
	s := name
	if m.meta.Artist != "" {
		s = m.meta.Artist + " - " + s
	}
	if m.meta.Album != "" {
		s += " · " + m.meta.Album
		if y := yearOf(m.meta.PublishTime); y != "" {
			s += "(" + y + ")"
		}
	}
	return s
}

// volumeBar 常驻音量段(键位栏行):🔊 ▓▓▓░░ 62%(静音 🔇)。
func (m Model) volumeBar() string {
	return m.volBar(5)
}

// volumeOverlay 浮层音量条:比常驻段宽一倍,突出操作反馈。
func (m Model) volumeOverlay() string {
	return m.volBar(10)
}

// volBar 音量条渲染:▓ 填充(主色) + ░ 空 + 百分比。
func (m Model) volBar(width int) string {
	icon := "🔊"
	if m.muted {
		icon = "🔇"
	}
	vol := m.effectiveVol()
	filled := vol * width / 100
	return fmt.Sprintf("%s %s%s %d%%",
		icon,
		lipgloss.NewStyle().Foreground(m.styles.volFill).Render(strings.Repeat("▓", filled)),
		m.styles.volVoid.Render(strings.Repeat("░", width-filled)),
		vol)
}

// ==================== 纯函数 ====================

// stateIcon 播放状态图标:▶ 播放 / ⏸ 暂停 / ⏳ 缓冲 / ⏹ 停止。
func stateIcon(s player.State) string {
	switch s {
	case player.StatePlaying:
		return "▶"
	case player.StatePaused:
		return "⏸"
	case player.StateBuffering:
		return "⏳"
	default:
		return "⏹"
	}
}

// bar 定宽进度条:━ 填充(主→强调渐变) + ╸ 头部(强调色) + ─ 空;
// total ≤ 0(未知)全空;cur>total 按满格渲染。
// 渐变用 styleSet 预计算的 32 档样式,帧循环零插值开销。
func bar(cur, total int64, width int, ss styleSet) string {
	if width < 2 {
		width = 2
	}
	if total <= 0 || cur <= 0 {
		return ss.barVoid.Render(strings.Repeat("─", width))
	}
	f := int(cur * int64(width) / total)
	if f <= 0 {
		// cur>0 但不足一格(起播瞬间):不画头部,避免负 Repeat。
		return ss.barVoid.Render(strings.Repeat("─", width))
	}
	var sb strings.Builder
	fill := f - 1
	if f >= width {
		fill = width // 全满:整条渐变,无头部
	}
	for i := range fill {
		sb.WriteString(ss.gradient[i*gradientSteps/max(1, width-1)].Render("━"))
	}
	if f >= width {
		return sb.String()
	}
	sb.WriteString(ss.barHead.Render("╸"))
	sb.WriteString(ss.barVoid.Render(strings.Repeat("─", width-f)))
	return sb.String()
}

// fmtClock 毫秒 → mm:ss(零填充;≥1h 用 h:mm:ss)。
func fmtClock(ms int64) string {
	if ms < 0 {
		ms = 0
	}
	total := ms / 1000
	h := total / 3600
	m := (total % 3600) / 60
	s := total % 60
	if h > 0 {
		return fmt.Sprintf("%d:%02d:%02d", h, m, s)
	}
	return fmt.Sprintf("%02d:%02d", m, s)
}

// yearOf 专辑发行时间 → 年份。网易云原始格式不一:
// 毫秒时间戳字符串("745574400000")、日期串("1993-05-14")、裸年份("1993")。
// 规则:≤4 位纯数字当年份;更长的纯数字当毫秒时间戳;含 - 取首段;其余放弃。
func yearOf(publishTime string) string {
	s := strings.TrimSpace(publishTime)
	if s == "" {
		return ""
	}
	if i := strings.IndexByte(s, '-'); i > 0 {
		s = s[:i]
	}
	if len(s) > 4 {
		ms, err := strconv.ParseInt(s, 10, 64)
		if err != nil {
			return ""
		}
		return strconv.Itoa(time.UnixMilli(ms).Year())
	}
	if _, err := strconv.Atoi(s); err != nil {
		return ""
	}
	return s
}
