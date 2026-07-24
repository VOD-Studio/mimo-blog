package tui

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/lipgloss"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// 底部固定行数:进度行 + notice 行 + 键位栏。顶栏 1 行。
const fixedLines = 4

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

	notice := ""
	if m.notice != "" {
		notice = noticeStyle.Render(m.notice)
	}
	return lipgloss.JoinVertical(lipgloss.Left,
		m.topBar(),
		mid,
		m.progressLine(),
		notice,
		" "+dimStyle.Render("空格 暂停 · ← → ∓10s · ↑ ↓ 音量 · q 退出 · ? 帮助"),
	)
}

// midContent 屏幕中央区:help/info 居中 popup 优先,否则歌词窗口,均无则空。
func (m Model) midContent() string {
	switch {
	case m.showHelp:
		return m.helpPopup()
	case m.showInfo:
		return m.infoPopup()
	case len(m.lyric) > 0:
		return m.lyricWindow()
	default:
		return ""
	}
}

// topBar 顶栏:♪ 标题(左) + 音质徽章(右)。
func (m Model) topBar() string {
	title := titleStyle.Render("♪ " + m.title())
	badge := ""
	if m.meta.Format != "" {
		badge = badgeStyle.Render(fmt.Sprintf("%s %dkbps", m.meta.Format, m.meta.Bitrate/1000))
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
	right := fmt.Sprintf(" %s  %s", fmtClock(m.totalMs), m.volumeBar())
	barW := m.width - lipgloss.Width(left) - lipgloss.Width(right)
	return left + bar(m.curMs, m.totalMs, barW) + right
}

// lyricWindow 歌词简单窗口(T1 沿旧面板语义):上一行 + > 当前行 + 下一行。
// 当前行用 currentLyricIndex 二分查找;首/末行缺省的上下文行留空。
// 舞台化(5 行视口/渐暗/弹簧)属 T2。
func (m Model) lyricWindow() string {
	idx := currentLyricIndex(m.lyric, m.curMs)
	prev, cur, next := "", "", ""
	if idx > 0 {
		prev = m.lyric[idx-1].Text
	}
	cur = m.lyric[idx].Text
	if idx+1 < len(m.lyric) {
		next = m.lyric[idx+1].Text
	}
	return lipgloss.JoinVertical(lipgloss.Center,
		dimStyle.Render(prev),
		lyricStyle.Render("> "+cur),
		dimStyle.Render(next),
	)
}

// helpPopup 键位帮助(居中 styled popup,文案沿旧 helpLines)。
func (m Model) helpPopup() string {
	return popupStyle.Render(lipgloss.JoinVertical(lipgloss.Left,
		titleStyle.Render("帮助"),
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
	return popupStyle.Render(lipgloss.JoinVertical(lipgloss.Left,
		titleStyle.Render("歌曲详情"),
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

// volumeBar 音量行内嵌段:🔊 ▓▓▓░░ 62%(静音 🔇)。
func (m Model) volumeBar() string {
	icon := "🔊"
	if m.muted {
		icon = "🔇"
	}
	vol := m.effectiveVol()
	const width = 5
	filled := vol * width / 100
	return fmt.Sprintf("%s %s%s %d%%",
		icon,
		volFillStyle.Render(strings.Repeat("▓", filled)),
		volVoidStyle.Render(strings.Repeat("░", width-filled)),
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

// bar 定宽进度条:━ 填充 + ╸ 头部 + ─ 空;total ≤ 0(未知)全空。
// cur 越界收敛到 [0,total]。填充/头部/空段染默认调色板(T4 改封面取色)。
func bar(cur, total int64, width int) string {
	if width < 2 {
		width = 2
	}
	if total <= 0 || cur <= 0 {
		return barVoidStyle.Render(strings.Repeat("─", width))
	}
	f := int(cur * int64(width) / total)
	if f <= 0 {
		// cur>0 但不足一格(起播瞬间):不画头部,避免负 Repeat。
		return barVoidStyle.Render(strings.Repeat("─", width))
	}
	if f >= width {
		return barFillStyle.Render(strings.Repeat("━", width))
	}
	return barFillStyle.Render(strings.Repeat("━", f-1)) +
		barHeadStyle.Render("╸") +
		barVoidStyle.Render(strings.Repeat("─", width-f))
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
