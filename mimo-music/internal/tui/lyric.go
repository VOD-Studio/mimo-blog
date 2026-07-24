package tui

import "github.com/VOD-Studio/mimo-music/internal/cli/player"

// currentLyricIndex 二分查找 curMs 对应的当前歌词行索引。
//
// 语义:返回最大的 i,使 lyric[i].TimeMs <= curMs(即「已经唱到/正在唱的最后一行」)。
// curMs 早于首行 → 返回 0(首行高亮,等待起唱)。
// 空 lyric → 返回 0(调用方应先判空,这里防御性返回 0 避免越界)。
//
// 二分:找到第一个 TimeMs > curMs 的位置,减 1 即当前行。
func currentLyricIndex(lyric []player.TimedLine, curMs int64) int {
	if len(lyric) == 0 {
		return 0
	}
	// 找首个 TimeMs > curMs 的索引(upper bound)。
	lo, hi := 0, len(lyric)
	for lo < hi {
		mid := (lo + hi) / 2
		if lyric[mid].TimeMs <= curMs {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	// lo 是首个 > curMs 的位置;当前行 = lo - 1。
	// lo == 0(curMs 早于所有行)→ 当前行 = 0(首行,等起唱)。
	if lo == 0 {
		return 0
	}
	return lo - 1
}
