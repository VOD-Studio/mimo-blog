package cli

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/spf13/cobra"
	"github.com/stretchr/testify/require"
)

// withTestHome 设临时 HOME,返回清理函数(隔离,不碰真实 ~/.zshrc 等)。
func withTestHome(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	t.Setenv("HOME", dir)
	return dir
}

func TestCompletionScriptPath(t *testing.T) {
	dir := withTestHome(t)
	cases := []struct {
		shell string
		want  string
	}{
		{"zsh", filepath.Join(dir, ".zsh", "completions", "_musicctl")},
		{"bash", filepath.Join(dir, ".local", "share", "bash-completion", "completions", "musicctl")},
		{"fish", filepath.Join(dir, ".config", "fish", "completions", "musicctl.fish")},
	}
	for _, tc := range cases {
		t.Run(tc.shell, func(t *testing.T) {
			got, err := completionScriptPath(tc.shell)
			require.NoError(t, err)
			require.Equal(t, tc.want, got)
		})
	}
}

func TestCompletionScriptPath_UnsupportedShell(t *testing.T) {
	_, err := completionScriptPath("powershell")
	require.Error(t, err)
}

func TestWriteCompletionScript_FirstWrite_Changed(t *testing.T) {
	withTestHome(t)
	changed, path, err := writeCompletionScript("zsh", []byte("# script"))
	require.NoError(t, err)
	require.True(t, changed, "首次写应 changed=true")
	require.FileExists(t, path)
}

func TestWriteCompletionScript_Idempotent(t *testing.T) {
	withTestHome(t)
	script := []byte("# script")
	_, _, _ = writeCompletionScript("zsh", script)
	changed, _, err := writeCompletionScript("zsh", script)
	require.NoError(t, err)
	require.False(t, changed, "相同内容再写应 changed=false")
}

func TestWriteCompletionScript_ContentChange_Changed(t *testing.T) {
	withTestHome(t)
	_, _, _ = writeCompletionScript("zsh", []byte("# v1"))
	changed, _, err := writeCompletionScript("zsh", []byte("# v2"))
	require.NoError(t, err)
	require.True(t, changed, "内容变化应 changed=true")
}

func TestEnsureShellConfig_BashFish_NoChange(t *testing.T) {
	withTestHome(t)
	for _, shell := range []string{"bash", "fish"} {
		t.Run(shell, func(t *testing.T) {
			changed, cfg, err := ensureShellConfig(shell)
			require.NoError(t, err)
			require.False(t, changed, "%s 不改配置", shell)
			require.Empty(t, cfg)
		})
	}
}

func TestEnsureShellConfig_Zsh_FirstAdd(t *testing.T) {
	dir := withTestHome(t)
	changed, cfg, err := ensureShellConfig("zsh")
	require.NoError(t, err)
	require.True(t, changed, "首次应添加")
	require.Equal(t, filepath.Join(dir, ".zshrc"), cfg)
	// .zshrc 应含 fpath + compinit + marker。
	content, err := os.ReadFile(cfg)
	require.NoError(t, err)
	s := string(content)
	require.Contains(t, s, "fpath=(~/.zsh/completions $fpath)")
	require.Contains(t, s, "compinit")
	require.Contains(t, s, "musicctl completion")
}

func TestEnsureShellConfig_Zsh_Idempotent(t *testing.T) {
	withTestHome(t)
	_, cfg, _ := ensureShellConfig("zsh")
	changed, _, err := ensureShellConfig("zsh")
	require.NoError(t, err)
	require.False(t, changed, "已含 marker 再跑应 changed=false")
	// 文件不应被追加第二份。
	content, _ := os.ReadFile(cfg)
	require.Equal(t, 1, strings.Count(string(content), "musicctl completion"))
}

func TestShellNameFromFile(t *testing.T) {
	cases := []struct {
		shellPath string
		want      string
	}{
		{"/bin/zsh", "zsh"},
		{"/usr/local/bin/fish", "fish"},
		{"zsh", "zsh"},
		{"", ""},
		{"/bin/xonsh", ""},
	}
	for _, tc := range cases {
		require.Equal(t, tc.want, shellNameFromFile(tc.shellPath), "shellPath=%q", tc.shellPath)
	}
}

// runInstallCompletion 端到端:用真实 NewRootCommand 生成脚本,隔离 HOME。
func TestRunInstallCompletion_ZshEndToEnd(t *testing.T) {
	dir := withTestHome(t)
	t.Setenv("SHELL", "/bin/zsh")
	root := &cobra.Command{Use: "musicctl"}
	var out strings.Builder
	require.NoError(t, runInstallCompletion(root, &out))
	// 脚本 + .zshrc 都应生成。
	require.FileExists(t, filepath.Join(dir, ".zsh", "completions", "_musicctl"))
	require.FileExists(t, filepath.Join(dir, ".zshrc"))
	// 输出应含路径 + 生效提示。
	require.Contains(t, out.String(), "已写入 zsh 补全")
	require.Contains(t, out.String(), "生效")
}

func TestRunInstallCompletion_UnknownShell_Error(t *testing.T) {
	withTestHome(t)
	t.Setenv("SHELL", "/bin/xonsh")
	root := &cobra.Command{Use: "musicctl"}
	err := runInstallCompletion(root, &strings.Builder{})
	require.Error(t, err)
	require.Contains(t, err.Error(), "无法识别")
}
