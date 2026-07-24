package cli

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
)

// newInstallCompletionCommand 创建 install-completion 命令:一键自动安装当前
// shell 的 Tab 补全(生成脚本 + 写配置,幂等)。比手动跑 completion <shell> + 改
// .zshrc 更省事——用户 go install 后直接 musicctl install-completion 即可。
//
// 自动检测 $SHELL(zsh/bash/fish),生成脚本到对应位置,往 shell 配置文件追加
// 加载语句(已存在则跳过)。powershell/未知 shell 退化为提示手动安装。
func newInstallCompletionCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "install-completion",
		Short: "一键安装当前 shell 的 Tab 补全(生成脚本 + 配置,幂等)",
		Long: `自动检测当前 shell($SHELL)并安装 musicctl 的 Tab 补全:

  zsh   → ~/.zsh/completions/_musicctl + ~/.zshrc 加 fpath
  bash  → ~/.local/share/bash-completion/completions/musicctl(bash-completion 自动加载)
  fish  → ~/.config/fish/completions/musicctl.fish(fish 自动加载)

已安装/已配置则跳过(幂等,可重复跑)。安装后重开终端或 source 配置生效。
powershell/未知 shell 退化为提示手动跑 musicctl completion <shell>。`,
		Args: cobra.NoArgs,
		RunE: func(cmd *cobra.Command, _ []string) error {
			return runInstallCompletion(cmd, cmd.OutOrStdout())
		},
	}
}

// runInstallCompletion 执行安装。
//
// 输出遵循 clig.dev「默认安静」:只在变更/失败时输出,末尾一行总结
// (做了什么 + 下一步)。幂等(已装)时不啰嗦,简短确认。
func runInstallCompletion(root *cobra.Command, out io.Writer) error {
	shell := shellNameFromFile(os.Getenv("SHELL"))
	switch shell {
	case "zsh", "bash", "fish":
		// 继续安装。
	default:
		return fmt.Errorf("无法识别当前 shell($SHELL=%q);手动跑 musicctl completion <shell> 并按 shell 文档加载", os.Getenv("SHELL"))
	}
	script, err := genCompletionScript(root, shell)
	if err != nil {
		return fmt.Errorf("生成 %s 补全脚本: %w", shell, err)
	}
	scriptChanged, target, err := writeCompletionScript(shell, script)
	if err != nil {
		return fmt.Errorf("写补全脚本: %w", err)
	}
	cfgChanged, cfgPath, err := ensureShellConfig(shell)
	if err != nil {
		return fmt.Errorf("写 shell 配置: %w", err)
	}

	// 总结行:做了什么(脚本/配置变更)+ 下一步。
	// 幂等(都没变):简短确认。
	if !scriptChanged && !cfgChanged {
		fmt.Fprintf(out, "%s 补全已是最新(%s)。重开终端即可用 musicctl <TAB> 列命令。\n", shell, target)
		return nil
	}
	parts := []string{target}
	if cfgChanged {
		parts = append(parts, cfgPath)
	}
	fmt.Fprintf(out, "已写入 %s 补全到:%s\n", shell, strings.Join(parts, "、"))
	if cfgChanged {
		fmt.Fprintln(out, "新开终端,或 source 该配置文件后生效。")
	} else {
		fmt.Fprintln(out, "新开终端后生效。")
	}
	return nil
}

// genCompletionScript 用 cobra 生成指定 shell 的补全脚本(写到 buffer)。
func genCompletionScript(root *cobra.Command, shell string) ([]byte, error) {
	var buf strings.Builder
	var err error
	switch shell {
	case "zsh":
		err = root.GenZshCompletion(&buf)
	case "bash":
		err = root.GenBashCompletion(&buf)
	case "fish":
		err = root.GenFishCompletion(&buf, true)
	default:
		return nil, fmt.Errorf("不支持的 shell: %s", shell)
	}
	if err != nil {
		return nil, err
	}
	return []byte(buf.String()), nil
}

// completionScriptPath 返回指定 shell 的补全脚本目标路径。
func completionScriptPath(shell string) (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	switch shell {
	case "zsh":
		return filepath.Join(home, ".zsh", "completions", "_musicctl"), nil
	case "bash":
		return filepath.Join(home, ".local", "share", "bash-completion", "completions", "musicctl"), nil
	case "fish":
		return filepath.Join(home, ".config", "fish", "completions", "musicctl.fish"), nil
	}
	return "", fmt.Errorf("不支持的 shell: %s", shell)
}

// writeCompletionScript 写补全脚本到目标路径(mkdir 父目录 + 0644)。
// 返回 (是否内容有变更, 路径, error)——内容与现存一致则 changed=false(幂等)。
func writeCompletionScript(shell string, script []byte) (bool, string, error) {
	path, err := completionScriptPath(shell)
	if err != nil {
		return false, "", err
	}
	if existing, rerr := os.ReadFile(path); rerr == nil && bytes.Equal(existing, script) {
		return false, path, nil // 内容一致,幂等
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return false, "", err
	}
	if err := os.WriteFile(path, script, 0o644); err != nil {
		return false, "", err
	}
	return true, path, nil
}

// ensureShellConfig 往 shell 配置文件追加加载语句(已含则跳过,幂等)。
// 返回 (是否新增了语句, 配置文件路径, error)。bash/fish 无需配置(自动加载)。
//
// zsh:fpath + compinit(~/.zshrc)
// bash:无需配置(bash-completion 包自动加载 ~/.local/share/bash-completion 目录)
// fish:无需配置(fish 自动加载 completions 目录)
func ensureShellConfig(shell string) (bool, string, error) {
	if shell == "bash" || shell == "fish" {
		return false, "", nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return false, "", err
	}
	zshrc := filepath.Join(home, ".zshrc")
	marker := "musicctl completion" // 标记块,识别已添加
	content, _ := os.ReadFile(zshrc)
	if strings.Contains(string(content), marker) {
		return false, zshrc, nil
	}
	block := fmt.Sprintf("\n# %s: musicctl Tab 补全\nfpath=(~/.zsh/completions $fpath)\nautoload -Uz compinit && compinit -i\n", marker)
	f, err := os.OpenFile(zshrc, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return false, zshrc, err
	}
	defer f.Close()
	if _, err := f.WriteString(block); err != nil {
		return false, zshrc, err
	}
	return true, zshrc, nil
}

// shellNameFromFile 从 $SHELL 路径提取 shell 名(复用 doctor 的同名逻辑,但避免跨包依赖)。
func shellNameFromFile(shellPath string) string {
	if shellPath == "" {
		return ""
	}
	base := shellPath
	for i := len(shellPath) - 1; i >= 0; i-- {
		if shellPath[i] == '/' {
			base = shellPath[i+1:]
			break
		}
	}
	switch base {
	case "zsh", "bash", "fish", "pwsh", "powershell":
		return base
	}
	return ""
}
