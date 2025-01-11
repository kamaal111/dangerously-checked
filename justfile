set export
set dotenv-load

PNPM_VERSION := "9.15.3"

# List available commands
default:
    just --list --unsorted

# Run Danger in CI
danger-ci:
    pnpm run danger ci

# Run quality scripts with lint fixing
quality-fix: lint-fix type-check

# Run quality scripts
quality: lint type-check

# Lint code
lint:
    #!/bin/zsh

    . .venv/bin/activate
    ruff check .

# Lint and fix any issues that can be fixed automatically
lint-fix:
    #!/bin/zsh

    . .venv/bin/activate
    ruff check . --fix

# Type check
type-check:
    #!/bin/zsh

    . .venv/bin/activate
    mypy .

# Format code
format:
    #!/bin/zsh

    . .venv/bin/activate
    ruff format .

# Prepare project to work with
prepare: install-modules

# Bootstrap project
bootstrap: install-rye install-node install-pnpm prepare setup-pre-commit

# Install modules
install-modules:
    #!/bin/zsh

    . ~/.rye/env || true

    rye sync
    pnpm i

[private]
setup-pre-commit:
    #!/bin/zsh

    . .venv/bin/activate
    pre-commit install

[private]
install-pnpm:
    corepack install -g pnpm@$PNPM_VERSION

[private]
install-node:
    curl -fsSL https://fnm.vercel.app/install | bash

    fnm completions --shell zsh
    fnm install

[private]
install-rye:
    #!/bin/zsh

    curl -sSf https://rye.astral.sh/get | RYE_INSTALL_OPTION="--yes"  bash

    . ~/.rye/env || true

    mkdir -p ~/.zfunc
    rye self completion -s zsh > ~/.zfunc/_rye

    if [[ -n $ZSH_CUSTOM ]]
    then
        mkdir -p $ZSH_CUSTOM/plugins/rye
        rye self completion -s zsh > $ZSH_CUSTOM/plugins/rye/_rye
    fi
