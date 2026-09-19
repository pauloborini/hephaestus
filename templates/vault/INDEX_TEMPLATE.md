---
vault_version: 1
updated: <YYYY-MM-DD>
scope: <short phrase for what the vault covers>
---

# <Project> — vault index

<!--
  Pointer, not content. Ceiling ~100 lines — past it, the index became content: refactor.

  The body has exactly three sections: Domains, Valid features, By feature.
  Do not add a new section — each one consumes ceiling and none is read as a pointer.

  NEVER enters here:
    - a living decision value (the value lives in docs/decisions/)
    - ANY pointer to .app-work/ (indexing it makes it discoverable and undoes the split)
    - plan, task, or sprint listings
    - a copy of a PRD or spec

  Remove these comments when instantiating.
-->

## Domains

<!-- one pointer per docs/decisions/ file, with one line on what it covers -->

- [plans-and-quotas](docs/decisions/plans-and-quotas.md) — plan quotas, prices, and limits
- [authentication](docs/decisions/authentication.md) — login, session, access recovery
- [payments](docs/decisions/payments.md) — billing, invoices, refunds

## Valid features

<!--
  Controlled vocabulary. Stable kebab-case slug, no version in the name.
  Tag outside this list: add it here or reject the tag.
-->

`login`, `billing`, `dashboard`, `onboarding`

## By feature

<!--
  Reverse index DERIVED from the `Affects:` fields of docs/decisions/*.md. Never written by hand.
  Diverged from `Affects:`? `Affects:` is the truth; fix it here.

  Example below derived from:
    plans-and-quotas  Affects: [login, billing, dashboard]
    autenticacao    Affects: [login, onboarding]
    pagamentos      Affects: [billing]
-->

- login → plans-and-quotas, authentication
- billing → plans-and-quotas, payments
- dashboard → plans-and-quotas
- onboarding → autenticacao
