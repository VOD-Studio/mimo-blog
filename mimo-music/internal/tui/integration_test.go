package tui

import (
	"bytes"
	"strings"
	"testing"
	"time"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// 集成层:真实 tea.Program + 脚本化输入/输出 buffer。
// (bubbletea v2 无官方 teatest 包——x/exp/teatest 仅支持 v1 接口;
// 用 Program + WithInput/WithOutput/WithWindowSize 等价驱动,断言输出金线。)

// TestProgram_GoldenAndQuit q 退出 → Run 返回 nil,输出含金线(标题/时钟/键位栏)。
func TestProgram_GoldenAndQuit(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 83000, totalMs: 203000}
	var out bytes.Buffer
	err := Run(p, testMeta(), nil, 75,
		WithInput(strings.NewReader("q")),
		WithOutput(&out),
		WithInitialSize(80, 24),
		WithSampleEvery(10*time.Millisecond),
	)
	if err != nil {
		t.Fatalf("q 退出应返回 nil,got %v", err)
	}
	got := out.String()
	for _, want := range []string{"海阔天空", "01:23", "空格 暂停"} {
		if !strings.Contains(got, want) {
			t.Errorf("输出应含金线 %q", want)
		}
	}
}

// TestProgram_EOFQuits stdin EOF → 正常退出(行为对齐:EOF 即退,exit 0)。
func TestProgram_EOFQuits(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	var out bytes.Buffer
	done := make(chan error, 1)
	go func() {
		done <- Run(p, testMeta(), nil, 75,
			WithInput(strings.NewReader("")), // 立即 EOF
			WithOutput(&out),
			WithInitialSize(80, 24),
			WithSampleEvery(10*time.Millisecond),
		)
	}()
	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("EOF 退出应返回 nil,got %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("stdin EOF 后程序未退出(5s 超时)")
	}
}

// TestProgram_KeyDrivesPlayer 脚本按键经完整输入管线驱动 Player(端到端分派)。
func TestProgram_KeyDrivesPlayer(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 90000, totalMs: 323000, vol: 75}
	var out bytes.Buffer
	// →(+10s) 然后 q 退出。
	err := Run(p, testMeta(), nil, 75,
		WithInput(strings.NewReader("\x1b[Cq")),
		WithOutput(&out),
		WithInitialSize(80, 24),
		WithSampleEvery(10*time.Millisecond),
	)
	if err != nil {
		t.Fatalf("运行失败: %v", err)
	}
	got := p.callsSnapshot()
	if len(got) != 1 || got[0] != "Seek(10)" {
		t.Fatalf("→ 应 Seek(10),got %v", got)
	}
}

// TestProgram_OutputIsWriter 输出只进注入的 writer(stderr 语义),stdout 干净。
// (命令层守卫:play 进 TUI 前的解析/缓冲提示也走 stderr;本测试锁定 TUI 段。)
func TestProgram_OutputIsWriter(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, curMs: 83000, totalMs: 203000}
	var out bytes.Buffer
	if err := Run(p, testMeta(), nil, 75,
		WithInput(strings.NewReader("q")),
		WithOutput(&out),
		WithInitialSize(80, 24),
		WithSampleEvery(10*time.Millisecond),
	); err != nil {
		t.Fatal(err)
	}
	if out.Len() == 0 {
		t.Fatal("渲染输出应写入注入的 writer")
	}
	// alt-screen 进入序列证明全屏形态(退出恢复由 bubbletea 保证)。
	if !strings.Contains(out.String(), "\x1b[?1049h") {
		t.Errorf("输出应含 alt-screen 进入序列,got %q", out.String()[:min(200, out.Len())])
	}
}
