# Failed main CI investigation

Collected **2026-10-30** before changing workflows. Main was
`edb7095699b99a8efbf99f54018609295d172628`. All three failing runs below were
created at **16:34:44 UTC**, after that commit, and have that same `headSha`.
[Run inventory](data/main-runs.json) and [numbered error excerpts](data/main-failure-excerpts.txt)
are preserved. Complete downloaded logs remain in ignored `ci-logs/` (2,135,
5,423 and 20,129 lines); only focused chunks were read at a time.

| Workflow / run                                                                                               | Actual error                                                                                                                                                                                        | Resolution / evidence                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Example App, 41091166960](https://github.com/konard/medical-speech-to-text/actions/runs/41091166960)        | `example-app-41091166960.log:701–702`: preview image writer invokes `gh auth setup-git` in the pinned Playwright container; `gh: command not found`, exit 127. Screenshots had already generated.   | Install the CLI inside that container before dependencies/regeneration/authentication; verify `gh --version`. Red-first regression `tests/speech-ci-regression.test.js` checks that prerequisite order. Shared writer queue, cancellation protection, default-branch reconciliation and protected-branch diagnostics retained. The main-only write path is not executed/published from this PR. |
| [Security, 41091167226](https://github.com/konard/medical-speech-to-text/actions/runs/41091167226)           | `security-41091167226.log:5189–5191`: dependency diff API 403, graph disabled; strict main prerequisite exits 1. Both CodeQL languages and dependency audits succeeded.                             | **Resolved repository setting:** enabled dependency graph and alerts through the documented vulnerability-alerts REST endpoint (HTTP 204), then verified the same-commit comparison returned HTTP 200 / `[]`. The existing strict prerequisite now passes; failed main security jobs were rerun.                                                                                                |
| [Checks and release, 41091167136](https://github.com/konard/medical-speech-to-text/actions/runs/41091167136) | `release-41091167136.log:152–160`: template package `@link-foundation/example-package-name` does not exist on npm and `NPM_TOKEN` is absent. Bootstrap/trusted-publisher preflight refuses release. | **Unfinished npm/account setup:** select an owned package identity, reconcile template metadata, supply a scoped first-publish credential, then configure the repository/workflow trusted publisher. No token or npm namespace ownership is available in this task. PR report mode passes with diagnostics; main release mode remains strict. No merge/publish is attempted.                    |

The same main revision's Workflows validation and Broken Links runs succeeded.
The administrator-capable token could resolve the graph prerequisite without an
authenticated browser: `PUT /repos/{owner}/{repo}/vulnerability-alerts` enables
both dependency alerts and the graph. This is a repository-scoped security
setting; it does not turn on automatic dependency-update pull requests. The
[first probe, activation and successful comparison](data/dependency-graph-enablement.json)
are preserved. See GitHub's [endpoint contract](https://docs.github.com/en/rest/repos/repos#enable-vulnerability-alerts).
Passing PR checks still cannot establish that the remaining npm configuration
failure is fixed.
Npm credentials/ownership cannot be inferred from repository administration.
The provided access does not authorize fabricating registry credentials or
publishing the template package under someone else's namespace.

## Reproduce and verify

```sh
gh run list --repo konard/medical-speech-to-text --branch main --limit 20 \
  --json databaseId,workflowName,conclusion,createdAt,headSha
gh run view 41091166960 --repo konard/medical-speech-to-text --log > ci-logs/example-app-41091166960.log
gh run view 41091167226 --repo konard/medical-speech-to-text --log > ci-logs/security-41091167226.log
gh run view 41091167136 --repo konard/medical-speech-to-text --log > ci-logs/release-41091167136.log
node --test tests/speech-ci-regression.test.js
```

Before the workflow edit, the regression failed because CLI installation was
absent (index `-1`). After the edit, installation precedes authentication. Existing
workflow contract tests and action validation still check trust, permissions and
serialized writers. The native test suite also covers PR-vs-main graph and release
preflight behavior; no acceptance assertion was weakened to hide setup failures.

After the single coordinated push, collect every workflow on the exact candidate
SHA, compare timestamps, wait for all jobs, and download every non-passing run
before preparing another batch. Cross-platform/runtime and main-only operations
cannot be inferred from one local Linux run. Merge, publication, repository
secrets and production deployment remain separately controlled actions.
