// song play 命令:从 flag 解析到音频输出的端到端垂直切片
// (PRD-0013 Phase C,issue #21;--lyric 是 #22,位置参数是 #24;
// 播放屏 bubbletea 化是 PRD-0016 T1,issue #62)。
//
// 流程:非 TTY/--json 拒绝 → URL(拿直链) → Detail(元数据) →
// Player.Load(后台预缓冲,spinner 显示水位) → Player.Play(起播意图) →
// 水位达标 → tui.Run 接管终端(alt-screen 全屏) → q/Esc/EOF 退出。
//
// 播放控制界面属「交互界面」而非结果输出,不经渲染层:全部走 stderr
// (进度类输出的既定通道;TUI 输出同样走 stderr),stdout 保持干净。
package song

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/cobra"
	"golang.org/x/term"

	mmpb "github.com/VOD-Studio/mimo-music/gen/go/netease/music/v1"
	"github.com/VOD-Studio/mimo-music/internal/cli/kit"
	"github.com/VOD-Studio/mimo-music/internal/cli/player"
	"github.com/VOD-Studio/mimo-music/internal/cli/recall"
	"github.com/VOD-Studio/mimo-music/internal/tui"
	songendpoint "github.com/VOD-Studio/mimo-music/internal/netease/endpoint/song"
	"github.com/VOD-Studio/mimo-music/internal/netease/engine"
)

// newPlay 构造 song play 命令。
func newPlay(k *kit.Kit) *cobra.Command {
	var id int64
	var level int
	var volume int
	var start string
	var lyric bool
	c := &cobra.Command{
		Use:   "play",
		Short: "播放歌曲(交互式,键盘控制)",
		Args:  cobra.MaximumNArgs(1), // 位置参数:song play 347230 ≡ --id 347230
		RunE: func(cmd *cobra.Command, args []string) error {
			rid, err := kit.ResolveID(id, args)
			if err != nil {
				return err
			}
			return runPlay(k, rid, level, volume, start, lyric, defaultPlayDeps(k))
		},
	}
	c.Flags().Int64Var(&id, "id", 0, "歌曲 ID")
	c.Flags().IntVar(&level, "level", 1, "音质: 1=standard 2=exhigh 3=lossless 4=hires")
	c.Flags().IntVar(&volume, "volume", 75, "启动音量 0-100")
	c.Flags().StringVar(&start, "start", "0", "起始位置(秒数或 mm:ss)")
	c.Flags().BoolVar(&lyric, "lyric", false, "播放时歌词同步滚动")
	return c
}

// playDeps 是 runPlay 的外部依赖(网络 + 播放器 + 终端 + TUI)。
//
// 抽成可注入结构是为了命令层单测(同 downloadDeps 的社区共识):
// fakePlayer 替身 Player seam,TUI 用 fake runTUI 记录交接参数。
type playDeps struct {
	fetchURL    func(ctx context.Context, id int64, level int) (*mmpb.SongURL, error)
	fetchDetail func(ctx context.Context, id int64) (*mmpb.Song, error)
	// fetchLyric 拉 LRC 文本(--lyric 用)。返回空串 = 无歌词(静默降级)。
	fetchLyric func(ctx context.Context, id int64) (string, error)
	// newPlayer 按启动音量构造 Player(生产:beep 后端)。
	newPlayer func(volume int) player.Player
	// stdinIsTTY 探测 stdin 是否终端(非 TTY → exit 2)。
	stdinIsTTY func() bool
	// runTUI 接管终端运行播放屏(生产:tui.Run;测试:fake 记录交接)。
	runTUI func(p player.Player, meta tui.SongMeta, lyric []player.TimedLine, vol int, notice string) error
	// ui 进 TUI 前的进度输出(生产 stderr)。
	ui io.Writer
}

