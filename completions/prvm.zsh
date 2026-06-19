#compdef prvm

# Zsh completion for prvm

_prvm() {
  local -a commands
  local -a common_options
  local -a save_options
  local -a test_options
  local -a eval_options
  local -a config_options
  local -a gitignore_options
  local -a show_options

  commands=(
    'init:Initialize prvm in current directory'
    'save:Save a new prompt or new version'
    'list:List all saved prompts'
    'show:Show prompt details'
    'use:Set active version'
    'rollback:Revert to previous version'
    'diff:Compare versions'
    'history:Show version history'
    'test:Test prompt with input file'
    'eval:Batch eval with multiple inputs'
    'export:Export prompt to JSON file'
    'import:Import prompt from JSON file'
    'current:Show active version content'
    'config:View or update configuration'
    'gitignore:Manage .gitignore entries'
  )

  common_options=()

  save_options=(
    '-n[Notes for this version]:notes:_files'
    '--notes[Notes for this version]:notes:_files'
    '-f[Skip the identical-content warning]'
    '--force[Skip the identical-content warning]'
  )

  test_options=(
    '-i[Path to input file]:input:_files'
    '--input[Path to input file]:input:_files'
    '-t[Override temperature (0-2)]:temperature:'
    '--temperature[Override temperature (0-2)]:temperature:'
    '-m[Override model]:model:'
    '--model[Override model]:model:'
    '-p[Override provider (anthropic, openai, gemini)]:provider:(anthropic openai gemini)'
    '--provider[Override provider (anthropic, openai, gemini)]:provider:(anthropic openai gemini)'
    '--max-tokens[Override max tokens]:tokens:'
  )

  eval_options=(
    '-v[Version to eval (defaults to active)]:version:'
    '--version[Version to eval (defaults to active)]:version:'
    '-a[Run eval against all versions]'
    '--all-versions[Run eval against all versions]'
    '--max-tokens[Override max tokens]:tokens:'
  )

  config_options=(
    '--show[Show current config]'
    '--provider[Set default provider]:provider:(anthropic openai gemini)'
    '--model[Set default model]:model:'
    '--temperature[Set default temperature]:temperature:'
    '--max-tokens[Set default max tokens]:tokens:'
    '--max-runs[Set max test runs to keep]:runs:'
  )

  gitignore_options=(
    '--add[Add .prompts to .gitignore]'
    '--remove[Remove .prompts from .gitignore]'
    '--yes[Skip confirmation]'
  )

  show_options=(
    '--version[Show specific version]:version:'
  )

  _arguments -C \
    '1: :->command' \
    '2: :->subcommand' \
    '*:: :->args'

  case $state in
    command)
      _describe -t commands 'prvm commands' commands
      ;;
    subcommand)
      case $words[1] in
        save)
          _arguments \
            $save_options
          ;;
        test)
          _arguments \
            $test_options
          ;;
        eval)
          _arguments \
            $eval_options
          ;;
        config)
          _arguments \
            $config_options
          ;;
        gitignore)
          _arguments \
            $gitignore_options
          ;;
        show|current)
          _arguments \
            $show_options
          ;;
      esac
      ;;
  esac
}

_prvm "$@"