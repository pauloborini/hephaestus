# Issues — document protocol

Record of UI/UX and behavior issues/defects found in the app. **Documentation only** — fixing happens in separate PRs/commits referencing the ID.

## Structure

```
.app-work/issues/
  README.md       ← this file (protocol)
  INDEX.md        ← live table by state + ID counter
  ISSUE-NNN.md    ← optional detail (evidence, technical notes)
```

## Line fields (INDEX.md)

| Field | Description |
|---|---|
| **ID** | `ISSUE-NNN` (3 digits, sequential — never reused) |
| **Sev** | S0 blocker · S1 critical · S2 major · S3 minor |
| **Feature** | Feature slug (`<project feature list>`) |
| **Screen** | Name of the screen or user-visible component |
| **Problem → Expected** | What is wrong → desired behavior/visual |
| **Origin** | Session, review, or audit where it was found |
| **State** | OPEN · FIXED · VERIFIED · CLOSED · WONTFIX · DUPLICATE |

## States

```text
OPEN -> FIXED -> VERIFIED -> CLOSED
             \-> WONTFIX
             \-> DUPLICATE (points to the original ID)
```

- `OPEN`: recorded, no work started.
- `FIXED`: code changed + regression test.
- `VERIFIED`: manually re-tested via the original repro steps, on the running app.
- `CLOSED`: `VERIFIED` + shipped in a release/note.
- **FIXED is not completion — only `VERIFIED`/`CLOSED` closes the cycle.**

## Severity

`S0` blocker · `S1` critical (blocks release) · `S2` major (workaround exists) · `S3` minor/cosmetic

Severity is **user impact**, not fix effort.

## Flow

1. **Record** — line in `INDEX.md` in the Open section, with the next free ID; increment the counter.
2. **Triage** — if the context does not fit the line (evidence, technical notes), create `ISSUE-NNN.md` alongside with the template below and link it on the line.
3. **Fix** — commit with a `Fixes: ISSUE-NNN` trailer; move to In verification (`FIXED`) noting fix and test.
4. **Close** — validate the repro in the app (`VERIFIED`); on release/note, move to Closed (`CLOSED`).

## Conventions

- An ID is **never** reused or renumbered. A line is **never** deleted.
- Screenshots stay out of Git (local attachments / prints in the conversation).
- Large issues may be broken into sub-items with a body checklist, but keep a single ID until an explicit split.
- Priority is **not** a required field; use a free-form label in the body if needed.
- Defect/issue → this record; new feature/track → master backlog — never duplicate elsewhere.
- A private repo versions this record (traceability); in a public repo the whole folder is gitignored (D43).

## Detail template (optional)

```markdown
# ISSUE-NNN — Short title

| Field | Value |
|---|---|
| **ID** | ISSUE-NNN |
| **Status** | OPEN |
| **Severity** | S2 |
| **Feature** | <slug> |
| **Screen** | Screen name |

## Problem

What is wrong today.

## Expected

Desired behavior/visual.

## Evidence

Screenshots (out of Git), prints, or code paths.

## Technical notes

Paths, components, APIs — filled in during triage.

## Related

Other IDs, if any.
```
