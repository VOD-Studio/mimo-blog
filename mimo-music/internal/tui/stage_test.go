package tui

import (
	"errors"
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// ==================== 歌词舞台(T2,issue #64) ====================

func stageLyric() []player.TimedLine {
	texts := []string{"第一行", "第二行", "第三行", "第四行", "第五行", "第六行", "第七行"}
	lines := make([]player.TimedLine, len(texts))
	for i, text := range texts {
		lines[i] = player.TimedLine{TimeMs: int64(i+1) * 1000, Text: text}
	}
	return lines
}

// TestLyricStage_FiveRows 视口 5 行:上 2 + 当前行(> 前缀)+ 下 2,当前行固定中心。
func TestLyricStage_FiveRows(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 4500, totalMs: 203000}
	m := New(p, testMeta(), stageLyric(), 75, WithInitialSize(80, 24))

	stage := m.lyricStage()
	rows := strings.Split(stage, "\n")
	if len(rows) != 5 {
		t.Fatalf("舞台视口应 5 行,got %d:\n%s", len(rows), stage)
	}
	// curMs 4500 → idx 3(第4行,TimeMs 4000):窗口为 第2..6行,当前行 > 前缀。
	for i, want := range []string{"第二行", "第三行", "> 第四行", "第五行", "第六行"} {
		if !strings.Contains(rows[i], want) {
			t.Errorf("舞台第 %d 行应含 %q,got %q\n---\n%s", i, want, rows[i], stage)
		}
	}
}

// TestLyricStage_ClampEdges 首行时上方缺省行留空(视口 5 行稳定不跳动)。
func TestLyricStage_ClampEdges(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 500, totalMs: 203000}
	m := New(p, testMeta(), stageLyric(), 75, WithInitialSize(80, 24))

	stage := m.lyricStage()
	rows := strings.Split(stage, "\n")
	if len(rows) != 5 {
		t.Fatalf("首行时视口仍应 5 行,got %d", len(rows))
	}
	if !strings.Contains(rows[2], "> 第一行") {
		t.Errorf("首行高亮应在视口中心,got %q", rows[2])
	}
	if !strings.Contains(rows[3], "第二行") || !strings.Contains(rows[4], "第三行") {
		t.Errorf("下方上下文应填充,got %q / %q", rows[3], rows[4])
	}
}

// TestStageSpring_TriggeredOnLineChange 换行触发弹簧偏移(行为断言,不测弹簧数值)。
func TestStageSpring_TriggeredOnLineChange(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 1500, totalMs: 203000}
	m := New(p, testMeta(), stageLyric(), 75, WithInitialSize(80, 24))
	if m.stageOffset != 0 {
		t.Fatalf("初始应无弹簧偏移,got %v", m.stageOffset)
	}

	// 前进到下一行 → 下方滑入(+1)。
	p.mu.Lock()
	p.curMs = 2500
	p.mu.Unlock()
	m, _ = send(t, m, sampleTickMsg(time.Now()))
	if m.stageOffset != 1 {
		t.Fatalf("前进换行应触发 +1 偏移,got %v", m.stageOffset)
	}
	if m.lastLyricIdx != 1 {
		t.Fatalf("lastLyricIdx 应更新为 1,got %d", m.lastLyricIdx)
	}

	// seek 回退 → 上方滑回(-1)。
	p.mu.Lock()
	p.curMs = 500
	p.mu.Unlock()
	m, _ = send(t, m, sampleTickMsg(time.Now()))
	if m.stageOffset != -1 {
		t.Fatalf("回退换行应触发 -1 偏移,got %v", m.stageOffset)
	}
}

// TestStageSpring_Converges 弹簧经若干帧收敛回 0(只断言收敛,不断言数值)。
func TestStageSpring_Converges(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 1500, totalMs: 203000}
	m := New(p, testMeta(), stageLyric(), 75, WithInitialSize(80, 24))
	p.mu.Lock()
	p.curMs = 2500
	p.mu.Unlock()
	m, _ = send(t, m, sampleTickMsg(time.Now()))

	for range 120 { // 4s 动画帧(30fps)
		m, _ = send(t, m, frameMsg(time.Now()))
	}
	if m.stageOffset > 0.001 || m.stageOffset < -0.001 {
		t.Fatalf("弹簧应收敛回 0,got %v", m.stageOffset)
	}
}

// TestNoLyric_Placeholder 无歌词时中部 ♪ 占位,不留空白面板(T3 由封面位取代)。
func TestNoLyric_Placeholder(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 83000, totalMs: 203000}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24))
	if got := m.midContent(); !strings.Contains(got, "♪") {
		t.Errorf("无歌词应 ♪ 占位,got %q", got)
	}
}

