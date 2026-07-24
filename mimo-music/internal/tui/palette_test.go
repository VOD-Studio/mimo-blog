package tui

import (
	"image"
	"image/color"
	"testing"
	"time"

	"github.com/VOD-Studio/mimo-music/internal/cli/player"
)

// ==================== 取色纯函数(Seam 2,issue #65 验收) ====================

// solidImage 构造 8×8 纯色图。
func solidImage(c color.Color) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, 8, 8))
	for y := range 8 {
		for x := range 8 {
			img.Set(x, y, c)
		}
	}
	return img
}

// splitImage 左半 c1 右半 c2 的 8×8 图。
func splitImage(c1, c2 color.Color) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, 8, 8))
	for y := range 8 {
		for x := range 8 {
			if x < 4 {
				img.Set(x, y, c1)
			} else {
				img.Set(x, y, c2)
			}
		}
	}
	return img
}

var (
	red    = color.RGBA{R: 220, G: 30, B: 30, A: 255}
	blue   = color.RGBA{R: 30, G: 30, B: 220, A: 255}
	orange = color.RGBA{R: 230, G: 120, B: 20, A: 255}
	black  = color.RGBA{A: 255}
)

// TestPalette_TwoTone 双色图(红|蓝):主色红(同分取遍历先遇),第二色蓝(色相距离 240°)。
func TestPalette_TwoTone(t *testing.T) {
	t.Parallel()
	p := paletteFromImage(splitImage(red, blue))
	if hueDist(p.primary.h, 0) > 15 {
		t.Errorf("主色应为红(h≈0),got h=%.1f", p.primary.h)
	}
	if hueDist(p.accent.h, 240) > 15 {
		t.Errorf("第二色应为蓝(h≈240),got h=%.1f", p.accent.h)
	}
	if hueDist(p.primary.h, p.accent.h) < 60 {
		t.Errorf("双色应满足色相距离 ≥60°,got %.1f", hueDist(p.primary.h, p.accent.h))
	}
}

// TestPalette_BlackFallsDefault 全黑图:全部像素被 L<0.15 过滤 → 默认调色板。
func TestPalette_BlackFallsDefault(t *testing.T) {
	t.Parallel()
	p := paletteFromImage(solidImage(black))
	if p != defaultPalette {
		t.Errorf("全黑图应回落默认调色板,got %+v", p)
	}
}

// TestPalette_SolidIsMono 单色图(纯红):无第二色 → 单色渐变(accent=primary)。
func TestPalette_SolidIsMono(t *testing.T) {
	t.Parallel()
	p := paletteFromImage(solidImage(red))
	if hueDist(p.primary.h, 0) > 15 {
		t.Errorf("主色应为红,got h=%.1f", p.primary.h)
	}
	if p.accent != p.primary {
		t.Errorf("单色图应单色渐变(accent=primary),got accent=%+v primary=%+v", p.accent, p.primary)
	}
}

// TestPalette_NearHueIsMono 红+橙(色相距离 ~30° <60°):第二色不达标 → 单色。
func TestPalette_NearHueIsMono(t *testing.T) {
	t.Parallel()
	p := paletteFromImage(splitImage(red, orange))
	if p.accent != p.primary {
		t.Errorf("色相距离不足 60° 应单色渐变,got primary.h=%.1f accent.h=%.1f", p.primary.h, p.accent.h)
	}
}

// TestLerpHSL 渐变插值:t=0 主色,t=1 强调色,中间为过渡色。
func TestLerpHSL(t *testing.T) {
	t.Parallel()
	p := paletteFromImage(splitImage(red, blue))
	if got := lerpHSL(p.primary, p.accent, 0); got != p.primary {
		t.Errorf("t=0 应为主色,got %+v", got)
	}
	if got := lerpHSL(p.primary, p.accent, 1); hueDist(got.h, p.accent.h) > 1 {
		t.Errorf("t=1 应为强调色,got %+v", got)
	}
	mid := lerpHSL(p.primary, p.accent, 0.5)
	if mid == p.primary || mid == p.accent {
		t.Errorf("t=0.5 应为过渡色,got %+v", mid)
	}
}

// ==================== 应用面(加载后样式随封面变化) ====================

// TestPaletteAppliedOnCoverLoaded 封面加载后样式集按取色重建;无封面保持默认。
func TestPaletteAppliedOnCoverLoaded(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMetaWithCover(), nil, 75, WithInitialSize(80, 24))
	if m.styles.palette != defaultPalette {
		t.Fatal("启动应为默认调色板")
	}
	tm, _ := m.Update(coverLoadedMsg{img: solidImage(red), png: synthPNG(t, red)})
	m = tm.(Model)
	if hueDist(m.styles.palette.primary.h, 0) > 15 {
		t.Errorf("红色封面应切到红色主色,got h=%.1f", m.styles.palette.primary.h)
	}
	if m.styles.palette == defaultPalette {
		t.Error("取色后不应保持默认调色板")
	}
}

// TestPaletteComputedOnce 取色不进帧循环:样式集仅在 coverLoadedMsg 时重建。
func TestPaletteComputedOnce(t *testing.T) {
	t.Parallel()
	p := &fakePlayer{state: player.StatePlaying, totalMs: 203000}
	m := New(p, testMetaWithCover(), nil, 75, WithInitialSize(80, 24))
	tm, _ := m.Update(coverLoadedMsg{img: solidImage(blue), png: synthPNG(t, blue)})
	m = tm.(Model)
	got := m.styles
	// 帧循环/采样后样式集不变(取色只发生一次,无重算副作用)。
	for range 30 {
		tm, _ = m.Update(frameMsg(time.Now()))
		m = tm.(Model)
	}
	tm, _ = m.Update(sampleTickMsg(time.Now()))
	m = tm.(Model)
	if m.styles.palette != got.palette {
		t.Error("帧循环不应重算调色板")
	}
}

// TestGradientPrecomputed 渐变 32+1 档预计算,首档主色末档强调色。
func TestGradientPrecomputed(t *testing.T) {
	t.Parallel()
	p := palette{primary: hexToHSL("#7D56F4"), accent: hexToHSL("#EE6FF8")}
	ss := newStyleSet(p)
	if len(ss.gradient) != gradientSteps+1 {
		t.Fatalf("渐变应 %d 档,got %d", gradientSteps+1, len(ss.gradient))
	}
}
