# Canonical Structure Notes

## Goal

Describe how to interpret the canonical structure without tying the kit to any specific domain.

## Suggested reading

- `AGENTS.md`
  - human and operational entrypoint of the generated package
- `CLAUDE.md`
  - one-line bridge (`@AGENTS.md`) for clients that only read `CLAUDE.md`; never its own content
- `project-rules/index/*`
  - routers per task type
- `project-rules/rules/*`
  - normative, mandatory rules
- `project-rules/reference/*`
  - support, examples, and long contracts
- `project-rules/contracts/*`
  - external contracts (e.g. OpenAPI), when present — consult-only
- `.hephaestus/manifests/*`
  - traceability, coverage, and validation of the generation process

## Central rule

The structure exists to reduce improvisation and context cost.
It does not exist to maximize the number of files.

## Notes

- The generated package is framework-agnostic: the structure is fixed, the content (gates, checklists, commands) is filled in according to the project's real stack.
- There is no memory folder in the canonical structure; persistent agent preferences belong to the client's memory system.
