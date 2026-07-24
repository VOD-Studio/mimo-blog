// Package tui 播放屏 bubbletea 模型(PRD-0016)。
//
// 架构:Model 纯化(Init/Update/View 不直接碰 io),Player 用接口消费;
// 命令层(song play)负责 flag/守卫/音源/缓冲/beep 装配,起播后把
// (Player, SongMeta, 歌词, 音量)交给 Run,由 tea.Program 接管终端
// (alt-screen 全屏,输出走 stderr,stdout 保持干净)。
//
// T1 切片:顶栏标题+音质徽章、进度条、键位栏、help/info 居中 popup。
// T2 切片:歌词舞台(5 行视口/渐暗/弹簧滚动,默认拉取)、音量/notice
// 浮层(弹簧入场,音量 1.5s 淡出)。封面/取色属 T3/T4。
package tui

import (
	"fmt"
	"image"
	"io"
	"os"
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/charmbracelet/harmonica"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// 终端最小可用尺寸:小于该尺寸显示「终端窗口过小」提示(PRD 行为对齐清单)。
const (
	minWidth  = 40
	minHeight = 12
)

// 节拍:进度采样 100ms(不加密 Player.Progress 调用);动画帧 ~30fps
// (弹簧插值纯内存态,不碰 Player)。
const (
	sampleEvery = 100 * time.Millisecond
	frameFPS    = 30
)

// overlayFadeAfter 音量浮层无操作淡出时长(PRD:1.5s)。
const overlayFadeAfter = 1500 * time.Millisecond

// overlayKind 浮层类别。音量/notice 同通道(同一浮层位,互斥展示)。
type overlayKind int

const (
	overlayNone overlayKind = iota
	// overlayVolume 音量/静音键触发的音量浮层(弹簧入场,1.5s 无操作淡出)。
	overlayVolume
	// overlayNotice 一次性提示(seek 失败、歌词降级原因等;下次按键清除,不自动淡出)。
	overlayNotice
)

// SongMeta 播放屏元数据。命令层从 mmpb.Song/SongURL 转换,tui 不依赖 proto。
type SongMeta struct {
	ID          int64  // 歌曲 ID(Name 为空时兜底展示)
	Name        string // 歌名
	Artist      string // 主艺人
	Album       string // 专辑名
	PublishTime string // 专辑发行时间原始串(yearOf 解析)
	PicURL      string // 专辑封面 URL(Album.PicUrl;空 = 无封面,占位)
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

	// lyric 按时间轴排序的歌词行(nil = 无歌词,不渲染舞台)。
	lyric []player.TimedLine

	showHelp bool
	showInfo bool

	// 封面(T3):协议矩阵渲染。coverImg 解码一次(T4 取色复用);
	// coverLines 为加载时的渲染缓存(View 纯);coverTransmitted 标记 kitty
	// 已传输(退出时按 id 删除)。
	coverProto       coverProtocol
	coverFetch       coverFetcher
	coverImg         image.Image
	coverLines       []string
	coverFailed      bool
	coverTransmitted bool

	// overlay 浮层(音量/notice 同通道);notice 为 overlayNotice 的文本内容。
	overlay   overlayKind
	overlayAt time.Time
	notice    string

	// 弹簧态(行单位)。stage:歌词换行滑入;overlay:浮层入场。
	stageSpring   harmonica.Spring
	stageOffset   float64
	stageVel      float64
	lastLyricIdx  int
	overlaySpring harmonica.Spring
	overlayOffset float64
	overlayVel    float64

	// styles 按调色板派生的样式集(默认调色板;封面加载后按取色重建一次)。
	styles styleSet

	width  int
	height int

	// 最近一次 Progress 采样(sampleTick 驱动,View 只读采样值不碰 Player)。
	curMs   int64
	totalMs int64
	state   player.State

	sampleEvery time.Duration
	now         func() time.Time
}

// config Run 的可选配置(测试注入 input/output/尺寸/时钟)。
type config struct {
	input       io.Reader
	output      io.Writer
	sampleEvery time.Duration
	notice      string
	width       int
	height      int
	now         func() time.Time
	getenv      func(string) string
	coverFetch  coverFetcher
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

// WithSampleEvery 进度采样周期(默认 100ms;测试可加速)。
func WithSampleEvery(d time.Duration) Option {
	return func(c *config) { c.sampleEvery = d }
}

// WithNotice 初始一次性提示(歌词降级原因等,进 TUI 即浮层可见)。
func WithNotice(s string) Option {
	return func(c *config) { c.notice = s }
}

// WithInitialSize 注入初始窗口尺寸(生产 <=0 由终端探测;测试非 TTY 必传)。
func WithInitialSize(width, height int) Option {
	return func(c *config) { c.width, c.height = width, height }
}

// WithClock 注入时钟(测试控制浮层淡出计时)。
func WithClock(now func() time.Time) Option {
	return func(c *config) { c.now = now }
}

// WithEnviron 注入环境变量读取(测试协议检测矩阵;生产 os.Getenv)。
func WithEnviron(getenv func(string) string) Option {
	return func(c *config) { c.getenv = getenv }
}

// WithCoverFetcher 注入封面拉取(测试合成图;生产 songdl.FetchCover)。
func WithCoverFetcher(fetch coverFetcher) Option {
	return func(c *config) { c.coverFetch = fetch }
}

// New 构造播放屏模型。vol 为启动音量(0-100,命令层已校验)。
func New(p player.Player, meta SongMeta, lyric []player.TimedLine, vol int, opts ...Option) Model {
	cfg := config{sampleEvery: sampleEvery, now: time.Now, getenv: os.Getenv, coverFetch: defaultCoverFetcher}
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
		sampleEvery:  cfg.sampleEvery,
		now:          cfg.now,
		coverProto:   detectCoverProtocol(cfg.getenv),
		coverFetch:   cfg.coverFetch,
		styles:       newStyleSet(defaultPalette),
		stageSpring:  harmonica.NewSpring(harmonica.FPS(frameFPS), 6.0, 0.7),
		overlaySpring: harmonica.NewSpring(harmonica.FPS(frameFPS), 6.0, 0.7),
	}
	m.sample()
	// 初始对齐歌词行(如 --start 跳到中段),不触发入场弹簧。
	m.stageOffset = 0
	m.stageVel = 0
	m.lastLyricIdx = currentLyricIndex(m.lyric, m.curMs)
	if cfg.notice != "" {
		// 初始 notice(歌词降级原因)直接可见,不走入场弹簧。
		m.overlay = overlayNotice
		m.overlayAt = m.now()
	}
	return m
}

// sampleTickMsg 进度采样节拍(100ms)。
type sampleTickMsg time.Time

// frameMsg 动画帧节拍(~30fps,弹簧插值)。
type frameMsg time.Time

func (m Model) sampleTickCmd() tea.Cmd {
	return tea.Tick(m.sampleEvery, func(t time.Time) tea.Msg { return sampleTickMsg(t) })
}

func (m Model) frameCmd() tea.Cmd {
	return tea.Tick(time.Second/frameFPS, func(t time.Time) tea.Msg { return frameMsg(t) })
}

// sample 采样 Player.Progress(Buffering 时返回已缓冲/水位,其余返回位置/总时长)。
// 歌词当前行变化时触发舞台弹簧(新行从 ±1 行偏移滑入)。
func (m *Model) sample() {
	m.curMs, m.totalMs, m.state = m.p.Progress()
	if len(m.lyric) > 0 {
		if idx := currentLyricIndex(m.lyric, m.curMs); idx != m.lastLyricIdx {
			if idx > m.lastLyricIdx {
				m.stageOffset = 1 // 前进:新行从下方滑入
			} else {
				m.stageOffset = -1 // 回退(seek):从上方滑回
			}
			m.stageVel = 0
			m.lastLyricIdx = idx
		}
	}
}

// Init 启动采样 + 动画双节拍;有封面 URL 且协议未关闭时异步拉取封面。
func (m Model) Init() tea.Cmd {
	cmds := []tea.Cmd{m.sampleTickCmd(), m.frameCmd()}
	if m.meta.PicURL != "" && m.coverProto != coverOff {
		cmds = append(cmds, fetchCoverCmd(m.coverFetch, m.meta.PicURL))
	}
	return tea.Batch(cmds...)
}

// Update 消息分派:窗口尺寸 / 采样节拍 / 动画帧 / 键盘。
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width, m.height = msg.Width, msg.Height
		return m, nil
	case sampleTickMsg:
		m.sample()
		return m, m.sampleTickCmd()
	case frameMsg:
		// 弹簧插值(纯内存态,不碰 Player)。
		m.stageOffset, m.stageVel = m.stageSpring.Update(m.stageOffset, m.stageVel, 0)
		if m.overlay != overlayNone {
			m.overlayOffset, m.overlayVel = m.overlaySpring.Update(m.overlayOffset, m.overlayVel, 0)
		}
		// 音量浮层 1.5s 无操作淡出;notice 不自动淡(下次按键清除)。
		if m.overlay == overlayVolume && m.now().Sub(m.overlayAt) > overlayFadeAfter {
			m.overlay = overlayNone
		}
		return m, m.frameCmd()
	case coverLoadedMsg:
		// 封面就绪:渲染缓存一次,View 纯读缓存;取色一次重建样式(T4,不进帧循环)。
		m.coverImg = msg.img
		m.styles = newStyleSet(paletteFromImage(msg.img))
		cols, rows := m.coverRect()
		m.coverLines = renderCoverLines(m.coverProto, msg.png, msg.img, cols, rows)
		if m.coverProto == coverKitty {
			// 一次性传输(transmit-once);View 行只含 placement。
			m.coverTransmitted = true
			return m, tea.Raw(kittyTransmitSeq(msg.png))
		}
		return m, nil
	case coverFailedMsg:
		// 拉取/解码失败静默降级:占位展示(布局不变),取色用默认调色板。
		m.coverFailed = true
		return m, nil
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
		input:       os.Stdin,
		output:      os.Stderr,
		sampleEvery: sampleEvery,
		now:         time.Now,
		getenv:      os.Getenv,
		coverFetch:  defaultCoverFetcher,
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
	final, err := prog.Run()
	// 退出清理:kitty 已传输图像按 id 删除,不残留像素内存(覆盖 q/Esc/EOF 全路径)。
	if fm, ok := final.(Model); ok && fm.coverTransmitted {
		_, _ = fmt.Fprint(cfg.output, kittyDeleteSeq())
	}
	return err
}
