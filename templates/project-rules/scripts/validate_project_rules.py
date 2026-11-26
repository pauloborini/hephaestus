#!/usr/bin/env python3
"""Validate that the project governance (AGENTS.md + project-rules/) is self-contained and reachable.

Installed by the hephaestus kit as `project-rules/scripts/validate_project_rules.py`, byte for byte
identical to the kit copy; project-specific needs go through command-line flags, never edits.

Checks:
- root contract: `AGENTS.md` exists; `CLAUDE.md` is the `@AGENTS.md` bridge or a symlink to it;
- indexes: `project-rules/index/` exists, and when `AGENTS.md` declares a triage type table,
  every declared type has an index and every index has a declared type;
- broken reference: a cited governance file that does not exist;
- external dependency: a governance file citing a file outside `project-rules/`
  (`AGENTS.md`/`CLAUDE.md` may also point to `_app-vault/` and `.app-work/`);
  snapshots in `project-rules/contracts/` are copied contracts, not rule text, and are skipped;
- orphan: a file in `project-rules/{rules,reference,contracts}/` cited by no index.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple


GOVERNANCE_SUFFIXES = {".md", ".json", ".yaml", ".yml"}
PATTERN_MARKERS = ("<", ">", "*")
ROOT_ALLOWED_PREFIXES = ("_app-vault/", ".app-work/")
RAW_PATH_RE = re.compile(
    r"(?<![\w])(?P<path>(?:\.{1,2}/|/)?(?:[\w.<>{}*-]+/)*"
    r"[\w.<>{}*-]+\.(?:md|json|ya?ml))\b"
)
INLINE_PATH_RE = re.compile(r"`(?P<path>[^`\s]+\.(?:md|json|ya?ml))`")
LINK_PATH_RE = re.compile(r"\]\((?P<path>[^)\n]+\.(?:md|json|ya?ml)(?:#[^)\n]+)?)\)")
INLINE_GLOB_RE = re.compile(r"`(?P<path>[^`\s]*/[^`\s]*(?:\*|<[^>`\s]+>)[^`\s]*)`")
RAW_GLOB_RE = re.compile(r"(?<![\w])(?P<path>(?:\.{1,2}/|/)?(?:[\w.-]+/)+[\w.<>{}*-]+)")
TYPE_ROW_RE = re.compile(r"^\|\s*`(?P<type>[a-z0-9][a-z0-9_-]*)`\s*\|", re.MULTILINE)
URL_RE = re.compile(r"[a-z][a-z0-9+.-]*://[^\s)`>\]]+", re.IGNORECASE)


@dataclass(frozen=True)
class Violation:
    path: str
    line: int
    rule: str
    detail: str


class Project:
    def __init__(self, root: Path, extra_sources: Sequence[str]) -> None:
        self.root = root.resolve()
        self.rules = self.root / "project-rules"
        self.contracts = self.rules / "contracts"
        self.root_documents = (self.root / "AGENTS.md", self.root / "CLAUDE.md")
        self.extra_sources = tuple(self.root / item for item in extra_sources)

    def relative(self, path: Path) -> str:
        try:
            return path.resolve().relative_to(self.root).as_posix()
        except ValueError:
            return path.as_posix()

    def is_root_document(self, path: Path) -> bool:
        return path in self.root_documents

    def sources(self) -> List[Path]:
        found = [path for path in self.root_documents if path.is_file()]
        found += [path for path in self.extra_sources if path.is_file()]
        if self.rules.is_dir():
            found += sorted(
                path
                for path in self.rules.rglob("*")
                if path.is_file() and path.suffix in GOVERNANCE_SUFFIXES
            )
        return found


def _line(content: str, offset: int) -> int:
    return content[:offset].count("\n") + 1


def _is_inside(path: Path, base: Path) -> bool:
    try:
        path.relative_to(base)
    except ValueError:
        return False
    return True


def _has_pattern(reference: str) -> bool:
    return any(marker in reference for marker in PATTERN_MARKERS)


def _references(content: str, include_bare_globs: bool = True) -> List[Tuple[str, int]]:
    # URLs are not repository paths; blank them out keeping offsets, so line numbers stay true.
    content = URL_RE.sub(lambda match: " " * len(match.group(0)), content)
    references: Dict[Tuple[str, int], None] = {}
    protected: List[Tuple[int, int]] = []
    rich = [INLINE_PATH_RE, LINK_PATH_RE]
    if include_bare_globs:
        rich.append(INLINE_GLOB_RE)
    for pattern in rich:
        for match in pattern.finditer(content):
            reference = match.group("path").split("#", 1)[0].strip()
            references[(reference, _line(content, match.start("path")))] = None
            protected.append(match.span())
    raw = [RAW_PATH_RE]
    if include_bare_globs:
        raw.append(RAW_GLOB_RE)
    for pattern in raw:
        for match in pattern.finditer(content):
            if any(match.start() >= start and match.end() <= end for start, end in protected):
                continue
            reference = match.group("path").split("#", 1)[0].strip()
            if pattern is RAW_GLOB_RE and not _has_pattern(reference):
                continue
            references[(reference, _line(content, match.start("path")))] = None
    return list(references)


def _anchored_to_root(reference: str) -> bool:
    return reference.startswith("project-rules/") or reference.startswith(ROOT_ALLOWED_PREFIXES)


def _resolve(
    project: Project,
    source: Path,
    reference: str,
    by_name: Dict[str, List[Path]],
) -> Tuple[Optional[Path], Optional[str]]:
    if _anchored_to_root(reference):
        return (project.root / reference).resolve(), None
    if "/" not in reference:
        matches = by_name.get(reference, [])
        if len(matches) == 1:
            return matches[0].resolve(), None
        if len(matches) > 1:
            return None, f"{reference} is ambiguous"
        for candidate in (source.parent / reference, project.root / reference):
            if candidate.exists():
                return candidate.resolve(), None
        return None, f"{reference} does not exist"
    # Beside the citing file first, then relative to project-rules/ (`rules/x.md`), then the root.
    beside = (source.parent / reference).resolve()
    relative = reference.lstrip("/")
    for candidate in (project.rules / relative, project.root / relative):
        if not beside.exists() and candidate.exists():
            return candidate.resolve(), None
    return beside, None


def _pattern_base(project: Project, source: Path, reference: str) -> Path:
    prefix: List[str] = []
    for part in Path(reference).parts:
        if _has_pattern(part):
            break
        prefix.append(part)
    base = Path(*prefix) if prefix else Path()
    if _anchored_to_root(reference):
        return (project.root / base).resolve()
    return (source.parent / base).resolve()


def _is_system_path(project: Project, reference: str) -> bool:
    """Absolute or home paths whose first segment is not a repository entry (`/tmp/...`, `~/...`)."""
    if not reference.startswith(("/", "~")):
        return False
    parts = Path(reference.lstrip("/~")).parts
    return not parts or not (project.root / parts[0]).exists()


def _allowed_from_root(project: Project, source: Path, target: Path) -> bool:
    if not project.is_root_document(source):
        return False
    return any(
        _is_inside(target, (project.root / prefix.rstrip("/")).resolve())
        for prefix in ROOT_ALLOWED_PREFIXES
    )


def scan_root_contract(project: Project) -> List[Violation]:
    violations: List[Violation] = []
    agents, claude = project.root_documents
    if not agents.is_file():
        violations.append(Violation("AGENTS.md", 1, "missing_root_contract", "AGENTS.md does not exist"))
    if not claude.is_file():
        violations.append(Violation("CLAUDE.md", 1, "missing_claude_contract", "CLAUDE.md does not exist"))
    elif claude.is_symlink():
        if Path(claude.readlink()) != Path("AGENTS.md"):
            violations.append(
                Violation(
                    "CLAUDE.md",
                    1,
                    "invalid_claude_symlink",
                    "CLAUDE.md must be a relative symlink to AGENTS.md or contain '@AGENTS.md'",
                )
            )
    elif claude.read_text(encoding="utf-8").strip() not in ("@AGENTS.md", "AGENTS.md"):
        violations.append(
            Violation(
                "CLAUDE.md",
                1,
                "invalid_claude_content",
                "CLAUDE.md must contain only '@AGENTS.md' or be a symlink to AGENTS.md",
            )
        )
    return violations


def scan_indexes(project: Project) -> List[Violation]:
    index_root = project.rules / "index"
    if not index_root.is_dir():
        return [
            Violation(
                "project-rules/index",
                1,
                "missing_index_directory",
                "project-rules/index/ does not exist",
            )
        ]
    actual = {path.stem for path in index_root.glob("*.md")}
    if not actual:
        return [Violation("project-rules/index", 1, "missing_index_directory", "project-rules/index/ has no index")]
    agents = project.root_documents[0]
    if not agents.is_file():
        return []
    declared = set(TYPE_ROW_RE.findall(agents.read_text(encoding="utf-8")))
    if not declared:
        return []
    violations = [
        Violation(
            f"project-rules/index/{name}.md",
            1,
            "missing_required_index",
            f"AGENTS.md declares type `{name}` without an index",
        )
        for name in sorted(declared - actual)
    ]
    violations += [
        Violation(
            f"project-rules/index/{name}.md",
            1,
            "unexpected_index",
            "index without a matching type in the AGENTS.md triage table",
        )
        for name in sorted(actual - declared)
    ]
    return violations


def scan_dependencies(project: Project, sources: List[Path]) -> List[Violation]:
    by_name: Dict[str, List[Path]] = {}
    for path in sources:
        by_name.setdefault(path.name, []).append(path)
    rules_root = project.rules.resolve()
    root_documents = {path.resolve() for path in project.root_documents}
    violations: List[Violation] = []

    for source in sources:
        if _is_inside(source, project.contracts):
            continue
        content = source.read_text(encoding="utf-8")
        where = project.relative(source)
        for reference, position in _references(content, include_bare_globs=source.suffix == ".md"):
            if _is_system_path(project, reference):
                continue
            if _has_pattern(reference):
                base = _pattern_base(project, source, reference)
                if not _is_inside(base, rules_root) and not _allowed_from_root(project, source, base):
                    violations.append(
                        Violation(
                            where,
                            position,
                            "external_governance_pattern",
                            f"{reference} points a pattern outside project-rules/",
                        )
                    )
                continue
            resolved, error = _resolve(project, source, reference, by_name)
            if error is not None or resolved is None:
                violations.append(Violation(where, position, "missing_governance_reference", error or reference))
                continue
            if (
                resolved not in root_documents
                and not _allowed_from_root(project, source, resolved)
                and not _is_inside(resolved, rules_root)
            ):
                violations.append(
                    Violation(
                        where,
                        position,
                        "external_governance_dependency",
                        f"{reference} points outside project-rules/",
                    )
                )
            elif not resolved.exists():
                violations.append(
                    Violation(where, position, "missing_governance_reference", f"{reference} does not exist")
                )
    return violations


def scan_reachability(project: Project) -> List[Violation]:
    index_files = sorted((project.rules / "index").glob("*.md"))
    referenced = {
        Path(reference).name
        for path in index_files
        for reference, _ in _references(path.read_text(encoding="utf-8"))
        if not _has_pattern(reference)
    }
    violations: List[Violation] = []
    for folder in ("rules", "reference", "contracts"):
        for target in sorted((project.rules / folder).rglob("*")):
            if target.is_file() and target.suffix in GOVERNANCE_SUFFIXES and target.name not in referenced:
                violations.append(
                    Violation(
                        project.relative(target),
                        1,
                        "not_reachable_from_index",
                        "file is not triggered by any project-rules/index/*.md",
                    )
                )
    return violations


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--root",
        default=".",
        help="repository root holding AGENTS.md and project-rules/ (default: current directory)",
    )
    parser.add_argument(
        "--extra-source",
        action="append",
        default=[],
        metavar="PATH",
        help="extra governance file, relative to the root, checked like a project rule (repeatable)",
    )
    args = parser.parse_args(argv)
    project = Project(Path(args.root), args.extra_source)

    violations = scan_root_contract(project)
    if not project.rules.is_dir():
        violations.append(Violation("project-rules", 1, "missing_project_rules", "project-rules/ does not exist"))
    else:
        sources = project.sources()
        violations += scan_indexes(project)
        violations += scan_dependencies(project, sources)
        violations += scan_reachability(project)

    if violations:
        for item in violations:
            print(f"{item.path}:{item.line}: [{item.rule}] {item.detail}")
        print(f"\nProject rules: {len(violations)} violation(s).")
        return 1

    print(
        f"Project rules: {len(project.sources())} governance files checked; "
        "zero external dependency; graph reachable."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
