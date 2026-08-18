// AC-4.3.1, AC-4.3.2 e AC-4.3.3 (CN1, seam S6, golden replay): o fixture
// `pacote-adopt` — capturado pela execução do pipeline de referência sobre o
// `repo-desorganizado` (proveniência no cabeçalho do staging-manifest) — é o
// pacote final de uma execução `adopt`: os quatro territórios presentes e
// coerentes, a regra enterrada no README virou DEC-NNN em
// `_app-vault/docs/decisions/`, `project-rules/` cita o ID sem repetir o
// valor, guide e brainstorm movidos para `.app-work/` sem reescrita,
// `INDEX.md` derivado dos campos `Afeta:` e scaffold de `.app-work/` restrito
// à lista fechada de SCHEMA.md §2 com `.app-work/.gitignore` presente.
// O validador real (`validate-package.mjs`) aprova o pacote inteiro — o mesmo
// comando do gate agregado da trilha.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { runNode } from "./helpers/fs-utils.mjs";
import { copyFixture } from "./helpers/fixtures.mjs";
import { runAdoptPipeline } from "./helpers/compose-engine.mjs";
import { parseDecisionFile } from "./helpers/reconcile-engine.mjs";

const FIXTURE = path.join(import.meta.dirname, "fixtures", "pacote-adopt");
const NOW = "2026-08-12";
const runValidator = (pkgDir) => runNode(["scripts/validate-package.mjs", pkgDir]);

const read = (rel) => fs.readFileSync(path.join(FIXTURE, rel), "utf8");

test("AC-4.3.1/CN1: pacote-adopt valida ponta a ponta (gate agregado da trilha)", () => {
  const result = runValidator(FIXTURE);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes("Package validation passed"), result.stdout);
});

