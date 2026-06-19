#!/bin/bash
# Bash completion for prvm

_prvm_completions() {
  local cur prev words cword
  _init_completion || return

  local commands="init save list show use rollback diff history test eval export import current config gitignore"

  case $cword in
    1)
      COMPREPLY=($(compgen -W "$commands" -- "$cur"))
      ;;
    2)
      case $prev in
        save)
          # Complete prompt names (lowercase, alphanumeric, hyphens)
          COMPREPLY=($(compgen -W "" -- "$cur"))
          ;;
        show|use|rollback|diff|history|current|test)
          # Complete existing prompt names
          if [ -d ".prompts" ]; then
            COMPREPLY=($(compgen -W "$(ls -1 .prompts 2>/dev/null)" -- "$cur"))
          fi
          ;;
        eval)
          if [ -d ".prompts" ]; then
            COMPREPLY=($(compgen -W "$(ls -1 .prompts 2>/dev/null)" -- "$cur"))
          fi
          ;;
        export)
          if [ -d ".prompts" ]; then
            COMPREPLY=($(compgen -W "$(ls -1 .prompts 2>/dev/null)" -- "$cur"))
          fi
          ;;
        import|config|gitignore)
          COMPREPLY=()
          ;;
        *)
          COMPREPLY=()
          ;;
      esac
      ;;
    *)
      # Complete options for known commands
      case ${words[1]} in
        save)
          COMPREPLY=($(compgen -W "-n --notes -f --force" -- "$cur"))
          ;;
        test)
          COMPREPLY=($(compgen -W "-i --input -t --temperature -m --model -p --provider --max-tokens" -- "$cur"))
          ;;
        eval)
          COMPREPLY=($(compgen -W "-v --version -a --all-versions --max-tokens" -- "$cur"))
          ;;
        config)
          COMPREPLY=($(compgen -W "--show --provider --model --temperature --max-tokens --max-runs" -- "$cur"))
          ;;
        gitignore)
          COMPREPLY=($(compgen -W "--add --remove --yes" -- "$cur"))
          ;;
        show|current)
          COMPREPLY=($(compgen -W "--version" -- "$cur"))
          ;;
        *)
          COMPREPLY=()
          ;;
      esac
      ;;
  esac
}

complete -F _prvm_completions prvm