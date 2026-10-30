# Issue 5 / PR 6: CI audit and requirement inventory

This investigation concerns [issue 5](https://github.com/konard/medical-speech-to-text/issues/5)
and [PR 6](https://github.com/konard/medical-speech-to-text/pull/6).
It is **not a completed release repair**: initial npm publication requires a
maintainer credential, and three desktop dependency deprecations remain upstream.
The PR must remain unmerged while these acceptance criteria are unfinished.

## Scope and immutable inputs

- Initial PR head: `7df9a644b45e236e8495f9fa7cd5e65a6ff55bb8`.
- Main at start: `d7ecf1e501de152b0b7829395dcc7458590ea4db`, already an ancestor.
- JavaScript template: `16225e7f26006333bdb107cddb6d5d3e54b93723` (508 tracked files).
- Python template: `34fce74893c36d4e8b40a89e2e2f3ae9b8e5e9ae` (144 tracked files).
- Complete issue body, all issue/PR conversation comments, inline comments,
  reviews, sub-issue list and workflow inventory are in `sources/`. All comment
  lists and the sub-issue list were empty. No additional product feature or
  requested sub-issue is hidden behind a successful CI result.
- Full referenced best-practices document is preserved in
  `sources/CI-CD-BEST-PRACTICES.md`. Research date: 2026-10-30 UTC.

`experiments/issue-5-template-audit.mjs` compares the complete **union** of tracked
paths and SHA-256 content, including local-only files. Its two
`sources/*-complete-comparison.tsv` files give a disposition for every path.
Development-log evidence is excluded from this self-referential inventory only.
Earlier `*-file-comparison.tsv` files preserve the pre-fix comparison. Generated
dependencies/build outputs are outside Git and are not mistaken for source.

## Every requirement, alternatives, plan and evidence

| Requirement from issue/instructions | Alternatives considered and chosen plan | Implementation and verification | State |
| --- | --- | --- | --- |
| Investigate every failing workflow with current timestamps and SHA | Trust issue snapshot vs query current runs; query both branches and workflow inventory, preserve older failures separately | `initial-main-runs.json`, `initial-branch-runs.json`, full baseline logs and annotation indexes; initial PR runs passed but do not supersede main's release failure | Audited |
| Fix all errors, including the release failure | Weaken preflight, rename the public package speculatively, or verify credentials honestly; retain strict preflight and document precise bootstrap action | Main log lines 158–160 names nonexistent package and absent NPM_TOKEN; empty `secret-names.json`; existing preflight refusal/report-mode tests | **Blocked: maintainer npm identity/bootstrap** |
| Check false positives and false negatives across the whole codebase | Only repair the visible red job vs exercise gate refusal paths; add minimal failing fixtures first | New regression test rejects invalid `.js`, nested `.cjs/.mjs`, empty inventory; positive nested shipped-file fixture; CodeQL now includes examples | Implemented |
| Fix warnings without concealing failures | Blanket warning suppression vs reviewed policies and compatible dependencies; choose explicit policies, real archive probes and strict deprecation errors | All four npm roots checked for install-script decisions; esbuild/fsevents/Electron approvals pinned; optional PTY denied; artifact glob/reader replaced | Implemented; hosted revalidation pending |
| Remove every desktop dependency warning | Upgrade released components, force incompatible majors, or adapt the narrow used API; validate ASAR 4 and a scoped native cleanup adapter | ASAR 4.3.1 plus temp-only fs.rm adapter; before/after deprecation tests, real builder/temp API probe, local Linux package and three-platform hosted probe | Implemented; hosted revalidation pending |
| Compare all files to both recommended templates | Copy unrelated Python application/release files vs compare all paths and map capabilities; use content hashes and functional mapping | Complete union TSVs; mapping below covers every workflow/script family and relevant supporting configuration | Audited; applicable archive roundtrip adopted |
| Follow every referenced CI/CD best practice | Copy examples blindly vs verify all 17 principles against local behavior | Seventeen-row checklist below; existing acceptance assertions retained, additional coverage strengthens them | Audited |
| Report the same defects in upstream templates | File duplicates vs search existing open issues first; no open matching issue found, report with reproductions | JavaScript [issue 275](https://github.com/link-foundation/js-ai-driven-development-pipeline-template/issues/275); Python [issue 128](https://github.com/link-foundation/python-ai-driven-development-pipeline-template/issues/128); exact bodies preserved here | Reported; upstream issue is not local completion |
| Research existing components/libraries online | Custom parsers/scanners vs maintained components; retain official SDK, actionlint, ShellCheck, zizmor, CodeQL, npm audit, Changesets | Source links and version/API decisions below; actual ZIP tests supplement mocks | Audited and tested |
| Preserve behavior, assertions and JavaScript-first readiness | Treat source roundtrip as execution parity vs preserve independent native fixtures and strict refusal inventory | Existing mixed-language gate and generated source unchanged; native suite, strict parity and regeneration checks precede any Rust check | Preserved |
| One PR, single coordinator, exact candidate checks, one push per batch | Incremental overlapping worker pushes vs bulk staged batches; single coordinator, no delegated pushes | Changeset, whole-diff review, local validation and same-revision hosted check ledger; no merge/release/deploy authorized | In progress |
| Collect all analysis/data in the requested directory | Ephemeral console-only evidence vs saved source snapshots, logs, reproductions and reports | This directory, its plan, sources, validation logs and baseline CI logs | Collected; final CI ledger to follow |

## Baseline timeline and actual root causes

The issue lists c96be36's runs at 18:47:40 UTC. The current default tip d7ecf1e
contains a later preview-image regeneration; it did not rerun every path-filtered
workflow. Initial PR head 7df9a64 has successful Checks/Security runs created at
19:13:02 UTC. A PR report-mode preflight success is expected and does **not**
prove that a default-branch release can publish.

- Checks/release run **41109921839**: `baseline-checks-41109921839.log`, lines
  **158–160**, npm OIDC exchange and package lookup return 404 for
  `@link-foundation/example-package-name`, with no bootstrap token. The terminal
  gate correctly fails on `release-preflight`. No code-only assertion can prove
  ownership of that npm scope or create a secret value that is not supplied.
- Earlier run **41091167136** has the same refusal (lines 158–160). It is not
  a new test failure or a reason to relax the gate.
- Earlier Example app **41091166960** failed in preview regeneration:
  `previous-example-app-41091166960.log:701`, `gh: command not found` inside the
  Playwright container. Main's c96be36 already installs GitHub CLI before use;
  run **41109921804** verifies the fix. Existing `speech-ci-regression.test.js`
  preserves that ordering. We retained this fix rather than reintroducing the
  upstream template's container behavior.
- Root install warnings identify optional `node-pty@1.1.0`; speech-lab identifies
  `esbuild@0.25.12`. Native process execution never invokes the optional PTY API.
  A deny decision preserves current behavior; binary dependencies actually used
  by Vite and the platform installers get exact-version approvals. Clean local
  root/speech installs now report no unreviewed scripts.
- Artifact installs warn about deprecated `glob@10.5.0`. The SDK's reader also
  uses `new Buffer` (`artifact-deprecation-reproduction.log`, stack points to
  `unzip-stream/lib/unzip-stream.js:47`). Scoped glob 13.0.6 preserves the used sync API. The first candidate used an
  unzipper alias and passed archive assertions, but Dependency Review exposed
  four low Scorecard dependencies (candidate security log lines 5903–5906).
  The revised adapter uses the official SDK raw-download API and zip.js 2.24.0,
  which has no runtime dependencies and a recorded Scorecard of 3.9. The native
  ZIP64 probe verifies binary/empty/nested/Unicode/dot-prefixed files, CRC errors,
  both traversal spellings, symlink refusal and cleanup. Hosted CI additionally
  verifies real SDK transfer and Pages layout. The threshold remains unchanged.
- Pages used a DEP0040 filter for deploy-pages v5's bundled deprecated punycode
  import. The actual immutable upstream bundle reproduces the failure under
  Node's normal runtime deprecation enforcement. A process-scoped module
  resolution adapter now supplies userland punycode 2.3.1 (recorded Scorecard 3.2).
  Conversion/error fixtures and the unchanged upstream bundle verify the API,
  clean startup and OIDC refusal. The child receives no credentials or OIDC
  endpoint; this is not a deployment. Other warnings remain visible, and normal
  runtime deprecations fail the real action. The old suppression is removed.
- Speech-lab's production build warned that `config.js` was imported both
  statically and dynamically. A strict Vite logger reproduced the warning as a
  failing automated build before the fix (`speech-warning-reproduction.log`).
  Its inert configuration now uses a consistent static import; `npm run build`
  passes and permanently rejects future build warnings. Cache behavior is
  preserved by the existing native and browser acceptance tests.
- Desktop baseline installs report glob 7.2.3, inflight 1.0.6 and rimraf 2.6.3.
  Blind glob/rimraf major overrides break callback contracts; the bounded API
  experiment preserves that evidence. A failing zero-deprecation test first
  reproduced all three warnings (`desktop-warning-reproduction.log`). The
  solution upgrades ASAR itself to released 4.3.1 and supplies a native fs.rm
  adapter only for temp 0.9.4's four cleanup calls. Node 24 is already required
  for development tooling and supports the CommonJS/ESM boundary. The native
  consumer probe exercises actual builder archive creation, packed/unpacked
  reads and metadata, electron-winstaller loading and temp async/sync cleanup.
  Literal-path, symlink and unsupported-option unit tests supplement it. Local
  Linux Electron packaging passes; the same consumer probe runs before all
  three platform packages. All four lockfiles now reject every deprecated
  dependency. Adapter contracts and unsupported options are explicit in
  `examples/universal-app/compat/README.md`; no warning is suppressed. Packaging
  also exposed missing author metadata; the example now attributes contributors.
- Windows Deno baseline emitted an intentional 70-second budget warning and
  succeeded at **75/100 seconds**, lines **18237–18249**. Logs show repeated
  Git/process fixtures at 0.7–2 seconds each, plus the bounded HTTP-429 fixture.
  This is genuine budget pressure on that OS, not an overrun hidden as success.
  The enforcing deadline, early warning and all acceptance cases are retained;
  increasing limits or suppressing the warning would not fix a defect.
- Other listed workflows had no failing jobs. The reusable JS-first job's log
  required `gh run view --job 124129652222`; the first whole-run log download was
  empty because the CLI does not expand that reusable job. Its native readiness
  evidence is now preserved in `baseline-javascript-first.log`.

### Exact remaining maintainer action

Choose the intended npm package identity and verify permission to its scope;
the current metadata is still the template package name. Supply a granular
`NPM_TOKEN` repository secret permitted to perform the first publication, then
authorize that publication separately. Configure trusted publishing on the
published npm package for repository `konard/medical-speech-to-text`, workflow
`release.yml`, and remove the bootstrap secret. Re-run main's strict preflight.
This PR neither creates a guessed credential nor publishes a package. See
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

## Full template comparison and capability mapping

The JavaScript baseline differs in only 18 of 508 upstream paths. Workflow
differences were local speech-lab gates/audits and the already-fixed preview CLI;
those are retained. Package/lock/ESLint differences serve speech-lab. README,
screenshots, historical issue-3 data and ignore-file differences are local
content. Existing CI scripts and actions otherwise match upstream byte for byte,
which is why the newly reproduced gaps are reported upstream as well.

Python's tree has 144 paths and a different product/release system. The TSVs
record every Python-only path and every local-only path, rather than treating
absence of identically named scripts as a missing capability.

| Template family / supporting paths | Local equivalent and decision |
| --- | --- |
| release.yml; change detection, fragment/version guards, release naming, metadata, registry smoke, credential probes | Existing `detect-code-changes.mjs`, PR guards, Changesets, naming/publish/smoke/preflight scripts and tests provide the same capabilities. Keep npm/JavaScript semantics; do not import PyPI/Twine or Python manifests into this JS product. |
| security.yml; CodeQL config/result checks, dependency graph and audit | Keep JS/Actions analysis, fail-closed SARIF checks, dependency graph prerequisite and all four npm audits. Adopt Python's shipped-example inclusion; its Ruff/mypy/pip-audit dependencies apply to Python products, not the historical data-preparation script. |
| workflows.yml; actionlint config, zizmor config, shell scripts, terminal gate | Keep pinned actionlint+ShellCheck, both zizmor passes and derived status-gate coverage. Add actual artifact/Pages roundtrip from Python's design and include it in terminal needs. Local exception for self-repository syntax remains file-scoped until pinned actionlint supports it. |
| artifact action, extraction, ncc bundle and licenses | Retain the official JS SDK credential context, retries, evidence checks and immutable IDs; exercise real archive APIs. Python's bundled action avoids runtime dependency installation but adds generated bundle/licensing maintenance; it is an alternative, not needed for API parity. Its validated Python extractor already avoids Buffer deprecation. Adopt scoped dependency overrides and report shared glob warning upstream. |
| links.yml, lychee config, archive lookup and transient rechecks | Existing local link checker, archived-link checks, bounded transient retries and required nonempty reports cover this family. Keep local placeholder/domain exclusions and diagnostics. |
| docs.yml, Sphinx configuration, docs/requirements.txt, preview regeneration | Local required-heading/doc validation and Example app workflow serve this repository's Markdown/web docs. Sphinx/PyPI docs would be an unrelated application. Keep preview screenshots and current permission/branch protections. |
| pre-commit config, Ruff config, pyproject, Python source/tests and changelog.d | Preserve Husky+lint-staged, ESLint+Prettier, package manifests and Changesets. Python package fixtures are template content rather than a required second package. Historical `prepare-demo-data.py` does not justify enabling Python release jobs. |
| shared budget, status, fresh-merge, dependency-graph and required-doc shell scripts | Compared differing implementations (saved shell diffs). Both preserve process-tree deadlines, fail-closed cancellation classification, bounded fetch retries and required headings. Local variants additionally have established JS fixtures and visible-skip policies; retain them. |
| all tests, examples, experiments, docs, assets, editor/ignore configs, release fragments | Per-path hash inventory records all. Preserve local APIs and examples, existing acceptance/refusal cases and historical evidence. Do not copy upstream history, package identity or foreign fragment/version files into this release. |

## Seventeen best-practice checks

| Principle | Evidence / disposition |
| --- | --- |
| 1 Relevant-file checks | Diff-aware detect-changes covers whole unverified ranges, PR base/head and API failure fallback; new archive probe is in Workflows path filters. |
| 2 File sizes | Existing fail-closed 1500-line tracked-file guard and ESLint max-lines retained. New files remain bounded. |
| 3 Formatting | Prettier, staged formatting, generated version dry-run and exact lockfiles retained. |
| 4 Static analysis | ESLint, recursive native syntax, CodeQL shipped examples, ShellCheck/actionlint/zizmor; no acceptance exclusion added. |
| 5 Fast failure | Existing fast gates precede nine OS/runtime legs; terminal status observes every job including archive regression. |
| 6 Changesets | Added one patch fragment; manual version bump guard remains. |
| 7 Actual merge result | Fresh-merge simulation preserved; current main is an ancestor. |
| 8 Pre-commit | Husky installed API and pinned lint-staged/ShellCheck hooks retained and run. |
| 9 Release automation | No automatic merge/release/deploy performed; strict credential and anonymous package smoke checks preserved. Bootstrap remains blocked. |
| 10 Concurrency | One coordinator push, per-check cancellation and shared writer queue remain; bounded rebase retry refuses repository policy errors. |
| 11 Secrets | Pinned secretlint runs before project install; no secret values collected, only empty secret-name inventory. |
| 12 Documentation | Required headings and broken-link jobs retained; evidence excluded from link rewriting as research data. |
| 13 Native architecture builds | amd64/arm64 native runner matrix, compatible GHA cache and manifest verification unchanged; no QEMU introduced. |
| 14 Workflow lint | Pinned actionlint with ShellCheck present and both zizmor personas tested; added job uses read-only permissions and bounded runtime. |
| 15 Lock audit | Four npm locks audited on PR/push and weekly schedule; deprecated packages remain separately visible rather than conflated with advisories. |
| 16 Publish preflight | PR report mode tests code without secrets; main fails explicitly on missing identity/bootstrap. No false green for zero verified credentials. |
| 17 External-state classification | Existing dependency warnings on push, explicit dispatch defaults, policy-refusal classification, log-evidence checks and cancellation provenance remain covered by tests. |

## Online research and available components

- [npm install-script review policy](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts/)
  supports version-scoped approvals and explicit denials; choose review over a
  blanket script override.
- [CodeQL configuration](https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options)
  explains that excluded interpreted-language paths are outside analysis. The
  examples exclusion was a coverage defect even while the workflow passed.
- [Official artifact SDK](https://github.com/actions/toolkit/blob/main/packages/artifact/README.md)
  supplies credentialed transfer, IDs and digest handling; retain it instead of
  inventing a transport. Registry snapshots establish latest dependency versions.
- [Archiver's glob issue](https://github.com/archiverjs/node-archiver/issues/822)
  and actual `archiver-utils/file.js` API support a narrow sync-API override.
- [zip.js](https://github.com/gildas-lormeau/zip.js) supplies ZIP64 and streamed
  extraction without runtime dependencies. The official SDK's
  [raw download implementation](https://github.com/actions/toolkit/blob/main/packages/artifact/src/internal/download/download-artifact.ts)
  retains authentication, transport and digest checks. Alternatives researched:
  unzipper fixed Buffer usage but added four low Scorecard packages; yauzl's
  recorded score was 2.8. The chosen reader's score was 3.9 at research time.
- [ASAR releases](https://github.com/electron/asar/releases) document the released
  major used by the actual builder probe. The narrow cleanup adapter uses
  [Node's removal APIs](https://nodejs.org/docs/latest-v24.x/api/fs.html#fsrmpath-options-callback)
  to preserve the consumer's callback/sync and retry contracts. A general rimraf
  API port is unnecessary and explicitly unsupported.
- [actionlint](https://github.com/rhysd/actionlint),
  [ShellCheck](https://github.com/koalaman/shellcheck),
  [zizmor](https://docs.zizmor.sh/), CodeQL, npm audit and Changesets already
  solve complementary workflow, shell, source, dependency and version checks.
  Reuse these components and preserve their pinned versions and refusal tests.

## Validation ledger

Baseline: 1055 Node tests passed, strict full-tree ESLint/Prettier/duplication
passed. New defect tests were run before implementation: nine failures proved
missing policy/syntax/security/archive coverage. The expanded focused group then
passed (28 tests); the first full run exposed three structural expectations
that needed strengthening for pinned approvals and the new fifth Workflows job.
No production assertion was removed. Final candidate checks and hosted run IDs
are recorded in the PR and validation logs after the complete batch is committed.

Local runtime results before candidate commit: Node and Bun 1069 passed each;
Deno 1068 passed and its documented npm-bin-symlink import limitation skipped.
Speech browser: ten
passed, two opt-in model cases skipped, including a build regression that
rejects mixed imports and preserves Vite CLI options. Warning enforcement lives
in Vite's configuration so the existing `vite build` CLI stays intact.
The real-model run was stopped at
3,014,524,928 bytes of container memory (limit 3,135,369,216) while downloading
Whisper, rather than risk exhausting the shared host. Hosted CI retains the
complete real-model assertions. Local Chrome was selected with the existing
`CHROME_PATH` option because the preinstalled Playwright browser version differed
from the package's pinned version. Node 26 emitted Playwright's module.register
deprecation; hosted CI uses the repository's documented Node 24.

### First hosted candidate and second batch

Candidate `c50a3fb4fa0a658e8d6bc24487797f0b67846ff5`, created 2026-10-30
19:46:21 UTC, passed all six workflows: Checks 41117962603, Example app
41117962638, Workflows 41117962687, Links 41117962607, JavaScript-first
41117962693 and Security 41117962630. Full logs and the annotation index are
preserved under `ci-logs/candidate-*`; API snapshots include timestamps and SHA.
The complete speech real-model acceptance tests passed on the hosted runner.

Successful workflow conclusions did not end the audit: the security log added
four low Scorecard warnings and the example retained desktop deprecations and
missing author metadata. These findings were collected together before the next
batch. The ZIP, desktop and Pages adapters above address them and the masked Pages warning. Only the npm
identity/bootstrap criterion remains externally blocked; the PR stays draft
until that requirement is resolved. Second-batch results will be recorded after
exact-revision validation and hosted execution. The intermediate revision
302572a passed Node/Bun (1076 each), Deno (1075 plus one documented skip),
lint/format/duplication, native archive/desktop probes, syntax, docs and version
guards. A local status-check invocation omitted its required workflow arguments;
that usage error is preserved and corrected in the final validation command.
