package tui

import "github.com/charmbracelet/lipgloss"

// 默认调色板(PRD-0016:Charm 紫粉渐变)。
// T1 切片固定使用;T4 封面取色后按歌覆盖(主色/强调色来自封面)。
var (
	colorPrimary = lipgloss.Color("#7D56F4")
	colorAccent  = lipgloss.Color("#EE6FF8")
	colorDim     = lipgloss.Color("#626262")
	colorFaint   = lipgloss.Color("#3C3C3C")
)

var (
	titleStyle   = lipgloss.NewStyle().Bold(true)
	badgeStyle   = lipgloss.NewStyle().Foreground(colorPrimary).Bold(true)
	dimStyle     = lipgloss.NewStyle().Foreground(colorDim)
	faintStyle   = lipgloss.NewStyle().Foreground(colorFaint)
	lyricStyle   = lipgloss.NewStyle().Foreground(colorAccent).Bold(true)
	noticeStyle  = lipgloss.NewStyle().Foreground(colorAccent)
	barFillStyle = lipgloss.NewStyle().Foreground(colorPrimary)
	barHeadStyle = lipgloss.NewStyle().Foreground(colorAccent)
	barVoidStyle = lipgloss.NewStyle().Foreground(colorFaint)
	volFillStyle = lipgloss.NewStyle().Foreground(colorPrimary)
	volVoidStyle = lipgloss.NewStyle().Foreground(colorFaint)
	popupStyle   = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(colorPrimary).
			Padding(0, 2)
)
