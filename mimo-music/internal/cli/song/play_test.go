// song play 命令层测试(issue #21;播放屏 bubbletea 化后调整为 PRD-0016 T1,issue #62)。
//
// seam:Player 接口用 fakePlayer 替身(不测 beep,音频硬件留真机 smoke);
// TUI 用 fake runTUI 记录交接参数(终端渲染归 tui 包测试)。
// 纯函数 seam:parseStart。
package song

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"

	mmpb "github.com/VOD-Studio/mimo-music/gen/go/netease/music/v1"
	"github.com/VOD-Studio/mimo-music/internal/cli/kit"
	"github.com/VOD-Studio/mimo-music/internal/cli/player"
	"github.com/VOD-Studio/mimo-music/internal/tui"
)

// ==================== fakePlayer(Player seam) ====================

// fakePlayer 记录方法调用序列,模拟状态机(Play→Playing,Pause→Paused)。
// Progress/State 不记录(显示循环高频读,记录会淹没断言)。
type fakePlayer struct {
	mu        sync.Mutex
	loadedURL string
	state     player.State
	curMs     int64
	totalMs   int64
	vol       int
	playErr   error // Play 返回该错误(模拟 headless 音频设备初始化失败)
	calls     []string
	closed    bool
}

func (f *fakePlayer) record(format string, args ...any) {
	f.calls = append(f.calls, fmt.Sprintf(format, args...))
}

func (f *fakePlayer) Load(url string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.loadedURL = url
	f.state = player.StateBuffering
	f.record("Load(%s)", url)
	return nil
}

func (f *fakePlayer) Play() error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.record("Play")
	if f.playErr != nil {
		return f.playErr
	}
	f.state = player.StatePlaying
	return nil
}

func (f *fakePlayer) Pause() error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.record("Pause")
	f.state = player.StatePaused
	return nil
}

func (f *fakePlayer) Seek(offsetSec int64) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.record("Seek(%d)", offsetSec)
	f.curMs += offsetSec * 1000
	if f.curMs < 0 {
		f.curMs = 0
	}
	if f.totalMs > 0 && f.curMs > f.totalMs {
		f.curMs = f.totalMs
	}
	return nil
}

func (f *fakePlayer) Volume(delta int) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.record("Volume(%d)", delta)
	f.vol = min(100, max(0, f.vol+delta))
	return nil
}

func (f *fakePlayer) Progress() (int64, int64, player.State) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.curMs, f.totalMs, f.state
}

func (f *fakePlayer) State() player.State {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.state
}

func (f *fakePlayer) Close() error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.closed = true
	f.record("Close")
	return nil
}

// callsSnapshot 取调用序列副本(显示循环并发读 Progress,调用序列需锁保护)。
func (f *fakePlayer) callsSnapshot() []string {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]string(nil), f.calls...)
}

// ==================== 测试依赖 ====================

// tuiHandoff 记录 runPlay → runTUI 的交接参数。
type tuiHandoff struct {
	called bool
	meta   tui.SongMeta
	lyric  []player.TimedLine
	vol    int
	notice string
	err    error // runTUI 返回该错误(模拟 TUI 运行失败)
}

// testPlayDeps 构造测试依赖:mock 网络 + fakePlayer + fake runTUI + 假终端。
func testPlayDeps(p *fakePlayer, handoff *tuiHandoff) playDeps {
	return playDeps{
		fetchURL: func(_ context.Context, id int64, _ int) (*mmpb.SongURL, error) {
			return &mmpb.SongURL{
				Id: id, Url: "http://cdn.example.com/test.mp3",
				Bitrate: 320000, Size: 3400000, Format: "mp3",
			}, nil
		},
		fetchDetail: func(_ context.Context, id int64) (*mmpb.Song, error) {
			return &mmpb.Song{
				Id:   id,
				Name: "海阔天空",
				Artists: []*mmpb.Artist{
					{Name: "Beyond"},
				},
				Album:      &mmpb.Album{Name: "乐与怒", PublishTime: "1993-05-14"},
				DurationMs: 323000,
			}, nil
		},
		newPlayer: func(volume int) player.Player {
			p.vol = volume
			return p
		},
		stdinIsTTY: func() bool { return true },
		runTUI: func(p player.Player, meta tui.SongMeta, lyric []player.TimedLine, vol int, notice string) error {
			handoff.called = true
			handoff.meta = meta
			handoff.lyric = lyric
			handoff.vol = vol
			handoff.notice = notice
			return handoff.err
		},
		ui: &bytes.Buffer{},
	}
}

