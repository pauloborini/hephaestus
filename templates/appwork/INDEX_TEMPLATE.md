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
| `references/` | third-party open source refs — ALWAYS gitignored; single home for clones |
| `private/` | private area (`auditorias/`, `ops/`, `research/`, `notes/`) — ALWAYS gitignored |
| `issues/` | single defect record (`ISSUE-NNN`, OPEN → FIXED → VERIFIED → CLOSED cycle) |
| `archive/` | dated mirror (`guides/<YYYY-MM>/semana-<N>/`, `perguntas/`, `prds/`, `roadmap/<MILESTONE>_<YYYY-MM>/`) + named drop-box — deletable |

## Golden rules

- `.app-work/` is process: **never** a rule input — living truth only in `_app-vault/docs/decisions/` (`### DEC-NNN` clauses).
- One canonical copy per file: an identical copy elsewhere is junk; before removing, prove the duplicate byte for byte (`cmp`).
- **Archive mirror (completed, move don't duplicate):** `guides/<PACK>/` → `archive/guides/<YYYY-MM>/semana-<N>/<PACK>/`; closed `brainstorming/<topic>/` → `archive/perguntas/<topic>/`; retired PRD → `archive/prds/`; milestone roadmap → `archive/roadmap/<MILESTONE>_<YYYY-MM>/`. Issues do not mirror (single record).
- A guide converted to a pack discards the monolith.
- Each content-heavy folder has its own `README.md` (e.g. `issues/README.md`, `archive/README.md`) — the index does not duplicate folder content.
- All of `.app-work/` is hidden from search (`rg --files` does not sweep it); whatever is not promoted to a decision is effectively lost — record `Decision candidates` in the packs' `LEDGER.md` (SCHEMA §6).