// defaultPlayDeps 生产依赖:真实网络(engine + endpoint)+ beep 播放器 + 真实终端。
func defaultPlayDeps(k *kit.Kit) playDeps {
	ui := k.Err
	if ui == nil {
		ui = os.Stderr
	}
	return playDeps{
		fetchURL: func(ctx context.Context, id int64, level int) (*mmpb.SongURL, error) {
			resp, err := kit.Exec(k, ctx, songendpoint.URL, &mmpb.GetSongURLRequest{
				SongId: id, Level: mmpb.SongLevel(level),
			})
			if err != nil {
				return nil, err
			}
			return resp.Url, nil
		},
		fetchDetail: func(ctx context.Context, id int64) (*mmpb.Song, error) {
			resp, err := kit.Exec(k, ctx, songendpoint.Detail, &mmpb.GetSongDetailRequest{SongId: id})
			if err != nil {
				return nil, err
			}
			return resp.Song, nil
		},
		fetchLyric: func(ctx context.Context, id int64) (string, error) {
			resp, err := kit.Exec(k, ctx, songendpoint.Lyric, &mmpb.GetLyricRequest{SongId: id})
			if err != nil {
				return "", err
			}
			if resp.Lyric == nil {
				return "", nil
			}
			return resp.Lyric.Lrc, nil
		},
		newPlayer: func(volume int) player.Player {
			newReq := func(ctx context.Context, method, url string) (*http.Request, error) {
				return engine.NewNeteaseRequest(ctx, method, url, k.CurrentCookie())
			}
			return player.NewBeep(newReq, player.WithVolume(volume))
		},
		stdinIsTTY: func() bool { return term.IsTerminal(int(os.Stdin.Fd())) },
		runTUI: func(p player.Player, meta tui.SongMeta, lyric []player.TimedLine, vol int, notice string) error {
			return tui.Run(p, meta, lyric, vol, tui.WithNotice(notice))
		},
		ui: ui,
	}
}

// runPlay 执行播放主流程。退出码约定:
// exit 2(ErrUsage):非 TTY / --json / flag 越界;
// exit 1:无音源 / 音频设备初始化失败 / 加载失败;
// exit 0:q/Esc/EOF 正常退出。
//
// lyric=true 时(--lyric):起播后额外拉歌词,TUI 渲染歌词窗口(issue #22)。
// 无歌词静默降级(stderr 警告 + TUI notice),播放继续。
func runPlay(k *kit.Kit, id int64, level, volume int, start string, lyric bool, deps playDeps) error {
	// 1. 先做非 TTY 检查,再 --json(issue #21 既定顺序)。
	if !deps.stdinIsTTY() {
		return fmt.Errorf("%w:播放命令需要交互式终端,请直接运行而非管道", kit.ErrUsage)
	}
	if k.JSON {
		return fmt.Errorf("%w:播放命令不支持 --json(交互命令)", kit.ErrUsage)
	}
	if volume < 0 || volume > 100 {
		return fmt.Errorf("%w:--volume 需在 0-100 之间,got %d", kit.ErrUsage, volume)
	}
	startSec, err := parseStart(start)
	if err != nil {
		return fmt.Errorf("%w:--start %q 非法(秒数或 mm:ss)", kit.ErrUsage, start)
	}

	ctx := k.CookieCtx()

	// 2. 拿播放直链。空 → exit 1 无可用音源。
	songURL, err := deps.fetchURL(ctx, id, level)
	if err != nil {
		return fmt.Errorf("获取播放地址: %w", err)
	}
	if songURL == nil || songURL.Url == "" {
		return fmt.Errorf("✗ 无可用音源。--level 1 试试或检查登录状态")
	}

	// 3. 歌曲详情(播放屏元数据)。失败不致命:空 Song 兜底。
	song, _ := deps.fetchDetail(ctx, id)
	if song == nil {
		song = &mmpb.Song{Id: id}
	}
	fmt.Fprintf(deps.ui, "解析音源 ✓ level=%d %s %dkbps\n", level, songURL.Format, songURL.Bitrate/1000)

	// 4. 构造播放器并加载(后台开始预缓冲)。
	p := deps.newPlayer(volume)
	defer func() { _ = p.Close() }()
	if err := p.Load(songURL.Url); err != nil {
		return fmt.Errorf("✗ 加载音源失败: %w", err)
	}

	// 5. 起播意图。音频设备初始化失败(headless/容器)→ exit 1 带可操作消息
	// (beep 的错误文本已含「headless 环境请用 song download」)。
	if err := p.Play(); err != nil {
		return fmt.Errorf("✗ %w", err)
	}

	// 6. 缓冲可视化:spinner 显示已缓冲/水位,水位达标(离开 Buffering)后停。
	waitBuffer(k, p)
	if p.State() == player.StateStopped {
		return errors.New("✗ 缓冲失败,音源不可用或网络中断")
	}

	// 7. 起始定位(失败不致命,Warnf 继续从头播)。
	if startSec > 0 {
		if err := p.Seek(startSec); err != nil {
			k.Warnf("⚠ 起始定位失败: %v", err)
		}
	}

	// 7.5. 歌词(--lyric):拉 LRC 文本 → SortedLRC(按时间轴排序,供二分查找)。
	// 失败或空歌词静默降级:stderr 警告 + TUI notice(警告先于 TUI 接管打印,
	// 不进 notice 用户看不到原因),播放继续无歌词窗口(PRD:无歌词不留空白行)。
	var lyricLines []player.TimedLine
	var lyricNotice string
	if lyric {
		lyricLines, lyricNotice = loadLyric(ctx, k, id, deps)
	}

	// 8. TUI 接管终端(alt-screen 全屏)。q/Esc/EOF 退出 → 终端恢复,exit 0。
	if err := deps.runTUI(p, songMetaOf(song, songURL, level), lyricLines, volume, lyricNotice); err != nil {
		return fmt.Errorf("✗ 播放屏运行失败: %w", err)
	}
	// 播放成功消费后埋点召回池(方案 c:命令显式调 kit.Record;失败不阻塞)。
	k.Record(id, songName(song), songArtist(song), recall.SrcPlay)
	return nil
}