// ==================== 纯函数 seam ====================

// TestParseStart --start 解析:秒数或 mm:ss(PRD flag 规格)。
func TestParseStart(t *testing.T) {
	t.Parallel()
	cases := []struct {
		in      string
		want    int64
		wantErr bool
	}{
		{"0", 0, false},
		{"90", 90, false},
		{"1:30", 90, false},
		{"05:23", 323, false},
		{"", 0, false},
		{"abc", 0, true},
		{"-5", 0, true},
		{"1:xx", 0, true},
	}
	for _, tc := range cases {
		got, err := parseStart(tc.in)
		if tc.wantErr {
			if err == nil {
				t.Errorf("parseStart(%q) 应报错,got %d", tc.in, got)
			}
			continue
		}
		if err != nil || got != tc.want {
			t.Errorf("parseStart(%q) = %d, %v; want %d", tc.in, got, err, tc.want)
		}
	}
}

// ==================== 命令层流程(fakePlayer + fake runTUI) ====================

// TestRunPlay_NonTTY 非 TTY stdin → ErrUsage(exit 2),消息指定。
func TestRunPlay_NonTTY(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	deps.stdinIsTTY = func() bool { return false }
	err := runPlay(k, 347230, 1, 75, "0", false, deps)
	if !errors.Is(err, kit.ErrUsage) {
		t.Fatalf("非 TTY 应返回 ErrUsage(exit 2),got %v", err)
	}
	if !strings.Contains(err.Error(), "播放命令需要交互式终端") {
		t.Errorf("消息不符,got %q", err.Error())
	}
}

// TestRunPlay_JSON --json → ErrUsage(exit 2),提示不支持。
func TestRunPlay_JSON(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	k.JSON = true
	p := &fakePlayer{}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	err := runPlay(k, 347230, 1, 75, "0", false, deps)
	if !errors.Is(err, kit.ErrUsage) {
		t.Fatalf("--json 应返回 ErrUsage(exit 2),got %v", err)
	}
	if !strings.Contains(err.Error(), "播放命令不支持 --json(交互命令)") {
		t.Errorf("消息不符,got %q", err.Error())
	}
}

// TestRunPlay_NoSource 音源 URL 为空 → exit 1 无可用音源。
func TestRunPlay_NoSource(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	deps.fetchURL = func(_ context.Context, _ int64, _ int) (*mmpb.SongURL, error) {
		return &mmpb.SongURL{}, nil
	}
	err := runPlay(k, 347230, 1, 75, "0", false, deps)
	if err == nil || !strings.Contains(err.Error(), "无可用音源") {
		t.Fatalf("空音源应报「无可用音源」,got %v", err)
	}
}

// TestRunPlay_LoadURLAndHandoff Load 用拿到的 URL 调用;TUI 交接元数据完整;
// runTUI 返回后 Close + exit 0。
func TestRunPlay_LoadURLAndHandoff(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{totalMs: 323000}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	if err := runPlay(k, 347230, 1, 75, "0", false, deps); err != nil {
		t.Fatalf("正常流程应 exit 0,got %v", err)
	}
	if p.loadedURL != "http://cdn.example.com/test.mp3" {
		t.Errorf("Load 应用音源 URL 调用,got %q", p.loadedURL)
	}
	if !p.closed {
		t.Error("退出应 Close 播放器")
	}
	calls := p.callsSnapshot()
	if len(calls) < 3 || calls[0] != "Load(http://cdn.example.com/test.mp3)" || calls[1] != "Play" {
		t.Errorf("调用序列应以 Load → Play 开头,got %v", calls)
	}
	// TUI 交接:元数据/启动音量。
	if !handoff.called {
		t.Fatal("应调用 runTUI 接管终端")
	}
	if handoff.meta.Name != "海阔天空" || handoff.meta.Artist != "Beyond" ||
		handoff.meta.Album != "乐与怒" || handoff.meta.PublishTime != "1993-05-14" {
		t.Errorf("交接元数据不符,got %+v", handoff.meta)
	}
	if handoff.meta.Format != "mp3" || handoff.meta.Bitrate != 320000 ||
		handoff.meta.URL != "http://cdn.example.com/test.mp3" || handoff.meta.Level != 1 {
		t.Errorf("交接音源信息不符,got %+v", handoff.meta)
	}
	if handoff.vol != 75 {
		t.Errorf("交接启动音量应 75,got %d", handoff.vol)
	}
	// 进 TUI 前的解析进度输出走 stderr(ui)。
	ui, _ := deps.ui.(*bytes.Buffer)
	if !strings.Contains(ui.String(), "解析音源 ✓ level=1 mp3 320kbps") {
		t.Errorf("解析进度应输出,got %q", ui.String())
	}
}

