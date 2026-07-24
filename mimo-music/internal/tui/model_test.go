// tui 播放屏测试(PRD-0016 T1)。
//
// seam:Player 接口用 fakePlayer 替身(与命令层 play_test.go 同款先例);
// Model 纯化——Update/View 直接驱动断言,不经真实终端。
// 集成层用真实 tea.Program + 脚本化 input/output buffer。
package tui

import (
	"fmt"
	"sync"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// ==================== fakePlayer(Player seam) ====================

// fakePlayer 记录方法调用序列,模拟状态机(Play→Playing,Pause→Paused)。
// Progress/State 不记录(显示循环高频读,记录会淹没断言)。
type fakePlayer struct {
	mu      sync.Mutex
	state   player.State
	curMs   int64
	totalMs int64
	vol     int
	seekErr error
	calls   []string
	// progressN 记录 Progress 调用次数(T2 验收:动画帧不加密采样)。
	progressN int
}

func (f *fakePlayer) record(format string, args ...any) {
	f.calls = append(f.calls, fmt.Sprintf(format, args...))
}

func (f *fakePlayer) Load(url string) error { return nil }

func (f *fakePlayer) Play() error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.record("Play")
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
	if f.seekErr != nil {
		f.record("Seek(%d)!", offsetSec)
		return f.seekErr
	}
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
	f.progressN++
	return f.curMs, f.totalMs, f.state
}

func (f *fakePlayer) State() player.State {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.state
}

func (f *fakePlayer) Close() error { return nil }

func (f *fakePlayer) callsSnapshot() []string {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]string(nil), f.calls...)
}

// ==================== 测试辅助 ====================

func testMeta() SongMeta {
	return SongMeta{
		ID:          347230,
		Name:        "海阔天空",
		Artist:      "Beyond",
		Album:       "乐与怒",
		PublishTime: "1993-05-14",
		Level:       1,
		Format:      "mp3",
		Bitrate:     320000,
		URL:         "http://cdn.example.com/test.mp3",
	}
}

// key 构造按键消息(对齐真实终端解析结果:字符键带 Text,特殊键带 Code)。
func key(code rune, mod tea.KeyMod, text string) tea.KeyPressMsg {
	return tea.KeyPressMsg{Code: code, Mod: mod, Text: text}
}

// send 驱动一次 Update 并断言返回 Model。
func send(t *testing.T, m Model, msg tea.Msg) (Model, tea.Cmd) {
	t.Helper()
	tm, cmd := m.Update(msg)
	next, ok := tm.(Model)
	if !ok {
		t.Fatalf("Update 应返回 tui.Model,got %T", tm)
	}
	return next, cmd
}

// ==================== 键位分派(对齐旧 play_test.go KeyMapping 语义) ====================

// TestKeyMapping 9 类键 → Player 方法调用序列,逐条对齐旧状态栏语义。
func TestKeyMapping(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 90000, totalMs: 323000, vol: 75}
	m := New(p, testMeta(), nil, 75)

	seq := []tea.KeyPressMsg{
		key(tea.KeySpace, 0, " "),                // Playing → Pause
		key(tea.KeySpace, 0, " "),                // Paused → Play
		key(tea.KeyRight, 0, ""),                 // +10s
		key(tea.KeyLeft, 0, ""),                  // -10s
		key(tea.KeyRight, tea.ModShift, ""),      // +30s
		key(tea.KeyLeft, tea.ModShift, ""),       // -30s
		key(tea.KeyUp, 0, ""),                    // 75→80,Volume(+5)
		key(tea.KeyDown, 0, ""),                  // 80→75,Volume(-5)
		key('m', 0, "m"),                         // 静音:75→0,Volume(-75)
		key('m', 0, "m"),                         // 取消静音:0→75,Volume(+75)
		key('5', 0, "5"),                         // 跳到 50%:161500-90000 → Seek(71)
		key('?', 0, "?"),                         // 帮助 popup(无 Player 调用)
		key('i', 0, "i"),                         // 详情 popup(无 Player 调用)
	}
	for _, ev := range seq {
		m, _ = send(t, m, ev)
	}

	want := []string{
		"Pause", "Play",
		"Seek(10)", "Seek(-10)", "Seek(30)", "Seek(-30)",
		"Volume(5)", "Volume(-5)", "Volume(-75)", "Volume(75)",
		"Seek(71)",
	}
	got := p.callsSnapshot()
	if len(got) != len(want) {
		t.Fatalf("调用序列长度 = %d, want %d:\ngot  %v\nwant %v", len(got), len(want), got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("调用序列第 %d 项 = %q, want %q:\ngot  %v", i, got[i], want[i], got)
		}
	}
}

