# Issue 5 / pull request 6 evidence

Read [audit.md](audit.md) for the complete requirement inventory, root causes,
alternatives, implementation decisions, template comparison and external blockers.
Read [plan.md](plan.md) for the execution checklist.

- `sources/` preserves issue/PR/API snapshots, exact run timestamps and SHAs,
  the referenced best-practices document, complete template trees, SHA-256
  comparisons, registry dependency metadata and upstream report URLs.
- `ci-logs/` preserves baseline workflow output and line-numbered warning/error
  indexes, including the older preview-container failure already fixed on main.
- `validation/` preserves before/after reproductions, full native runtime suites,
  dependency installation, actual archive compatibility, build and policy checks.
- `upstream-*-report.md` contains the exact issue bodies sent under issue 5's
  explicit instruction to report shared defects in both templates.

Raw `.log` files are ignored by the repository. Their committed `.log.gz` copies
preserve exact bytes; decompress a copy with `gzip -dc FILE.log.gz > /tmp/FILE.log`
before reading the cited line numbers. Large logs should be read in chunks of at
most 1500 lines. Template `.tar.gz` snapshots contain the entire immutable source
tree, without `.git` or installed dependencies. Initial comparison TSVs describe
the baseline; `*-complete-comparison.tsv` describes the entire candidate union.

Reproduction commands live in `experiments/issue-5-*.mjs`. They use bounded
temporary fixtures and clean only directories they created. The artifact probe
requires the action's locked dependencies; the desktop API probe requires the
universal example's locked dependencies. Native JS tests and strict readiness
checks run before Rust validation. No publication, deployment or merge is part
of this investigation.

The main release failure remains blocked on maintainer npm identity/bootstrap
configuration. Archive, desktop and Pages warnings have tested native solutions.
Successful PR checks do not resolve the release criterion. See the audit's
validation ledger for the exact tested revisions and hosted results.

The final source revision is `479121fe5c62968914ad227190619a6eee4439bf`.
Its 37 exact-revision local checks are indexed in
`validation/final-479121f-results.json`; their full output is in
`validation/final-479121f.tar.gz`. All six complete hosted workflow logs and API
snapshots are in `ci-logs/batch3-479121f.tar.gz`, with human-readable run URLs,
timings and the remaining warning in `ci-logs/batch3-result-index.txt`.
Extract either final archive into an owned temporary directory before reading
its logs. Both archives contain relative regular-file paths only.