// TestRunPlay_TUIError runTUI 失败 → exit 1 传播错误。
func TestRunPlay_TUIError(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{totalMs: 323000}
	handoff := &tuiHandoff{err: errors.New("终端进入原始模式失败")}
	deps := testPlayDeps(p, handoff)
	err := runPlay(k, 347230, 1, 75, "0", false, deps)
	if err == nil || !strings.Contains(err.Error(), "播放屏运行失败") {
		t.Fatalf("TUI 失败应传播,got %v", err)
	}
	if !p.closed {
		t.Error("失败路径也应 Close 播放器")
	}
}

// TestRunPlay_HeadlessPlayError 音频设备初始化失败 → exit 1 带 headless 可操作消息。
func TestRunPlay_HeadlessPlayError(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{
		playErr: errors.New("无法初始化音频输出(beep): oto: no available device; headless 环境请用 song download"),
	}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	err := runPlay(k, 347230, 1, 75, "0", false, deps)
	if err == nil {
		t.Fatal("headless 应返回错误")
	}
	if !strings.Contains(err.Error(), "headless 环境请用 song download") {
		t.Errorf("应含可操作提示,got %q", err.Error())
	}
	if errors.Is(err, kit.ErrUsage) {
		t.Errorf("设备失败是 exit 1,不是用法错误,got %v", err)
	}
	if !p.closed {
		t.Error("失败路径也应 Close 播放器")
	}
}

// TestRunPlay_VolumeRange --volume 越界 → ErrUsage(exit 2)。
func TestRunPlay_VolumeRange(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	if err := runPlay(k, 347230, 1, 101, "0", false, deps); !errors.Is(err, kit.ErrUsage) {
		t.Fatalf("--volume 101 应返回 ErrUsage,got %v", err)
	}
}

// TestRunPlay_StartSeek --start 1:00 → 起播后 Seek(60)。
func TestRunPlay_StartSeek(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{totalMs: 323000}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	if err := runPlay(k, 347230, 1, 75, "1:00", false, deps); err != nil {
		t.Fatalf("运行失败: %v", err)
	}
	calls := p.callsSnapshot()
	found := false
	for _, c := range calls {
		if c == "Seek(60)" {
			found = true
		}
	}
	if !found {
		t.Errorf("--start 1:00 应 Seek(60),got %v", calls)
	}
}

// TestRunPlay_BadStart --start 非法 → ErrUsage。
func TestRunPlay_BadStart(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	if err := runPlay(k, 347230, 1, 75, "abc", false, deps); !errors.Is(err, kit.ErrUsage) {
		t.Fatalf("--start abc 应返回 ErrUsage,got %v", err)
	}
}

// ==================== --lyric 模式(issue #22)====================

// TestRunPlay_LyricFlag --lyric=true 触发 fetchLyric 调用,歌词交给 TUI。
func TestRunPlay_LyricFlag(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{totalMs: 323000}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	fetched := false
	deps.fetchLyric = func(_ context.Context, _ int64) (string, error) {
		fetched = true
		return "[00:01.00]第一行\n[00:02.00]第二行\n", nil
	}
	if err := runPlay(k, 347230, 1, 75, "0", true, deps); err != nil {
		t.Fatalf("运行失败: %v", err)
	}
	if !fetched {
		t.Error("--lyric 应调用 fetchLyric")
	}
	if len(handoff.lyric) != 2 || handoff.lyric[0].Text != "第一行" {
		t.Errorf("歌词应解析并交接 TUI,got %+v", handoff.lyric)
	}
}

