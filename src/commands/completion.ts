import { Command } from "commander";

export function registerCompletionCmd(program: Command) {
  const completion = program
    .command("completion")
    .description("Generate shell completion scripts");

  completion
    .command("bash")
    .description("Generate bash completion script")
    .action(() => {
      const script = `_db_completions() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  opts="auth branch connect ci config project restore reset export query log watch completion --help --version"

  case "\${prev}" in
    auth)       COMPREPLY=($(compgen -W "login logout status set-project" -- "\${cur}")) ;;
    branch|br)  COMPREPLY=($(compgen -W "list create delete rename inspect diff protect unprotect tag untag tables merge" -- "\${cur}")) ;;
    connect|conn) COMPREPLY=($(compgen -W "--pooled --project" -- "\${cur}")) ;;
    ci)         COMPREPLY=($(compgen -W "preview cleanup setup" -- "\${cur}")) ;;
    config)     COMPREPLY=($(compgen -W "list get set" -- "\${cur}")) ;;
    project|proj) COMPREPLY=($(compgen -W "list switch current inspect" -- "\${cur}")) ;;
    log)        COMPREPLY=($(compgen -W "show clear" -- "\${cur}")) ;;
    completion) COMPREPLY=($(compgen -W "bash zsh" -- "\${cur}")) ;;
    *)
      if [[ "\${cur}" == -* ]]; then
        COMPREPLY=($(compgen -W "--help --version" -- "\${cur}"))
      fi
      ;;
  esac
}

complete -F _db_completions db
`;
      console.log(script);
      console.error("# Save with: db completion bash > /etc/bash_completion.d/db");
    });

  completion
    .command("zsh")
    .description("Generate zsh completion script")
    .action(() => {
      const script = `#compdef db

local -a commands

commands=(
  'auth:Manage authentication'
  'branch:Manage database branches'
  'connect:Get a connection string for a branch'
  'ci:CI/CD integration commands'
  'config:Manage local configuration'
  'project:Manage Neon projects'
  'restore:Restore a branch'
  'reset:Reset a branch to match another'
  'export:Export schema to SQL file'
  'query:Run a SQL query against a branch'
  'log:Show branch operation history'
  'watch:Watch branches in real-time'
  'completion:Generate shell completion scripts'
)

_arguments \\
  '1: :->command' \\
  '*: :->args'

case $state in
  command)
    _describe 'command' commands
    ;;
  args)
    case $words[1] in
      auth)      _arguments '1: :(login logout status set-project)' ;;
      branch|br) _arguments '1: :(list create delete rename inspect diff protect unprotect tag untag tables merge)' ;;
      ci)        _arguments '1: :(preview cleanup setup)' ;;
      config)    _arguments '1: :(list get set)' ;;
      project|proj) _arguments '1: :(list switch current inspect)' ;;
      log)       _arguments '1: :(show clear)' ;;
      completion) _arguments '1: :(bash zsh)' ;;
    esac
    ;;
esac
`;
      console.log(script);
      console.error("# Save with: db completion zsh > /usr/local/share/zsh/site-functions/_db");
    });
}
