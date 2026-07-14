# @in3pire/db

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![GitHub Repo stars](https://img.shields.io/github/stars/IN3PIRE/db?style=flat-square)](https://github.com/IN3PIRE/db)

**Database branch CLI — Git-like branching for Neon Postgres.**

[Changelog](CHANGELOG.md)

Create, diff, merge, and manage database branches from your terminal. Designed for modern development workflows where every PR, feature, or experiment gets its own isolated database.

> **Please support us by starring the repo — it increases development speed for us!** ⭐

```bash
# Authenticate
db auth login

# List branches
db branch list

# Create a branch from main
db branch create feat/awesome-feature

# Diff two branches
db branch diff feat/awesome-feature main

# Merge schema changes into main
db branch merge feat/awesome-feature main

# Clean up when done
db branch delete feat/awesome-feature
```

## Features

- **🔀 Git-like branching** — `db branch create`, `db branch list`, `db branch delete`, `db branch rename`
- **🛡 Branch protection** — Protect critical branches from accidental deletion or rename
- **🏷 Branch tagging** — Tag branches with labels for easy identification
- **📊 Schema diff** — See what changed between branches before merging
- **🔀 Schema merge** — Merge schema changes from one branch into another with `--dry-run`
- **📋 Full schema view** — `db branch schema` shows tables, columns, types, nullability, defaults, indexes
- **🔗 Auto-connect** — Print connection strings for any branch
- **🔁 Git branch sync** — Auto-create Neon branches from your Git branches
- **🔧 Multi-project** — Manage multiple Neon projects with `db project`
- **⚙ Config management** — View and set config via CLI with `db config`
- **🔬 Inline queries** — Run SQL against any branch with `db query`
- **📤 Export** — Export branch schema and data to SQL files
- **💾 Seed** — Populate branches from SQL files
- **🧹 Cleanup** — Auto-delete stale branches and prune old preview branches
- **🔗 CI/CD integration** — Spin up ephemeral branches for PR preview environments
- **📋 JSON output** — `--json` flag on `db branch list` and `db branch schema` for programmatic consumption
- **📝 Audit log** — Local operation history with `db log`
- **👁 Live watch** — Real-time branch monitoring with `db watch`
- **🎯 Branch validation** — Branch names validated on creation (alphanumeric start, safe characters only)
- **⚡ Shell completions** — Generate bash and zsh completions

## Installation

> **⚠️ Note:** `@in3pire/db` is published exclusively on **GitHub Packages**. The public npm registry (`npmjs.com`) is **not used**, so `npm install @in3pire/db` or `npx @in3pire/db` will **not work** without configuring GitHub Packages first.

### Prerequisites

- A GitHub [Personal Access Token](https://github.com/settings/tokens) with `read:packages` scope
- Your `~/.npmrc` must be configured to resolve the `@in3pire` scope to GitHub Packages

### Setup

```bash
# Configure npm to use GitHub Packages for the @in3pire scope
echo "@in3pire:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
```

### Install globally

```bash
npm install -g @in3pire/db
```

### Run directly (from release tarball, no install needed)

```bash
npx https://github.com/IN3PIRE/db/releases/download/v0.3.0/in3pire-db-0.3.0.tgz --help
```

## Quick Start

```bash
# Set up your Neon API key
db auth login

# See all branches
db branch list

# Create a branch for your feature
db branch create my-feature --from main

# Get the connection string
db connect my-feature

# Show schema
db branch schema my-feature

# Merge back when ready
db branch merge my-feature main
```

## Usage

### Authentication

| Command | Description |
|---|---|
| `db auth login` | Store your Neon API key (prompts interactively or reads stdin) |
| `db auth status` | Show whether an API key is configured |
| `db auth logout` | Remove stored credentials |
| `db auth set-project <id>` | Set default project ID |

```bash
# Login with your Neon API key
db auth login

# Check current auth status
db auth status

# Log out
db auth logout
```

### Branch Management

| Command | Description | Options |
|---|---|---|
| `db branch list` | List all branches | `-p, --project <id>`, `--json`, `--tags` |
| `db branch create <name>` | Create a new branch | `--from <branch>`, `--latest`, `-p, --project <id>` |
| `db branch rename <old> <new>` | Rename a branch | `-p, --project <id>` |
| `db branch delete <name>` | Delete a branch | `-f, --force`, `-p, --project <id>` |
| `db branch inspect <name>` | Show branch details | `-p, --project <id>` |
| `db branch protect <name>` | Protect from deletion/rename | `-p, --project <id>` |
| `db branch unprotect <name>` | Remove protection | `-p, --project <id>` |
| `db branch tag <name> <tag>` | Tag a branch with a label | `-p, --project <id>` |
| `db branch untag <name>` | Remove a tag | `-p, --project <id>` |
| `db branch set-default <name>` | Set as project default | `-p, --project <id>` |
| `db branch set-expiration <name> <date\|never>` | Set TTL on branch | `-p, --project <id>` |

```bash
# List all branches
db branch list
db branch list --json        # machine-readable
db branch list --tags        # show local tags

# Create a branch
db branch create <name>
db branch create <name> --from <parent-branch>
db branch create <name> --latest

# Protect/unprotect
db branch protect main
db branch unprotect main

# Tagging
db branch tag main production
db branch untag main

# Make a branch the project default
db branch set-default staging

# Set a branch to auto-delete in 7 days
db branch set-expiration feat/experiment 2026-07-22T00:00:00Z
db branch set-expiration feat/experiment never    # clear expiration

# Delete
db branch delete <name>
db branch delete <name> --force    # skip confirmation

# Rename
db branch rename <old-name> <new-name>
```

### Schema & Diff

| Command | Description | Options |
|---|---|---|
| `db branch diff <a> [b]` | Schema diff between branches | `-p, --project <id>`, `--schema <schema>` |
| `db branch schema <name>` | Show full schema (tables, columns, indexes) | `-p, --project <id>`, `--schema <schema>`, `--json` |
| `db branch tables <name>` | List tables in a branch | `-p, --project <id>`, `--schema <schema>` |
| `db branch merge <source> <target>` | Merge schema changes into target | `-p, --project <id>`, `--schema <schema>`, `--dry-run` |

```bash
# Show schema diff between two branches
db branch diff feat/awesome main

# Show full schema
db branch schema main
db branch schema main --json
db branch schema main --schema custom_schema

# List tables
db branch tables feat/awesome

# Merge schema changes (with dry-run first)
db branch merge feat/awesome main --dry-run
db branch merge feat/awesome main
```

### Connect

| Command | Description | Options |
|---|---|---|
| `db connect <branch>` | Get a PostgreSQL connection string | `--pooled`, `-p, --project <id>` |

```bash
# Get connection string for a branch
db connect <branch-name>
db connect <branch-name> --pooled
```

### Project Management

| Command | Description |
|---|---|
| `db project list` | List all Neon projects |
| `db project switch <id>` | Switch default project |
| `db project current` | Show current project |
| `db project inspect` | Show project details |

```bash
db project list
db project switch <project-id>
db project current
db project inspect
```

### Config

| Command | Description |
|---|---|
| `db config list` | Show all configuration values |
| `db config get <key>` | Get a specific config value |
| `db config set <key> <value>` | Set a config value |

```bash
db config list
db config get NEON_PROJECT_ID
db config set default_branch staging
```

### Query & Export

| Command | Description | Options |
|---|---|---|
| `db query <branch> <sql>` | Run SQL against a branch | `--json`, `--limit <n>`, `-p, --project <id>` |
| `db export <branch>` | Export schema to SQL file | `-o, --output <file>`, `--data`, `--schema <schema>`, `-p, --project <id>` |

```bash
# Run a query
db query main "SELECT * FROM users"
db query main "SELECT * FROM users" --json
db query main "SELECT * FROM users" --limit 10

# Export schema to file
db export main -o schema.sql
db export main -o full.sql --data
```

### Git Sync

| Command | Description | Options |
|---|---|---|
| `db git sync` | Create Neon branches for Git branches | `--prefix <prefix>`, `--prune`, `--dry-run`, `-p, --project <id>` |
| `db git status` | Show Git ↔ Neon branch mapping | `--prefix <prefix>`, `-p, --project <id>` |

```bash
# Sync: creates git-<branch> Neon branches for each local Git branch
db git sync
db git sync --prefix feat-
db git sync --prune              # delete orphaned Neon branches
db git sync --dry-run            # preview only

# Show mapping
db git status
```

### Seed & Prune

| Command | Description | Options |
|---|---|---|
| `db seed <branch> <file>` | Seed branch from SQL file | `--drop-first`, `-p, --project <id>` |
| `db prune` | Bulk delete stale branches | `--older-than <days>`, `--except <names...>`, `--dry-run`, `--force`, `-p, --project <id>` |

```bash
# Seed a branch with data
db seed staging ./seed.sql
db seed staging ./seed.sql --drop-first    # drop tables first

# Prune stale branches (not modified in 30 days)
db prune
db prune --older-than 14
db prune --older-than 30 --except main staging
db prune --dry-run          # see what would be deleted
db prune --force            # skip confirmation
```

### CI / Preview Environments

| Command | Description | Options |
|---|---|---|
| `db ci preview <pr-number>` | Create ephemeral PR branch | `-p, --project <id>`, `-f, --from <branch>` |
| `db ci cleanup` | Delete stale preview branches | `--days <n>`, `--dry-run`, `-p, --project <id>` |
| `db ci setup` | Generate GitHub Actions workflow | — |

```bash
# Create an ephemeral branch for a PR
db ci preview 42

# Clean up stale preview branches
db ci cleanup --days 7
db ci cleanup --dry-run

# Generate a CI workflow
db ci setup > .github/workflows/db-preview.yml
```

### Restore & Reset

| Command | Description | Options |
|---|---|---|
| `db restore <branch> [name]` | Create a restore point | `--from <branch>`, `-p, --project <id>` |
| `db reset <branch>` | Reset branch to match another | `--to <branch>`, `--force`, `-p, --project <id>` |

```bash
# Create a restore point before making changes
db restore main pre-migration-backup

# Reset a branch to match main
db reset feat/experiment --to main
db reset feat/experiment --to main --force
```

### Monitoring & Logs

| Command | Description | Options |
|---|---|---|
| `db log show` | Show operation history | `--json`, `-n, --number <n>` |
| `db log clear` | Clear history | — |
| `db watch` | Watch branches in real-time | `-i, --interval <s>`, `-n, --number <n>`, `-p, --project <id>` |

```bash
# View branch operation history
db log show
db log show --json
db log show -n 10

# Watch branches (poll every 5 seconds)
db watch
db watch --interval 2    # poll every 2 seconds
```

### Shell Completions

```bash
db completion bash > /usr/local/etc/bash_completion.d/db
db completion zsh > /usr/local/share/zsh/site-functions/_db
```

### Branch Name Rules

Branch names must:
- Start with an alphanumeric character (`a-z`, `A-Z`, `0-9`)
- Contain only alphanumeric characters, underscores (`_`), dots (`.`), and hyphens (`-`)
- Be at least 1 character long

Invalid names: `-starts-with-hyphen`, `.starts-with-dot`, `with spaces`, `with/slashes`

## CI/CD Integration

`db` comes with built-in CI support. Run `db ci setup` to generate a GitHub Actions workflow:

```yaml
name: Database Preview
on: [pull_request]
jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx @in3pire/db ci preview ${{ github.event.number }}
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
          NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
```

The preview branch is automatically cleaned up when the PR is merged or closed.

### GitHub Actions Workflow for PR Previews

Add the following secret to your GitHub repository:

| Secret | Value |
|---|---|
| `NEON_API_KEY` | Your Neon API key |
| `NEON_PROJECT_ID` | (Optional) Your Neon project ID |

### Cleanup Cron

To automatically clean up stale preview branches, add a scheduled workflow:

```yaml
name: Cleanup Preview Branches
on:
  schedule:
    - cron: "0 6 * * 1"  # Every Monday at 6 AM

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx @in3pire/db ci cleanup --days 14
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
          NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
```

## Configuration

`db` stores config in `~/.config/in3pire-db/config.json`:

| Key | Description | Default | Env var |
|---|---|---|---|
| `NEON_API_KEY` | Neon API key | — | `NEON_API_KEY` |
| `NEON_PROJECT_ID` | Default project ID | — | `NEON_PROJECT_ID` |
| `default_branch` | Default parent branch | `main` | — |

**Resolution order** (for API key and project ID):
1. Command-line option (e.g. `--project <id>`)
2. Environment variable (`NEON_API_KEY`, `NEON_PROJECT_ID`)
3. Stored config file (`~/.config/in3pire-db/config.json`)

Set via `db auth login`, or by creating a `.env` file in your working directory:

```env
NEON_API_KEY=your-neon-api-key
NEON_PROJECT_ID=your-project-id
```

## Troubleshooting

### "401 Unauthorized" when installing/running

**Cause:** GitHub Packages authentication is not configured.

**Solution:**
1. Create a GitHub PAT with `read:packages` scope
2. Add it to `~/.npmrc`:
   ```bash
   echo "@in3pire:registry=https://npm.pkg.github.com" >> ~/.npmrc
   echo "//npm.pkg.github.com/:_authToken=YOUR_PAT" >> ~/.npmrc
   ```
3. Verify with `npm ping`

### "API key not configured" or authentication errors

**Cause:** No Neon API key has been set.

**Solution:**
```bash
# Via CLI (interactive)
db auth login

# Via env var
export NEON_API_KEY="your-neon-api-key"
# Or create a .env file in your project root
```

Get your API key from the [Neon Console](https://console.neon.tech/docs/keys).

### "Project not found" or 404 errors

**Cause:** The project ID is wrong or missing.

**Solution:**
```bash
# Pass it explicitly
db branch list --project <your-project-id>

# Or set a default
export NEON_PROJECT_ID="your-project-id"
db auth login   # stores it permanently
```

### "Branch not found" when using diff, inspect, connect

**Cause:** The branch name doesn't exist in the project, or there are multiple branches with similar names and the wrong one was matched.

**Solution:**
- List branches first: `db branch list`
- Use the full branch name, not a prefix
- Verify the branch exists in the listed output

### "Branch name contains invalid characters"

**Cause:** Branch names must start with an alphanumeric character and contain only letters, numbers, underscores, hyphens, and dots.

**Solution:** Rename the branch using valid characters:
```bash
db branch rename "bad/name" "good-name"
```

### `db ci setup` did nothing

**Cause:** The command outputs the workflow to stdout — it doesn't write files automatically.

**Solution:** Redirect the output:
```bash
db ci setup > .github/workflows/db-preview.yml
```

### Connection string does not connect

**Cause:** The branch may not have an active endpoint, or the IP isn't allow-listed.

**Solution:**
1. Verify the endpoint exists: `db branch inspect <name>`
2. Check Neon Console for IP allow-list settings
3. Ensure your compute is not suspended (cold start can take a few seconds)

### Tests are failing

**Cause:** Missing dependencies or incorrect Node.js version.

**Solution:**
```bash
# Minimum Node.js version
node --version   # should be >= 18

# Reinstall dependencies
npm ci

# Run tests
npm test
```

### "No branches found" on a new project

**Cause:** A freshly created Neon project has no branches yet (beyond the initial `main`).

**Solution:** Create your first branch:
```bash
db branch create staging
db branch list
```

## Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
git clone https://github.com/IN3PIRE/db.git
cd db
npm install
```

### Scripts
| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run dev` | Run the CLI in development mode (tsx watch) |
| `npm test` | Run all unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

### Branch Name Validation

Branch names are validated with the pattern `/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/`. This ensures compatibility with Neon's API, file systems, and URL path segments.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed version history.

## License

MIT — see [LICENSE](LICENSE)
