# <Domain>

<!--
  One file per PRODUCT DOMAIN — an area the end user recognizes.
  Not per feature, screen, sprint, or date. Not one file per decision.

  File name: docs/decisions/<domain>.md, kebab-case.
  E.g.: plans-and-quotas.md, authentication.md, payments.md.

  Remove these comments when instantiating.
-->

Affects: [login, billing, dashboard]

<!--
  `Affects:` goes right after the title, above the first clause.
  Features in kebab-case, from the vocabulary declared in INDEX.md.
  It is the input to `## By feature` — the index derives from here, not the other way around.
-->

### DEC-016 — Free-plan export quota

Free plan: 20 exports/mo.

_Changed 2026-08-05 — was: 10/mo. Reason: pilot feedback._

### DEC-021 — Annual-plan courtesy

Annual plan includes 2 courtesy months.

<!--
  ─────────────────────────────────────────────────────────────────────────
  WRITING RULES (summary; contract delivered in
  _app-vault/docs/TEMPLATES/DECISION_PROTOCOL.md)

  ANCHOR
    Each rule has its own heading: `### DEC-NNN — <rule>`, ID attached to the statement.
    Anchoring the whole file does not count: "per DEC-016" must be verifiable.

  IN-PLACE
    A decision is not replaced by another decision. The value changes, the DEC-NNN stays.
    There is no DEC retired by a newer DEC.

  NUMBERING
    Sequential PER PROJECT: max(existing) + 1, over docs/decisions/ — live clauses
    AND IDs listed in `## History`. Never reuse a number, including from a removed decision.
    Never prefix by domain (DEC-PAG-001).

  INLINE NOTE (only on change)
    One line, right below the statement:
      _Changed <date> — was: <old>. Reason: <reason>._
    The ID is not repeated — it is already in the heading.
    New notes stack ABOVE the previous one.
    Past ~3 notes on the clause: the old ones are DELETED (not archived).

  ADDITION
    A new clause that contradicts nothing: new DEC-NNN, NO alert and NO note.
    Brought a new domain or new `Affects:` tag: update INDEX.md in the same flow
    (## Domains, valid feature list, ## By feature).

  CROSS-DOMAIN
    Cite the sibling DEC inside the note of each touched file:
      _Changed 2026-08-05 — was: R$ 99/yr. Reason: price adjustment; see DEC-024 in payments.md._

  REMOVAL (rare)
    Search for pending citations of the ID first (including in .app-work/, which requires --hidden).
    Record in `## History` at the end of the file — the only history section that exists.
  The DECISION_PROTOCOL.md file materialized in the package is the complete
  operational reference. This comment is removed when instantiating the template.
  ─────────────────────────────────────────────────────────────────────────
-->

## History

<!--
  Exists only if there was a REMOVAL. One line per removal. Changes do NOT enter here —
  a change becomes an inline note under the clause.
  If this domain never had a removal, delete this entire section.
  The ID cited here must NOT exist as a clause above — if it exists, it was not removed.
-->

- 2026-08-05 — DEC-009 removed. Was: cap of 3 projects on the free plan. Reason: limit abolished.