// TestRunPlay_LyricOff_NoFetch --lyric=false 不调 fetchLyric,交接 nil。
func TestRunPlay_LyricOff_NoFetch(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	p := &fakePlayer{totalMs: 323000}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	deps.fetchLyric = func(_ context.Context, _ int64) (string, error) {
		t.Error("--lyric=false 不应调用 fetchLyric")
		return "", nil
	}
	if err := runPlay(k, 347230, 1, 75, "0", false, deps); err != nil {
		t.Fatalf("运行失败: %v", err)
	}
	if handoff.lyric != nil {
		t.Errorf("无歌词模式交接应为 nil,got %+v", handoff.lyric)
	}
}

// TestRunPlay_LyricEmptyDegrades 空歌词 → 静默降级(Warnf 警告 + TUI notice),播放继续 exit 0。
func TestRunPlay_LyricEmptyDegrades(t *testing.T) {
	t.Parallel()
	k, _, errBuf := newTestKit()
	p := &fakePlayer{totalMs: 323000}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	deps.fetchLyric = func(_ context.Context, _ int64) (string, error) {
		return "", nil
	}
	if err := runPlay(k, 347230, 1, 75, "0", true, deps); err != nil {
		t.Fatalf("空歌词应静默降级 exit 0,got %v", err)
	}
	if !strings.Contains(errBuf.String(), "该歌曲暂无歌词") {
		t.Errorf("应 Warnf 警告,got %q", errBuf.String())
	}
	// 降级原因交给 TUI notice(TUI 内可见)。
	if handoff.notice != "⚠ 该歌曲暂无歌词" {
		t.Errorf("降级原因应交接 notice,got %q", handoff.notice)
	}
	if handoff.lyric != nil {
		t.Errorf("空歌词交接应为 nil,got %+v", handoff.lyric)
	}
}

// TestRunPlay_LyricFetchErrorDegrades 歌词接口失败 → Warnf 警告 + TUI notice,播放继续。
func TestRunPlay_LyricFetchErrorDegrades(t *testing.T) {
	t.Parallel()
	k, _, errBuf := newTestKit()
	p := &fakePlayer{totalMs: 323000}
	handoff := &tuiHandoff{}
	deps := testPlayDeps(p, handoff)
	deps.fetchLyric = func(_ context.Context, _ int64) (string, error) {
		return "", errors.New("network down")
	}
	if err := runPlay(k, 347230, 1, 75, "0", true, deps); err != nil {
		t.Fatalf("歌词失败应静默降级 exit 0,got %v", err)
	}
	if !strings.Contains(errBuf.String(), "歌词获取失败") {
		t.Errorf("应 Warnf 警告,got %q", errBuf.String())
	}
	if !strings.Contains(handoff.notice, "歌词获取失败") {
		t.Errorf("降级原因应交接 notice,got %q", handoff.notice)
	}
}

// ==================== flag 规格 ====================

// TestNewPlay_Flags flag 规格:--level/--volume/--start/--lyric 默认值;
// 缺 id(无 --id 无位置参数)报错。
func TestNewPlay_Flags(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	c := newPlay(k)
	for name, want := range map[string]string{
		"level":  "1",
		"volume": "75",
		"start":  "0",
		"lyric":  "false",
	} {
		f := c.Flags().Lookup(name)
		if f == nil {
			t.Fatalf("flag --%s 未注册", name)
		}
		if f.DefValue != want {
			t.Errorf("--%s 默认值 = %q, want %q", name, f.DefValue, want)
		}
	}
	c.SetArgs([]string{})
	if err := c.Execute(); err == nil {
		t.Error("缺 id 应报错")
	}
}

// TestNewPlay_PositionalArgsConflict 位置参数与 --id 冲突 → ResolveID 报 ErrUsage。
// play 位置参数解析在 runPlay 之前(RunE 闭包先调 ResolveID),所以优先于非 TTY 检查。
func TestNewPlay_PositionalArgsConflict(t *testing.T) {
	t.Parallel()
	k, _, _ := newTestKit()
	c := newPlay(k)
	c.SetArgs([]string{"--id", "123", "456"})
	err := c.Execute()
	if !errors.Is(err, kit.ErrUsage) {
		t.Fatalf("位置参数与 --id 冲突应 ErrUsage,got %v", err)
	}
}
