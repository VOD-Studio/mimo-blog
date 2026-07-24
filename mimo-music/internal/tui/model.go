// Package tui 播放屏 bubbletea 模型(PRD-0016)。
//
// 架构:Model 纯化(Init/Update/View 不直接碰 io),Player 用接口消费;
// 命令层(song play)负责 flag/守卫/音源/缓冲/beep 装配,起播后把
// (Player, SongMeta, 歌词, 音量)交给 Run,由 tea.Program 接管终端
// (alt-screen 全屏,输出走 stderr,stdout 保持干净)。
//
// T1 切片(tracer bullet):顶栏标题+音质徽章、进度条+音量、键位栏、
// help/info 居中 popup、歌词简单窗口(沿用 currentLyricIndex 语义)。
// 歌词舞台/封面/取色/动画属 T2-T4。
package tui

import (
	"io"
	"os"
	"time"

	tea "charm.land/bubbletea/v2"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// 终端最小可用尺寸:小于该尺寸显示「终端窗口过小」提示(PRD 行为对齐清单)。
const (
	minWidth  = 40
	minHeight = 12
)

// SongMeta 播放屏元数据。命令层从 mmpb.Song/SongURL 转换,tui 不依赖 proto。
type SongMeta struct {
	ID          int64  // 歌曲 ID(Name 为空时兜底展示)
	Name        string // 歌名
	Artist      string // 主艺人
	Album       string // 专辑名
	PublishTime string // 专辑发行时间原始串(yearOf 解析)
	Level       int    // 音质 level(info popup 展示)
	Format      string // 音源格式(mp3/flac)
	Bitrate     int64  // 码率 bps(徽章展示 kbps)
	URL         string // 音源 URL(info popup 展示)
}

// Model 播放屏模型。值类型,Update 返回拷贝(bubbletea 惯例)。
type Model struct {
	p     player.Player
	meta  SongMeta
	vol   int // 用户设定音量(muted 时保留,取消静音恢复)
	muted bool

	// lyric 按时间轴排序的歌词行(nil = 无歌词,不渲染窗口)。
	lyric []player.TimedLine

	showHelp bool
	showInfo bool
	notice   string // 一次性提示,下次按键清除(语义沿旧状态栏)

	width  int
	height int

	// 最近一次 Progress 采样(tick 驱动,View 只读采样值不碰 Player)。
	curMs   int64
	totalMs int64
	state   player.State

	refreshEvery time.Duration
}

// config Run 的可选配置(测试注入 input/output/尺寸)。
type config struct {
	input       io.Reader
	output      io.Writer
	refreshEvery time.Duration
	notice      string
	width       int
	height      int
}

// Option 配置 Run。
type Option func(*config)

// WithInput 自定义输入(生产默认 os.Stdin;测试注入脚本/管道)。
func WithInput(r io.Reader) Option {
	return func(c *config) { c.input = r }
}

// WithOutput 自定义输出(生产默认 os.Stderr;测试注入 buffer)。
func WithOutput(w io.Writer) Option {
	return func(c *config) { c.output = w }
}

// WithRefreshEvery 进度采样周期(命令层沿 refreshEvery 传入)。
func WithRefreshEvery(d time.Duration) Option {
	return func(c *config) { c.refreshEvery = d }
}

// WithNotice 初始一次性提示(歌词降级原因等,进 TUI 即可见)。
func WithNotice(s string) Option {
	return func(c *config) { c.notice = s }
}

// WithInitialSize 注入初始窗口尺寸(生产 <=0 由终端探测;测试非 TTY 必传)。
func WithInitialSize(width, height int) Option {
	return func(c *config) { c.width, c.height = width, height }
}

// New 构造播放屏模型。vol 为启动音量(0-100,命令层已校验)。
func New(p player.Player, meta SongMeta, lyric []player.TimedLine, vol int, opts ...Option) Model {
	cfg := config{refreshEvery: 200 * time.Millisecond}
	for _, o := range opts {
		o(&cfg)
	}
	m := Model{
		p:            p,
		meta:         meta,
		vol:          vol,
		lyric:        lyric,
		notice:       cfg.notice,
		width:        cfg.width,
		height:       cfg.height,
		refreshEvery: cfg.refreshEvery,
	}
	m.sample()
	return m
}

// tickMsg 进度采样节拍。
type tickMsg time.Time

func (m Model) tickCmd() tea.Cmd {
	return tea.Tick(m.refreshEvery, func(t time.Time) tea.Msg { return tickMsg(t) })
}

// sample 采样 Player.Progress(Buffering 时返回已缓冲/水位,其余返回位置/总时长)。
func (m *Model) sample() {
	m.curMs, m.totalMs, m.state = m.p.Progress()
}

// Init 启动进度采样节拍。
func (m Model) Init() tea.Cmd {
	return m.tickCmd()
}

// Update 消息分派:窗口尺寸 / 采样节拍 / 键盘。
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width, m.height = msg.Width, msg.Height
		return m, nil
	case tickMsg:
		m.sample()
		return m, m.tickCmd()
	case tea.KeyPressMsg:
		return m.handleKey(msg)
	}
	return m, nil
}

// View 渲染(alt-screen 全屏,退出后终端原内容由 bubbletea 恢复)。
func (m Model) View() tea.View {
	v := tea.NewView(m.render())
	v.AltScreen = true
	return v
}

// eofQuitReader 包装输入:读到 EOF 时触发 onEOF(用于 program.Quit)。
//
// bubbletea v2 的输入循环把 EOF 当正常结束(ultraviolet StreamEvents 返回 nil),
// readLoop 退出但不发任何消息,program 不会自动退出——旧实现语义是
// 「stdin EOF → 退出」,这里显式补齐。onEOF 异步延迟触发:EOF 与末批按键
// 同缓冲到达时(管道/脚本输入),让已读字节先解析分派,再退出,避免 Quit
// 插队吞掉末尾按键。
type eofQuitReader struct {
	r     io.Reader
	onEOF func()
}

func (e eofQuitReader) Read(b []byte) (int, error) {
	n, err := e.r.Read(b)
	if err == io.EOF && e.onEOF != nil {
		onEOF := e.onEOF
		go func() {
			time.Sleep(100 * time.Millisecond)
			onEOF()
		}()
	}
	return n, err
}

// Run 接管终端运行播放屏,直到用户退出(q/Esc/Ctrl-C)或 stdin EOF。
// 输出走 stderr(默认),stdout 保持干净。
func Run(p player.Player, meta SongMeta, lyric []player.TimedLine, vol int, opts ...Option) error {
	cfg := config{
		input:        os.Stdin,
		output:       os.Stderr,
		refreshEvery: 200 * time.Millisecond,
	}
	for _, o := range opts {
		o(&cfg)
	}
	m := New(p, meta, lyric, vol, opts...)

	var prog *tea.Program
	input := eofQuitReader{r: cfg.input, onEOF: func() {
		if prog != nil {
			prog.Quit()
		}
	}}
	progOpts := []tea.ProgramOption{
		tea.WithInput(input),
		tea.WithOutput(cfg.output),
	}
	if cfg.width > 0 && cfg.height > 0 {
		progOpts = append(progOpts, tea.WithWindowSize(cfg.width, cfg.height))
	}
	prog = tea.NewProgram(m, progOpts...)
	_, err := prog.Run()
	return err
}
