---
updated: <YYYY-MM-DD>
scope: <short phrase for what the project's process covers>
---

# <Project> — process index (.app-work)

<!--
  Map, not content — same pattern as the vault INDEX.md (SCHEMA §3). Ceiling ~100 lines:
  past it, the index became content: refactor.

  The body has exactly two sections: Canonical folders and Golden rules.
  Do not add a new section.

  NEVER enters here:
    - a living decision value (the value lives in _app-vault/docs/decisions/)
    - guide, brainstorm, PRD, or issue content
    - plan, task, or sprint listings

  This file is the AGENTS.md anchor: it is the process organization map, not a rule source.
  All of .app-work/ itself is forbidden as a rule input (SCHEMA §2.1 and §8).

  Remove these comments when instantiating.
-->

## Canonical folders

| Folder | Role |
|---|---|
| `hephaestus-state.json` | versioned kit state (root) |
| `guides/` | in-flight execution packs (`<NAME>_GUIDE/` with INTENT, GUIDE, LEDGER, and `plans/`) |
| `guides/legados/` | monoliths still cited without their own pack |
| `roadmap/` | live versioned queue (`ROADMAP.md` + slices/) — never in `private/` |
| `brainstorming/` | process notebook — on close, it routes and does not remain as a living reference |
| `prd/` | dated proposals — not always fully fulfilled; not a contract |
| `docs/` | live ops/product docs; omit when empty |
| `releases/` | per-version release records and the build/release runbook |
| `tests/` | test map and cases; evidence is versioned as text only |
| `exec-roadmap/` | execution roadmaps by topic (`<topic>/`) |
| `design-system/` | dated design-system explorations |
| `autopilot/` | autopilot runs: state and reports |
| `media/` | store and social assets |
| `prototypes/` | exploratory HTML prototypes |
| `references/` | third-party open source refs — ALWAYS gitignored; single home for clones |
| `private/` | private area (`auditorias/`, `ops/`, `research/`, `notes/`) — ALWAYS gitignored |
| `issues/` | kit findings record (`ISSUE-NNN`, OPEN → FIXED → VERIFIED → CLOSED cycle); a project defect registry may coexist in this folder |
| `archive/` | dated mirror (`guides/<YYYY-MM>/semana-<N>/`, `perguntas/`, `prds/`, `roadmap/<MILESTONE>_<YYYY-MM>/`) + named drop-box — deletable |

## Golden rules

- `.app-work/` is process: **never** a rule input — living truth only in `_app-vault/docs/decisions/` (`### DEC-NNN` clauses).
- One canonical copy per file: an identical copy elsewhere is junk; before removing, prove the duplicate byte for byte (`cmp`).
- **Archive mirror (completed, move don't duplicate):** legacy `guides/<PACK>/` without `pack.json` → `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/`; a pack with `pack.json` stays in `guides/` (archive is its `archived` field, set by the pack engine); closed `brainstorming/<topic>/` → `archive/perguntas/<topic>/`; retired PRD → `archive/prds/`; milestone roadmap → `archive/roadmap/<MILESTONE>_<YYYY-MM>/`; retired release record → `archive/releases/`. Issues do not mirror (the kit's index does not mirror).
- A guide converted to a pack discards the monolith.
- Folder names in the closed list are English (SCHEMA §2): a localized name (`testes/`, `midia/`) is legacy and relocates to the canonical one. Folders written by another tool (`releases/`, `tests/`, `exec-roadmap/`, `design-system/`, `autopilot/`) are not reorganized by the kit.
- Versioned process files carry no real personal data (e-mail, phone, account or device ID, token, home path): use role placeholders (`<admin-account>`). Evidence and receipts are versioned as text only; screenshots, videos, and raw logs stay local (`.gitignore`). On a public repository, `issues/`, `guides/`, `brainstorming/`, `prd/`, and `archive/` stay local too.
- Each content-heavy folder has its own `README.md` (e.g. `issues/README.md`, `archive/README.md`) — the index does not duplicate folder content.
- All of `.app-work/` is hidden from search (`rg --files` does not sweep it); whatever is not promoted to a decision is effectively lost — record `Decision candidates` in the packs' `LEDGER.md` (SCHEMA §6).