// songMetaOf 命令层 → 播放屏元数据转换(tui 不依赖 proto)。
func songMetaOf(song *mmpb.Song, songURL *mmpb.SongURL, level int) tui.SongMeta {
	meta := tui.SongMeta{
		ID:      song.Id,
		Name:    song.Name,
		Level:   level,
		Format:  songURL.Format,
		Bitrate: songURL.Bitrate,
		URL:     songURL.Url,
	}
	if len(song.Artists) > 0 {
		meta.Artist = song.Artists[0].Name
	}
	if song.Album != nil {
		meta.Album = song.Album.Name
		meta.PublishTime = song.Album.PublishTime
	}
	return meta
}

// songName 提取歌曲名(无则空),供召回池埋点。
func songName(s *mmpb.Song) string {
	if s == nil {
		return ""
	}
	return s.Name
}

// songArtist 提取主歌手名(取第一个艺人),供召回池埋点。
func songArtist(s *mmpb.Song) string {
	if s == nil || len(s.Artists) == 0 {
		return ""
	}
	return s.Artists[0].Name
}

// loadLyric 拉歌词并解析为按时间轴排序的 TimedLine。失败/空歌词静默降级:
// 返回 (nil, 降级原因)——调用方把原因交给 TUI notice(stderr 的 Warnf 会被
// TUI alt-screen 盖掉,notice 才是用户实际能看到的通道)。有歌词返回 (lines, "")。
func loadLyric(ctx context.Context, k *kit.Kit, id int64, deps playDeps) ([]player.TimedLine, string) {
	text, err := deps.fetchLyric(ctx, id)
	if err != nil {
		// 歌词接口失败不致命:.Warnf 警告,播放继续。
		k.Warnf("⚠ 歌词获取失败: %v", err)
		return nil, fmt.Sprintf("⚠ 歌词获取失败: %v", err)
	}
	lines := player.SortedLRC(text)
	if len(lines) == 0 {
		k.Warnf("⚠ 该歌曲暂无歌词")
		return nil, "⚠ 该歌曲暂无歌词"
	}
	return lines, ""
}

// waitBuffer 起播前缓冲等待:spinner 渲染「缓冲中 ⠼ 4.2s / 5s」到 stderr,
// 轮询 Player.Progress(StateBuffering 时返回已缓冲 ms / 水位 ms),离开 Buffering 返回。
func waitBuffer(k *kit.Kit, p player.Player) {
	// 状态翻离 Buffering 后 Progress 语义变为 (位置, 总时长),ticker 末帧可能
	// 赶在 Stop 前渲染出「0.0s / 326.1s」这种错位文本;记住最后的水位对,翻离后沿用。
	var lastBuf, lastMark int64 = 0, 5000
	spin := k.NewSpinner("缓冲中", kit.WithSpinnerLabelFunc(func() string {
		cur, total, st := p.Progress()
		if st == player.StateBuffering {
			lastBuf, lastMark = cur, total
		}
		cur, total = lastBuf, lastMark
		if total > 0 && cur > total {
			// 快网下已缓冲量远超水位:显示收敛到水位(58.0s / 5.0s 是坏味道)。
			cur = total
		}
		return fmt.Sprintf("缓冲中 %.1fs / %.1fs", float64(cur)/1000, float64(total)/1000)
	}))
	spin.Start()
	for p.State() == player.StateBuffering {
		time.Sleep(100 * time.Millisecond)
	}
	spin.Stop("")
}

// ==================== 纯函数 ====================

// parseStart --start 解析:秒数("90")或 mm:ss("1:30")。空串当 0。
func parseStart(s string) (int64, error) {
	s = strings.TrimSpace(s)
	if s == "" || s == "0" {
		return 0, nil
	}
	parts := strings.Split(s, ":")
	if len(parts) > 2 {
		return 0, fmt.Errorf("格式不支持: %q", s)
	}
	var sec int64
	for _, p := range parts {
		n, err := strconv.ParseInt(p, 10, 64)
		if err != nil {
			return 0, err
		}
		sec = sec*60 + n
	}
	if sec < 0 {
		return 0, fmt.Errorf("不能为负: %q", s)
	}
	return sec, nil
}
