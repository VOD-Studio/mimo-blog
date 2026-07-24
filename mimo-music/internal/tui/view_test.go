package tui

import (
	"strings"
	"testing"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// ==================== View 金线(标题/进度时钟/键位栏,issue #62 验收) ====================

func viewOf(m Model) string {
	return m.View().Content
}

// TestViewGolden 主视图金线:标题/徽章/进度时钟/键位栏/状态图标齐全。
func TestViewGolden(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 83000, totalMs: 203000}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24))

	v := viewOf(m)
	for _, want := range []string{
		"Beyond - 海阔天空 · 乐与怒(1993)", // 标题
		"mp3 320kbps",                    // 音质徽章
		"01:23",                          // 进度时钟(当前)
		"03:23",                          // 总时长
		"空格 暂停",                        // 键位栏
		"q 退出",
		"? 帮助",
		"▶", // 状态图标
		"75%", // 音量
	} {
		if !strings.Contains(v, want) {
			t.Errorf("View 应含 %q\n---\n%s", want, v)
		}
	}
	if !m.View().AltScreen {
		t.Error("播放屏应声明 AltScreen(退出恢复原终端内容)")
	}
}

// TestViewBufferingWatermark 缓冲中进度条展示水位填充(PRD 行为对齐)。
func TestViewBufferingWatermark(t *testing.T) {
	t.Parallel()
	// Buffering 时 Progress 返回 (已缓冲, 水位)。
	p := &fakePlayer{state: player.StateBuffering, curMs: 4200, totalMs: 5000}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24))

	v := viewOf(m)
	if !strings.Contains(v, "⏳") {
		t.Errorf("缓冲中应显示 ⏳\n---\n%s", v)
	}
	if !strings.Contains(v, "00:04") || !strings.Contains(v, "00:05") {
		t.Errorf("缓冲中时钟应展示水位对 (已缓冲/水位)\n---\n%s", v)
	}
	// 4.2/5.0 = 84%:进度条应大部分填充(含 ━)且未满(含 ─ 尾部)。
	if !strings.Contains(v, "━") || !strings.Contains(v, "─") {
		t.Errorf("水位 84%% 应部分填充\n---\n%s", v)
	}
}

// TestViewTooSmall 终端 <40×12 显示「终端窗口过小」,q 仍可退出。
func TestViewTooSmall(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMeta(), nil, 75, WithInitialSize(30, 8))

	v := viewOf(m)
	if !strings.Contains(v, "终端窗口过小") {
		t.Errorf("小尺寸应提示「终端窗口过小」\n---\n%s", v)
	}
	if !strings.Contains(v, "q 退出") {
		t.Errorf("小尺寸提示应告知退出键\n---\n%s", v)
	}
	// q 键位分派不受尺寸影响。
	_, cmd := send(t, m, key('q', 0, "q"))
	if cmd == nil {
		t.Fatal("小尺寸下 q 应仍可退出")
	}
}

// TestViewSizeNotReady 尺寸未就绪(0×0)不渲染内容(等 WindowSizeMsg)。
func TestViewSizeNotReady(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying}
	m := New(p, testMeta(), nil, 75)
	if v := viewOf(m); v != "" {
		t.Errorf("尺寸未就绪应渲染空,got %q", v)
	}
}

// 歌词舞台与浮层行为测试见 stage_test.go(T2)。

// TestViewHelpPopup ? 后帮助为居中 popup(带边框)。
func TestViewHelpPopup(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24))
	m, _ = send(t, m, key('?', 0, "?"))

	v := viewOf(m)
	for _, want := range []string{"帮助", "播放/暂停", "静音切换", "╭", "╯"} {
		if !strings.Contains(v, want) {
			t.Errorf("帮助 popup 应含 %q(带圆角边框)\n---\n%s", want, v)
		}
	}
}

// TestViewInfoPopup i 后详情 popup:艺人/专辑/音质/音源(沿旧 infoLines)。
func TestViewInfoPopup(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24))
	m, _ = send(t, m, key('i', 0, "i"))

	v := viewOf(m)
	for _, want := range []string{"歌曲详情", "Beyond", "乐与怒(1993)", "level=1 mp3 320kbps", "http://cdn.example.com/test.mp3"} {
		if !strings.Contains(v, want) {
			t.Errorf("详情 popup 应含 %q\n---\n%s", want, v)
		}
	}
}

// TestViewNotice notice 行展示一次性提示。
func TestViewNotice(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24), WithNotice("⚠ 该歌曲暂无歌词"))
	if v := viewOf(m); !strings.Contains(v, "⚠ 该歌曲暂无歌词") {
		t.Errorf("notice 应渲染\n---\n%s", v)
	}
}

// ==================== 纯函数 ====================

func TestBar(t *testing.T) {
	t.Parallel()
	strip := func(s string) string { // 去 ANSI(样式断言见金线)
		var b strings.Builder
		inEsc := false
		for _, r := range s {
			if r == '\x1b' {
				inEsc = true
			}
			if !inEsc {
				b.WriteRune(r)
			}
			if inEsc && r == 'm' {
				inEsc = false
			}
		}
		return b.String()
	}
	cases := []struct {
		cur, total int64
		width      int
		want       string
	}{
		{0, 100, 10, "──────────"},
		{50, 100, 10, "━━━━╸─────"},
		{100, 100, 10, "━━━━━━━━━━"},
		{150, 100, 10, "━━━━━━━━━━"}, // 越界收敛
		{50, 0, 10, "──────────"},  // 总时长未知全空
		{1, 10000, 5, "─────"},     // 不足一格不画头部
	}
	for _, tc := range cases {
		if got := strip(bar(tc.cur, tc.total, tc.width)); got != tc.want {
			t.Errorf("bar(%d,%d,%d) = %q, want %q", tc.cur, tc.total, tc.width, got, tc.want)
		}
	}
}

func TestFmtClock(t *testing.T) {
	t.Parallel()
	cases := []struct {
		ms   int64
		want string
	}{
		{0, "00:00"},
		{83000, "01:23"},
		{323000, "05:23"},
		{3661000, "1:01:01"},
		{-5, "00:00"},
	}
	for _, tc := range cases {
		if got := fmtClock(tc.ms); got != tc.want {
			t.Errorf("fmtClock(%d) = %q, want %q", tc.ms, got, tc.want)
		}
	}
}

func TestYearOf(t *testing.T) {
	t.Parallel()
	cases := []struct{ in, want string }{
		{"745574400000", "1993"}, // ms 时间戳
		{"1993-05-14", "1993"},   // 日期串
		{"1993", "1993"},         // 裸年份
		{"", ""},
		{"abc", ""},
	}
	for _, tc := range cases {
		if got := yearOf(tc.in); got != tc.want {
			t.Errorf("yearOf(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestStateIcon(t *testing.T) {
	t.Parallel()
	cases := map[player.State]string{
		player.StatePlaying:   "▶",
		player.StatePaused:    "⏸",
		player.StateBuffering: "⏳",
		player.StateStopped:   "⏹",
	}
	for st, want := range cases {
		if got := stateIcon(st); got != want {
			t.Errorf("stateIcon(%v) = %q, want %q", st, got, want)
		}
	}
}