test("AC-4.3.1/CN1: os quatro territórios existem e estão coerentes", () => {
  // agents
  assert.ok(fs.existsSync(path.join(FIXTURE, "AGENTS.md")), "AGENTS.md ausente");
  assert.match(read("AGENTS.md"), /^# .+— contrato do agente/m);
  // project-rules
  assert.ok(fs.existsSync(path.join(FIXTURE, "project-rules", "rules", "domain_rules.md")));
  assert.ok(fs.existsSync(path.join(FIXTURE, "project-rules", "index", "README.md")));
  // vault
  assert.ok(fs.existsSync(path.join(FIXTURE, "_app-vault", "INDEX.md")));
  assert.ok(fs.existsSync(path.join(FIXTURE, "_app-vault", "docs", "decisions", "produto.md")));
  assert.ok(fs.existsSync(path.join(FIXTURE, "_app-vault", "docs", "decisions", "ideias.md")));
  // process
  assert.ok(fs.existsSync(path.join(FIXTURE, ".app-work", ".gitignore")));
  assert.ok(fs.existsSync(path.join(FIXTURE, ".app-work", "brainstorming", "tema-x.md")));
  assert.ok(
    fs.existsSync(
      path.join(
        FIXTURE,
        ".app-work",
        "archive",
        "guides",
        "2026-08",
        "semana-2",
        "XPTO_GUIDE",
        "GUIDE.md",
      ),
    ),
  );
  assert.ok(fs.existsSync(path.join(FIXTURE, ".app-work", "references", "analise-argus.md")));
});

test("AC-4.3.1/CN1: a regra enterrada no README virou DEC-NNN e project-rules cita o ID sem repetir o valor", () => {
  // o valor mora em um único território: a decisão
  const produto = read("_app-vault/docs/decisions/produto.md");
  assert.match(produto, /### DEC-002 — Limite de consultas/);
  assert.ok(produto.includes("20 consultas por mês"), produto);
  // o resíduo da LLM congelado também virou decisão (ideias.md)
  assert.match(read("_app-vault/docs/decisions/ideias.md"), /### DEC-001 — Ideias/);
  // project-rules/ cita o ID sem repetir o valor
  const domainRules = read("project-rules/rules/domain_rules.md");
  assert.ok(domainRules.includes("DEC-002"), "domain_rules.md deve citar DEC-002");
  for (const prFile of fs.readdirSync(path.join(FIXTURE, "project-rules"), { recursive: true }).filter((f) => String(f).endsWith(".md"))) {
    const content = fs.readFileSync(path.join(FIXTURE, "project-rules", String(prFile)), "utf8");
    assert.ok(!content.includes("20 consultas por mês"), `project-rules/${prFile} repete o valor da decisão`);
  }
  // o AGENTS.md não carrega regra de domínio nem decisão (CN8)
  assert.ok(!/^###\s+DEC-/m.test(read("AGENTS.md")), "AGENTS.md com cláusula DEC embutida");
});

test("AC-4.3.1/CN1: guide e brainstorm foram movidos para .app-work/ sem reescrita (bytes idênticos)", () => {
  const origem = path.join(import.meta.dirname, "fixtures", "repo-desorganizado");
  const moved = [
    ["docs/brainstorming/tema-x.md", ".app-work/brainstorming/tema-x.md"],
    [
      "docs/guides/XPTO_GUIDE/GUIDE.md",
      ".app-work/archive/guides/2026-08/semana-2/XPTO_GUIDE/GUIDE.md",
    ],
    ["docs/archive/clones-oss/analise-argus.md", ".app-work/references/analise-argus.md"],
  ];
  for (const [src, dest] of moved) {
    const original = fs.readFileSync(path.join(origem, src));
    const relocated = fs.readFileSync(path.join(FIXTURE, dest));
    assert.deepEqual(relocated, original, `${dest} deve ser cópia byte a byte de ${src}`);
  }
});

test("AC-4.3.1/CN1: proveniência da captura no cabeçalho do staging-manifest", () => {
  const manifest = JSON.parse(read(".hephaestus/staging-manifest.json"));
  assert.ok(manifest._provenance, "staging-manifest sem proveniência");
  assert.equal(manifest._provenance.fixture, "scripts/__tests__/fixtures/repo-desorganizado");
  assert.ok(manifest._provenance.capturedAt, "sem data de captura");
  assert.ok(manifest._provenance.command, "sem comando de captura");
  assert.ok(Array.isArray(manifest.artifacts) && manifest.artifacts.length > 0);
});

test("AC-4.3.2/CN1: INDEX.md lista exatamente os domínios existentes e Por feature derivado de Afeta", () => {
  const index = read("_app-vault/INDEX.md");
  // domínios == arquivos de docs/decisions/
  const decisionsDir = path.join(FIXTURE, "_app-vault", "docs", "decisions");
  const domains = fs.readdirSync(decisionsDir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort();
  assert.deepEqual(domains, ["ideias", "produto"]);
  for (const domain of domains) {
    assert.ok(index.includes(`docs/decisions/${domain}.md`), `INDEX sem ponteiro para ${domain}`);
  }
  // Por feature consistente com TODOS os campos Afeta:
  const afetaMap = new Map();
  for (const domain of domains) {
    const parsed = parseDecisionFile(read(`_app-vault/docs/decisions/${domain}.md`));
    afetaMap.set(domain, parsed.afeta);
  }
  const expectedLines = [];
  const features = [...new Set([...afetaMap.values()].flat())].sort();
  for (const feature of features) {
    const domainsWith = [...afetaMap.entries()].filter(([, a]) => a.includes(feature)).map(([d]) => d);
    expectedLines.push(`- ${feature} → ${domainsWith.join(", ")}`);
  }
  for (const line of expectedLines) {
    assert.ok(index.includes(line), `INDEX deve conter "${line}" (derivado de Afeta)`);
  }
  // ideias não tem Afeta → não aparece no índice reverso
  assert.ok(!/^-\s*ideias\s*→/m.test(index), "ideias sem Afeta não pode aparecer em Por feature");
  // features válidas declaradas acima de ## Por feature
  const porFeatureIndex = index.indexOf("## Por feature");
  const validFeaturesIndex = index.indexOf("## Features válidas");
  assert.ok(validFeaturesIndex > -1 && validFeaturesIndex < porFeatureIndex);
});

test("AC-4.3.3/CN1: scaffold sem pasta fora da lista fechada de SCHEMA.md §2 e .app-work/.gitignore presente", () => {
  // lista fechada = filhos diretos de .app-work e _app-vault — nesting sob
  // archive/guides/ (espelho) é conteúdo, não pasta nova da lista (DEC-002)
  const allowedTopLevel = {
    "_app-vault": new Set(["docs", "specs"]),
    "_app-vault/docs": new Set(["decisions", "TEMPLATES"]),
    ".app-work": new Set([
      "guides", "brainstorming", "prd", "references", "private", "issues", "archive",
    ]),
  };
  for (const [relDir, allowed] of Object.entries(allowedTopLevel)) {
    const abs = path.join(FIXTURE, relDir);
    if (!fs.existsSync(abs)) continue;
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      assert.ok(
        allowed.has(entry.name),
        `${relDir}/${entry.name} fora da lista fechada de SCHEMA.md §2`,
      );
    }
  }
  // .app-work/.gitignore versionado mesmo com conteúdo mínimo
  const gitignore = read(".app-work/.gitignore");
  assert.ok(gitignore.includes("references/"), gitignore);
  assert.ok(gitignore.includes("private/"), gitignore);
});

test("AC-4.3.x/CN1: replay do pipeline sobre cópia do fixture reproduz os territórios byte a byte", () => {
  const copy = copyFixture("repo-desorganizado");
  const { files, composed } = runAdoptPipeline(copy, { now: NOW });
  const compared = [
    "AGENTS.md",
    "project-rules/index/README.md",
    "project-rules/rules/domain_rules.md",
    "project-rules/rules/architecture_rules.md",
    "project-rules/reference/snippet.md",
    "project-rules/reference/notas.md",
    "project-rules/contracts/openapi.yaml",
    "_app-vault/INDEX.md",
    "_app-vault/docs/decisions/produto.md",
    "_app-vault/docs/decisions/ideias.md",
    ".app-work/.gitignore",
    ".app-work/references/analise-argus.md",
    ".app-work/brainstorming/tema-x.md",
    ".app-work/archive/guides/2026-08/semana-2/XPTO_GUIDE/GUIDE.md",
  ];
  for (const rel of compared) {
    assert.equal(files.get(rel), read(rel), `replay divergiu em ${rel}`);
  }
  assert.ok(composed.includes(".hephaestus/staging-manifest.json") === false, "staging-manifest não entra na lista que descreve");
});
