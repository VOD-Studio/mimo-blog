package tui

import (
	"fmt"

	tea "charm.land/bubbletea/v2"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// handleKey 键 → 动作分派。语义逐条对齐旧 playUI.handleKey(PRD 行为对齐清单):
// 空格(播放/暂停)、←/→(∓10s)、Shift+←/→(∓30s)、↑/↓(音量 ±5)、
// m(静音)、0-9(跳 N×10%)、?(help)、i(info)、q/Esc/Ctrl-C(退出)。
// notice 一次性:任何按键先清除(沿旧语义)。
func (m Model) handleKey(msg tea.KeyPressMsg) (tea.Model, tea.Cmd) {
	m.notice = ""
	switch {
	case msg.Code == tea.KeySpace:
		// Playing/Buffering → 暂停;Paused/Stopped(播完)→ 播放(重播)。
		if st := m.p.State(); st == player.StatePlaying || st == player.StateBuffering {
			m.do("暂停", m.p.Pause)
		} else {
			m.do("播放", m.p.Play)
		}
	case msg.Code == tea.KeyLeft && msg.Mod == tea.ModShift:
		m.seek(-30)
	case msg.Code == tea.KeyLeft:
		m.seek(-10)
	case msg.Code == tea.KeyRight && msg.Mod == tea.ModShift:
		m.seek(30)
	case msg.Code == tea.KeyRight:
		m.seek(10)
	case msg.Code == tea.KeyUp:
		m.adjustVolume(5)
	case msg.Code == tea.KeyDown:
		m.adjustVolume(-5)
	case msg.Text == "m":
		m.toggleMute()
	case msg.Text == "?":
		m.showHelp = !m.showHelp
		m.showInfo = false
	case msg.Text == "i":
		m.showInfo = !m.showInfo
		m.showHelp = false
	case msg.Text == "q" || msg.Code == tea.KeyEscape || (msg.Code == 'c' && msg.Mod == tea.ModCtrl):
		return m, tea.Quit
	case len(msg.Text) == 1 && msg.Text[0] >= '0' && msg.Text[0] <= '9':
		m.seekPercent(int(msg.Text[0] - '0'))
	}
	// 按键后立即采样一次(旧实现「按键立即反馈,不等下一 tick」)。
	m.sample()
	return m, nil
}

// do 执行 Player 操作,失败写一次性提示(状态栏展示,不打断播放)。
func (m *Model) do(what string, fn func() error) {
	if err := fn(); err != nil {
		m.notice = fmt.Sprintf("✗ %s失败: %v", what, err)
	}
}

func (m *Model) seek(offsetSec int64) {
	m.do("定位", func() error { return m.p.Seek(offsetSec) })
}

// seekPercent 跳到 N×10% 位置(0-9 数字键)。总时长未知或缓冲中跳过。
func (m *Model) seekPercent(digit int) {
	cur, total, st := m.p.Progress()
	if st == player.StateBuffering || total <= 0 {
		return
	}
	target := total * int64(digit) / 10
	m.seek((target - cur) / 1000)
}

// effectiveVol 生效音量(静音时为 0;vol 保留原值供恢复)。
func (m *Model) effectiveVol() int {
	if m.muted {
		return 0
	}
	return m.vol
}

// adjustVolume 音量 ±delta(收敛 0-100)。Player.Volume 是 delta 语义:
// 算出生效音量差值一次调用;静音中按音量键先取消静音再调整。
func (m *Model) adjustVolume(delta int) {
	old := m.effectiveVol()
	m.vol = min(100, max(0, m.vol+delta))
	m.muted = false
	if d := m.effectiveVol() - old; d != 0 {
		m.do("音量", func() error { return m.p.Volume(d) })
	}
}

// toggleMute 静音切换(同 adjustVolume 的差值语义)。
func (m *Model) toggleMute() {
	old := m.effectiveVol()
	m.muted = !m.muted
	if d := m.effectiveVol() - old; d != 0 {
		m.do("静音", func() error { return m.p.Volume(d) })
	}
}
