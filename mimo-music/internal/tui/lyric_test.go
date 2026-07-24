package tui

import (
	"testing"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// TestCurrentLyricIndex 二分查找当前歌词行(纯函数,语义沿旧实现)。
// 返回最大的 i,使 lyric[i].TimeMs <= curMs(已唱到的最后一行)。
func TestCurrentLyricIndex(t *testing.T) {
	t.Parallel()
	lyric := []player.TimedLine{
		{TimeMs: 1000, Text: "一"},
		{TimeMs: 3000, Text: "二"},
		{TimeMs: 5000, Text: "三"},
	}
	cases := []struct {
		curMs int64
		want  int
	}{
		{0, 0},    // 早于首行 → 首行(等起唱)
		{1000, 0}, // 恰首行
		{2999, 0},
		{3000, 1},
		{4999, 1},
		{5000, 2},
		{99999, 2}, // 越过末行 → 末行
	}
	for _, tc := range cases {
		if got := currentLyricIndex(lyric, tc.curMs); got != tc.want {
			t.Errorf("currentLyricIndex(%d) = %d, want %d", tc.curMs, got, tc.want)
		}
	}
}

// TestCurrentLyricIndex_Empty 空歌词防御性返回 0(不越界)。
func TestCurrentLyricIndex_Empty(t *testing.T) {
	t.Parallel()
	if got := currentLyricIndex(nil, 1000); got != 0 {
		t.Errorf("空歌词应返回 0,got %d", got)
	}
}