// TestQuitKeys q / Esc / Ctrl-C 均触发退出。
func TestQuitKeys(t *testing.T) {
	t.Parallel()
	cases := map[string]tea.KeyPressMsg{
		"q":      key('q', 0, "q"),
		"esc":    key(tea.KeyEscape, 0, ""),
		"ctrl-c": key('c', tea.ModCtrl, ""),
	}
	for name, ev := range cases {
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			p := &fakePlayer{state: player.StatePlaying, totalMs: 323000}
			m := New(p, testMeta(), nil, 75)
			_, cmd := send(t, m, ev)
			if cmd == nil {
				t.Fatal("退出键应返回 tea.Quit 命令")
			}
			if _, ok := cmd().(tea.QuitMsg); !ok {
				t.Fatalf("退出键命令应产生 QuitMsg,got %T", cmd())
			}
		})
	}
}

// TestSeekPercentSkips 数字键在缓冲中/总时长未知时跳过(旧语义)。
func TestSeekPercentSkips(t *testing.T) {
	t.Parallel()
	for name, p := range map[string]*fakePlayer{
		"buffering":  {state: player.StateBuffering, curMs: 2000, totalMs: 5000},
		"unknownLen": {state: player.StatePlaying, totalMs: 0},
	} {
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			m := New(p, testMeta(), nil, 75)
			send(t, m, key('5', 0, "5"))
			if got := p.callsSnapshot(); len(got) != 0 {
				t.Fatalf("%s 时数字键应跳过,got %v", name, got)
			}
		})
	}
}

// TestVolumeClamp 音量收敛 0-100(旧 adjustVolume 语义)。
func TestVolumeClamp(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 323000, vol: 100}
	m := New(p, testMeta(), nil, 100)
	m, _ = send(t, m, key(tea.KeyUp, 0, "")) // 100+5 收敛 100,差值 0 不调 Player
	if got := p.callsSnapshot(); len(got) != 0 {
		t.Fatalf("音量封顶不应产生 Volume 调用,got %v", got)
	}

	p2 := &fakePlayer{state: player.StatePlaying, totalMs: 323000, vol: 3}
	m2 := New(p2, testMeta(), nil, 3)
	m2, _ = send(t, m2, key(tea.KeyDown, 0, "")) // 3-5 收敛 0,差值 -3
	got := p2.callsSnapshot()
	if len(got) != 1 || got[0] != "Volume(-3)" {
		t.Fatalf("音量触底差值应 -3,got %v", got)
	}
}

// TestNoticeSemantics notice 一次性:操作失败写入,下次按键清除(旧语义)。
func TestNoticeSemantics(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 90000, totalMs: 323000, seekErr: fmt.Errorf("网络中断")}
	m := New(p, testMeta(), nil, 75)

	m, _ = send(t, m, key(tea.KeyRight, 0, ""))
	if m.notice == "" {
		t.Fatal("seek 失败应写 notice")
	}
	// 任意按键(含未知键)清除。
	m, _ = send(t, m, key('x', 0, "x"))
	if m.notice != "" {
		t.Fatalf("下次按键应清除 notice,got %q", m.notice)
	}
}

// TestInitialNotice 初始 notice(歌词降级原因)进模型即可见,按键后清除。
func TestInitialNotice(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 323000}
	m := New(p, testMeta(), nil, 75, WithNotice("⚠ 该歌曲暂无歌词"))
	if m.notice != "⚠ 该歌曲暂无歌词" {
		t.Fatalf("初始 notice 未传入,got %q", m.notice)
	}
	m, _ = send(t, m, key(tea.KeyUp, 0, ""))
	if m.notice != "" {
		t.Fatalf("按键后 notice 应清除,got %q", m.notice)
	}
}

// TestPopupToggle help/info 互斥切换(旧浮层语义)。
func TestPopupToggle(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 323000}
	m := New(p, testMeta(), nil, 75)

	m, _ = send(t, m, key('?', 0, "?"))
	if !m.showHelp || m.showInfo {
		t.Fatalf("? 应开帮助关详情,got help=%v info=%v", m.showHelp, m.showInfo)
	}
	m, _ = send(t, m, key('i', 0, "i"))
	if m.showHelp || !m.showInfo {
		t.Fatalf("i 应关帮助开详情,got help=%v info=%v", m.showHelp, m.showInfo)
	}
	m, _ = send(t, m, key('i', 0, "i"))
	if m.showInfo {
		t.Fatal("再按 i 应关详情")
	}
}

// TestTickSampling tick 驱动 Progress 采样进入视图状态。
func TestTickSampling(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 1000, totalMs: 323000}
	m := New(p, testMeta(), nil, 75)
	p.mu.Lock()
	p.curMs = 61000
	p.mu.Unlock()

	m, cmd := send(t, m, sampleTickMsg(time.Now()))
	if m.curMs != 61000 {
		t.Fatalf("tick 应重新采样进度,got %d", m.curMs)
	}
	if cmd == nil {
		t.Fatal("tick 应返回下一节拍命令")
	}
}

// TestSpaceFromStopped Stopped(播完)按空格重播(旧语义 else 分支)。
func TestSpaceFromStopped(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StateStopped, totalMs: 323000}
	m := New(p, testMeta(), nil, 75)
	send(t, m, key(tea.KeySpace, 0, " "))
	got := p.callsSnapshot()
	if len(got) != 1 || got[0] != "Play" {
		t.Fatalf("Stopped 空格应 Play(重播),got %v", got)
	}
}
