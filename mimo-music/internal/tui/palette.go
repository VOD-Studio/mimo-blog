package tui

import (
	"fmt"
	"image"
	"math"
	"sort"

	"github.com/charmbracelet/lipgloss"
)

// ==================== 封面取色(PRD-0016 T4,issue #65) ====================
//
// 算法:解码图缩至 8×8 → 逐像素转 HSL → 过滤 L<0.15 / L>0.92 / S<0.2 →
// 剩余按 S×(1-|L-0.5|×2) 取最高分为主色;第二色要求色相距离 ≥60°,
// 不满足则单色渐变。取色是纯函数 image.Image → palette,封面加载时算一次,
// 不进帧循环。

// hslColor HSL 颜色(h: 0-360,s/l: 0-1)。
type hslColor struct {
	h, s, l float64
}

// palette 调色板:主色 + 强调色(第二色;单色渐变时与主色相同)。
type palette struct {
	primary hslColor
	accent  hslColor
}

// 默认调色板:Charm 紫粉渐变 #7D56F4 → #EE6FF8(无封面/取色失败时)。
var defaultPalette = palette{
	primary: hexToHSL("#7D56F4"),
	accent:  hexToHSL("#EE6FF8"),
}

// paletteFromImage 封面取色纯函数。无合格像素(全黑/全白/低饱和)→ 默认调色板。
func paletteFromImage(img image.Image) palette {
	b := img.Bounds()
	type candidate struct {
		c     hslColor
		score float64
	}
	var cands []candidate
	for y := range 8 {
		for x := range 8 {
			r, g, bl, _ := img.At(b.Min.X+x*b.Dx()/8, b.Min.Y+y*b.Dy()/8).RGBA()
			c := rgbToHSL(float64(r)/65535, float64(g)/65535, float64(bl)/65535)
			if c.l < 0.15 || c.l > 0.92 || c.s < 0.2 {
				continue
			}
			cands = append(cands, candidate{c, c.s * (1 - math.Abs(c.l-0.5)*2)})
		}
	}
	if len(cands) == 0 {
		return defaultPalette
	}
	sort.Slice(cands, func(i, j int) bool { return cands[i].score > cands[j].score })
	primary := cands[0].c
	// 第二色:色相距离 ≥60° 的最高分;不满足则单色渐变(accent=primary)。
	for _, cand := range cands[1:] {
		if hueDist(primary.h, cand.c.h) >= 60 {
			return palette{primary: primary, accent: cand.c}
		}
	}
	return palette{primary: primary, accent: primary}
}

// lipgloss 色(按终端 profile 降级)。
func (c hslColor) color() lipgloss.Color {
	return lipgloss.Color(c.hex())
}

func (c hslColor) hex() string {
	r, g, b := hslToRGB(c.h, c.s, c.l)
	return fmt.Sprintf("#%02x%02x%02x", uint8(math.Round(r*255)), uint8(math.Round(g*255)), uint8(math.Round(b*255)))
}

// lerpHSL HSL 空间插值(色相走最短弧,t∈[0,1])。
func lerpHSL(a, b hslColor, t float64) hslColor {
	dh := b.h - a.h
	if dh > 180 {
		dh -= 360
	} else if dh < -180 {
		dh += 360
	}
	h := math.Mod(a.h+dh*t+360, 360)
	return hslColor{h: h, s: a.s + (b.s-a.s)*t, l: a.l + (b.l-a.l)*t}
}

// hueDist 色相距离(0-180)。
func hueDist(a, b float64) float64 {
	d := math.Abs(a - b)
	if d > 180 {
		d = 360 - d
	}
	return d
}

// rgbToHSL r,g,b∈[0,1] → HSL。
func rgbToHSL(r, g, b float64) hslColor {
	maxC := max(r, max(g, b))
	minC := min(r, min(g, b))
	l := (maxC + minC) / 2
	if maxC == minC {
		return hslColor{h: 0, s: 0, l: l}
	}
	d := maxC - minC
	var s float64
	if l > 0.5 {
		s = d / (2 - maxC - minC)
	} else {
		s = d / (maxC + minC)
	}
	var h float64
	switch maxC {
	case r:
		h = (g - b) / d
		if g < b {
			h += 6
		}
	case g:
		h = (b-r)/d + 2
	default:
		h = (r-g)/d + 4
	}
	return hslColor{h: h * 60, s: s, l: l}
}

// hslToRGB HSL → r,g,b∈[0,1]。
func hslToRGB(h, s, l float64) (r, g, b float64) {
	if s == 0 {
		return l, l, l
	}
	var q float64
	if l < 0.5 {
		q = l * (1 + s)
	} else {
		q = l + s - l*s
	}
	p := 2*l - q
	hk := h / 360
	conv := func(t float64) float64 {
		switch {
		case t < 0:
			t++
		case t > 1:
			t--
		}
		switch {
		case t < 1.0/6:
			return p + (q-p)*6*t
		case t < 1.0/2:
			return q
		case t < 2.0/3:
			return p + (q-p)*(2.0/3-t)*6
		default:
			return p
		}
	}
	return conv(hk + 1.0/3), conv(hk), conv(hk - 1.0/3)
}

// hexToHSL #rrggbb → HSL(仅用于常量初始化,输入合法)。
func hexToHSL(hex string) hslColor {
	var r, g, b uint8
	fmt.Sscanf(hex, "#%02x%02x%02x", &r, &g, &b)
	return rgbToHSL(float64(r)/255, float64(g)/255, float64(b)/255)
}
