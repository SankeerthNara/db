<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/db-数据库分支 CLI-6C47FF?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=1a1a2e">
    <img alt="db" src="https://img.shields.io/badge/db-数据库分支 CLI-6C47FF?style=for-the-badge&logo=postgresql&logoColor=white&labelColor=f0f0ff">
  </picture>
</p>

<p align="center">
  <b>Git-like branching for Neon Postgres.</b><br>
  Create, diff, merge, and manage database branches from your terminal.<br>
  Every PR, every experiment, every feature — its own isolated database in seconds.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Install</a> •
  <a href="CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="MIT"></a>
  <a href="https://github.com/IN3PIRE/db/releases"><img src="https://img.shields.io/github/v/release/IN3PIRE/db?style=flat-square&color=6C47FF" alt="Release"></a>
  <a href="https://github.com/IN3PIRE/db"><img src="https://img.shields.io/github/stars/IN3PIRE/db?style=flat-square&color=ff6b6b" alt="Stars"></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square" alt="TypeScript"></a>
  <a href="#"><img src="https://img.shields.io/badge/Node-18+-339933?style=flat-square" alt="Node"></a>
  <a href="https://console.neon.tech"><img src="https://img.shields.io/badge/Neon-API-00E599?style=flat-square" alt="Neon"></a>
</p>

<br>

```bash
# One command → one isolated Postgres database
db branch create feat/payment-redesign
db connect feat/payment-redesign
# → postgresql://user@ep-cool-123.us-east-2.aws.neon.tech/neondb

# Iterate safely. Diff before you merge.
db branch diff feat/payment-redesign main
# → + users (new table)
# → ~ orders + payment_method (new column)

# Merge when ready. Delete when done.
db branch merge feat/payment-redesign main
db branch delete feat/payment-redesign
```

---

## What is this?

**`db`** is a CLI that wraps the [Neon](https://neon.tech) Postgres branching API into a Git-like experience. It turns your database into a version-controllable resource — same mental model as `git branch`, but for schemas.

No Docker. No `pg_dump` pipelines. No manual `CREATE DATABASE`. Just instant, isolated Postgres databases you can create, diff, merge, and destroy from your terminal.

## Why?

| Problem | How `db` fixes it |
|---|---|
| Sharing a single dev DB | Every dev gets their own branch. No stepping on each other. |
| Schema changes without CI | Diff branches locally before merging. Catch issues early. |
| Ephemeral test environments | Spin up a branch per PR. Auto-delete on merge. |
| "Works on my machine" | Production-like data in every branch. Same schema, same seed data. |
| Manual restore points | `db restore main pre-migration` — instant snapshot before risky operations. |

---

## Quick Start

```bash
# 1. Authenticate with Neon
db auth login

# 2. See your branches
db branch list

# 3. Create a branch for your feature
db branch create feat/awesome

# 4. Connect any tool (psql, Prisma, Drizzle…)
db connect feat/awesome

# 5. Diff before merging
db branch diff feat/awesome main

# 6. Merge schema changes
db branch merge feat/awesome main

# 7. Clean up
db branch delete feat/awesome
```

---

## Key Features

### Branch Management
```
db branch create <name>              Create a branch
db branch list                       List all branches (--json, --tags)
db branch delete <name>              Delete a branch
db branch rename <old> <new>         Rename a branch
db branch search <pattern>           Find branches by name
db branch inspect <name>             Show branch details
```

### Safety & Organisation
```
db branch protect <name>             Lock branches from deletion/rename
db branch tag <name> <label>         Label branches for organisation
db branch set-default <name>         Set project default branch
db branch set-expiration <name> <t>  Auto-delete after TTL
```

### Schema Operations
```
db branch diff <a> [b]               Schema diff between branches
db branch schema <name>              Full schema view (tables, columns, indexes)
db branch tables <name>              List tables
db branch merge <source> <target>    Merge schema changes (--dry-run)
```

### Data Operations
```
db query <branch> <sql>              Run SQL (--json, --limit)
db export <branch> -o file.sql       Export schema/data to SQL
db seed <branch> <file>              Seed from SQL file
```

### Git & CI Integration
```
db git sync                          Mirror Git branches → Neon branches
db git status                        Show Git ↔ Neon mapping
db ci preview <pr>                   Ephemeral PR preview branch
db ci cleanup                        Clean stale preview branches
db ci setup                          Generate GitHub Actions workflow
```

### Diagnostics & Management
```
db doctor                            Validate config, API, connectivity
db endpoint list/create/delete        Manage compute endpoints
db role list <branch>                List database roles
db project list/switch/current       Multi-project support
db prune                             Bulk delete stale branches
db restore <branch> [name]           Create restore points
db reset <branch> --to <target>      Reset branch to match another
db log show                          Operation history
db watch                             Real-time branch monitor
db completion bash/zsh               Shell completions
db config get/set/list               Manage configuration
```

---

## Installation

<details>
<summary><b>Prerequisite: GitHub Packages authentication</b></summary>

`@in3pire/db` is distributed via GitHub Packages. You need a GitHub [Personal Access Token](https://github.com/settings/tokens) with `read:packages` scope.

```bash
echo "@in3pire:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
```
</details>

```bash
npm install -g @in3pire/db

# Or run directly without installing:
npx https://github.com/IN3PIRE/db/releases/download/v0.4.0/in3pire-db-0.4.0.tgz --help
```

---

## Configuration

`db` resolves settings in this order: **CLI flag → env var → config file**.

| Key | Env var | Default | Description |
|---|---|---|---|
| `NEON_API_KEY` | `NEON_API_KEY` | — | Your Neon API key |
| `NEON_PROJECT_ID` | `NEON_PROJECT_ID` | — | Default project ID |
| `default_branch` | — | `main` | Default parent branch |

Set via `db auth login`, environment variables, or a `.env` file:

```env
NEON_API_KEY=your-neon-api-key
NEON_PROJECT_ID=your-project-id
```

---

## CI/CD: Database per PR

Spin up an isolated Postgres database for every pull request — automatically.

```bash
db ci setup > .github/workflows/db-preview.yml
```

This generates a workflow that:
1. Creates a branch for each PR
2. Seeds it with your schema
3. Provides the connection string as a PR comment
4. Cleans up when the PR is merged

Add `NEON_API_KEY` and `NEON_PROJECT_ID` to your repo secrets, and you're done.

---

## Development

```bash
git clone https://github.com/IN3PIRE/db.git
cd db
npm install
npm run dev          # Run in dev mode
npm test             # Run tests (Vitest)
npm run build        # Compile to dist/
```

Branch naming rules: start with alphanumeric, use `a-z`, `A-Z`, `0-9`, `_`, `.`, `-`.

---

## Support the Project

If `db` makes your database workflows faster or your deployments safer, give it a star ⭐ — it signals that this project is worth maintaining and improving.

Questions, ideas, or issues? [Open a discussion](https://github.com/IN3PIRE/db/discussions) or [file an issue](https://github.com/IN3PIRE/db/issues).

<p align="center">
  <a href="https://github.com/IN3PIRE/db/stargazers">
    <img src="https://img.shields.io/github/stars/IN3PIRE/db?style=social" alt="Star">
  </a>
</p>

---

<p align="center"><sub>MIT License · Built with TypeScript · Powered by <a href="https://neon.tech">Neon</a></sub></p>