// ==================== 浮层(T2,issue #64) ====================

// TestVolumeOverlay_ShowOnVolumeKey 音量键弹音量浮层(弹簧入场偏移 +1)。
func TestVolumeOverlay_ShowOnVolumeKey(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000, vol: 75}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24))

	m, _ = send(t, m, key(tea.KeyUp, 0, ""))
	if m.overlay != overlayVolume {
		t.Fatalf("音量键应弹音量浮层,got %v", m.overlay)
	}
	if m.overlayOffset != 1 {
		t.Fatalf("浮层应从 +1 偏移弹簧入场,got %v", m.overlayOffset)
	}
}

// TestVolumeOverlay_FadeAfterIdle 音量浮层 1.5s 无操作淡出。
func TestVolumeOverlay_FadeAfterIdle(t *testing.T) {
	t.Parallel()
	now := time.Now()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000, vol: 75}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24), WithClock(func() time.Time { return now }))

	m, _ = send(t, m, key(tea.KeyUp, 0, ""))
	// 1.4s:未淡出。
	now = now.Add(1400 * time.Millisecond)
	m, _ = send(t, m, frameMsg(now))
	if m.overlay != overlayVolume {
		t.Fatal("1.4s 未超时不应淡出")
	}
	// 1.6s:淡出。
	now = now.Add(200 * time.Millisecond)
	m, _ = send(t, m, frameMsg(now))
	if m.overlay != overlayNone {
		t.Fatalf("1.5s 无操作应淡出,got %v", m.overlay)
	}
}

// TestVolumeOverlay_ActivityResetsFade 连续音量操作重置淡出计时。
func TestVolumeOverlay_ActivityResetsFade(t *testing.T) {
	t.Parallel()
	now := time.Now()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000, vol: 75}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24), WithClock(func() time.Time { return now }))

	m, _ = send(t, m, key(tea.KeyUp, 0, ""))
	now = now.Add(1200 * time.Millisecond)
	m, _ = send(t, m, key(tea.KeyUp, 0, "")) // 再操作,计时重置
	now = now.Add(1200 * time.Millisecond)
	m, _ = send(t, m, frameMsg(now))
	if m.overlay != overlayVolume {
		t.Fatal("再次操作应重置 1.5s 计时")
	}
}

// TestNoticeOverlay_NoAutoFade notice 浮层不自动淡出(一次性,下次按键清除)。
func TestNoticeOverlay_NoAutoFade(t *testing.T) {
	t.Parallel()
	now := time.Now()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24),
		WithNotice("⚠ 该歌曲暂无歌词"), WithClock(func() time.Time { return now }))

	now = now.Add(10 * time.Second)
	m, _ = send(t, m, frameMsg(now))
	if m.overlay != overlayNotice {
		t.Fatalf("notice 不应自动淡出,got %v", m.overlay)
	}
	// 按键清除。
	m, _ = send(t, m, key('x', 0, "x"))
	if m.overlay != overlayNone || m.notice != "" {
		t.Fatalf("按键应清除 notice 浮层,got overlay=%v notice=%q", m.overlay, m.notice)
	}
}

// TestNoticeOverlay_SameChannel 操作失败与音量浮层同通道(互斥展示)。
func TestNoticeOverlay_SameChannel(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 90000, totalMs: 203000, vol: 75, seekErr: errSeek}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24))

	m, _ = send(t, m, key(tea.KeyRight, 0, "")) // seek 失败 → notice 浮层
	if m.overlay != overlayNotice {
		t.Fatalf("seek 失败应弹 notice 浮层,got %v", m.overlay)
	}
	p.mu.Lock()
	p.seekErr = nil
	p.mu.Unlock()
	m, _ = send(t, m, key(tea.KeyUp, 0, "")) // 音量键 → 换音量浮层
	if m.overlay != overlayVolume {
		t.Fatalf("音量键应切换为音量浮层(同通道),got %v", m.overlay)
	}
}

var errSeek = errors.New("网络中断")

// TestVolumeOverlay_ViewContent 浮层行渲染音量条(收敛后可见)。
func TestVolumeOverlay_ViewContent(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000, vol: 75}
	m := New(p, testMeta(), nil, 75, WithInitialSize(80, 24))
	m, _ = send(t, m, key(tea.KeyUp, 0, ""))
	// 跑帧收敛入场弹簧。
	for range 120 {
		m, _ = send(t, m, frameMsg(time.Now()))
	}
	v := viewOf(m)
	if !strings.Contains(v, "80%") {
		t.Errorf("音量浮层应显示新音量 80%%\n---\n%s", v)
	}
}
