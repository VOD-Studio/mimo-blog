package tui

import "github.com/charmbracelet/lipgloss"

// 调色板无关的中性色(渐暗/空段/占位)。
var (
	colorDim   = lipgloss.Color("#626262")
	colorFaint = lipgloss.Color("#3C3C3C")
)

var (
	dimStyle   = lipgloss.NewStyle().Foreground(colorDim)
	faintStyle = lipgloss.NewStyle().Foreground(colorFaint)
	// 歌词舞台渐暗两档:±1 行近(稍暗)、±2 行远(最暗);当前行 styleSet.lyric 高亮。
	nearStyle = dimStyle
	farStyle  = faintStyle
)

// 渐变档位数(预计算,帧循环零插值开销)。
const gradientSteps = 32

// styleSet 按调色板派生的样式集。Model 持有:启动默认调色板,
// 封面加载后按取色重建一次(T4;不进帧循环)。
type styleSet struct {
	palette palette

	title  lipgloss.Style // 顶栏标题(bold,无色彩)
	badge  lipgloss.Style // 音质徽章(主色)
	lyric  lipgloss.Style // 歌词当前行(强调色高亮 bold)
	notice lipgloss.Style // notice 浮层(强调色)
	popup  lipgloss.Style // help/info/占位边框(主色)

	barHead lipgloss.Style // 进度条头部(强调色)
	barVoid lipgloss.Style // 进度条空段
	volFill lipgloss.Color // 音量条填充(主色)
	volVoid lipgloss.Style

	// gradient 进度条渐变预计算(主→强调,gradientSteps+1 档样式)。
	gradient []lipgloss.Style
}

// newStyleSet 从调色板构建样式集(含渐变预计算)。
func newStyleSet(p palette) styleSet {
	gradient := make([]lipgloss.Style, gradientSteps+1)
	for i := range gradient {
		gradient[i] = lipgloss.NewStyle().Foreground(lerpHSL(p.primary, p.accent, float64(i)/gradientSteps).color())
	}
	return styleSet{
		palette:  p,
		title:    lipgloss.NewStyle().Bold(true),
		badge:    lipgloss.NewStyle().Foreground(p.primary.color()).Bold(true),
		lyric:    lipgloss.NewStyle().Foreground(p.accent.color()).Bold(true),
		notice:   lipgloss.NewStyle().Foreground(p.accent.color()),
		popup:    lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).BorderForeground(p.primary.color()).Padding(0, 2),
		barHead:  lipgloss.NewStyle().Foreground(p.accent.color()),
		barVoid:  lipgloss.NewStyle().Foreground(colorFaint),
		volFill:  p.primary.color(),
		volVoid:  lipgloss.NewStyle().Foreground(colorFaint),
		gradient: gradient,
	}
}
