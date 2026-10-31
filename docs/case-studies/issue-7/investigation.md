# Timeline and root-cause investigation

All times UTC. [Full run history](data/run-history.tsv) was fetched with pagination;
logs use their original line numbering. The [issue](data/issue.json) was opened
30 October 2026 at 20:03:51 and updated at 21:17:55. That update can follow an
event without proving the reporter observed a later deployment.

| Event                   | Evidence and meaning                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 30 Oct, earlier PRs 2/4 | Implemented browser speech and mobile/local chat; original research compares 20 engine families. Root README linked a source-hosted branch demo, while Pages remained attached to the inherited universal app workflow.                                                                                                  |
| 30 Oct 20:03:51         | Issue 7 requests Whisper Flow, missing options, Wispr-quality plan and a medical main page.                                                                                                                                                                                                                              |
| 30 Oct 21:07:11         | Main at `16a73c80fb7e5a6e56c4b79d43fe206b6e3fa490` starts six workflows after PR 6 merge.                                                                                                                                                                                                                                |
| 30 Oct 21:07:19         | [Main Checks and release](https://github.com/konard/medical-speech-to-text/actions/runs/41128568954) fails release credential preflight. The native/browser acceptance job still executes.                                                                                                                               |
| 30 Oct 21:08:45         | [Main Example app](https://github.com/konard/medical-speech-to-text/actions/runs/41128568901) reports the Pages environment URL; the workflow succeeds. A working deployment can still contain the wrong application.                                                                                                    |
| 31 Oct 22:24:20–21      | Initial PR head `931f9f8d7fe12416e937fffb14bc2e6a710ecb83` starts Security and Checks/release. Both subsequently pass. These are after the prepared commit, not evidence that main publication is fixed.                                                                                                                 |
| 31 Oct 22:27:00         | Fresh real browser at the public URL returns title `Universal Example App`, arithmetic inputs and results 5/6; no page errors. Before screenshots and [page observation](data/before-page.json) capture the defect.                                                                                                      |
| Investigation batch     | Three native regression assertions fail before workflow changes; built-subpath browser acceptance passes after them. [Validation](verification.md) records final candidate results.                                                                                                                                      |
| 31 Oct 22:49:59         | Exact source candidate `ea14d3c1df34857a0e3471dbcf1933794d5f2699` starts all five applicable PR workflows; every workflow subsequently succeeds, including all nine runtime/platform combinations and real speech/chat models against the built Pages artifact. [Complete evidence](data/validation-ea14d3c/index.json). |
| 31 Oct, evidence batch  | Archive every candidate workflow log, local check receipt, real-model export and screenshot; refresh all issue/PR feedback channels. No additional comments or required sub-issues were present. Main remains an ancestor of the PR.                                                                                     |

## Pages serves the wrong product

The previous `web-build` ran `npm run example:web:build` and supplied
`examples/universal-app/dist` to the `github-pages` artifact. No speech-lab path
trigger existed. Fixing README URLs could not alter that artifact. The Pages API
[response](data/pages-before.json) says `build_type=workflow`, HTTPS enforced.
The successful deployment log is
[data/main-pages-41128568901.txt](data/main-pages-41128568901.txt), with the public
URL at line 2006. The environment's
[branch policy](data/pages-branch-policies.json) admits `main` only. No disabled
site, missing Pages source setting or need for npm publication was found.

Fix: keep the universal web artifact, add a strict speech-lab production build,
serve that artifact under `/medical-speech-to-text/`, test actual sample loading,
worker import, word seeking, local-chat navigation and small-screen overflow,
then execute the unchanged real speech/chat acceptance against that same build.
Only the speech build becomes the Pages artifact. Both trigger lists include
speech files and the contract tests. Deploy retains main-only trust, Pages
permissions, artifact transport integrity and shared writer serialization.

The tests matter because Vite dev success alone does not establish deployed
subpath success: wrong root URLs, sample paths or worker bundles can fail only
after building. Source and built versions are both checked. `PAGES_DEBUG=1` logs
static request paths/byte counts; browser errors and exact observed URLs are
captured without logging patient data.

## Main CI publication failure is independent

[data/main-release-41128568954.txt](data/main-release-41128568954.txt), lines
153–159, records missing `NPM_TOKEN`, an unpublished
`@link-foundation/example-package-name`, and the exact bootstrap/trusted-publisher
action required. Strict preflight correctly refuses the write. The source SHA
matches main, not the subsequent PR commit. Existing report-mode PR checks can
pass without credentials; that is intentionally not proof of main readiness.

Publishing the website needs no npm package. Its workflow already succeeds
independently, so the correct site can deploy once this change reaches the
permitted branch. We do not select an npm identity or publish under a scope
without evidence of ownership. Fixing that external configuration requires the
owner's intended identity, first-publication credential and publication
authorization. Until then Q06's main-CI requirement is blocked and unfinished.

## Research gaps and quality claims

The previous research focused on engines and clinical scribe products. It did
not inspect this similarly named Python streaming server or compare the native
capture/correction/insertion loop of dictation applications. That explains the
missing options without implying they outperform existing candidates.
[Alternatives](alternatives.md) supplies the missing evidence and
[service plan](service-plan.md) defines the paired experiment needed to judge
quality. Reported inter-partial timing is not end-to-end clinical latency.

A finite upstream source probe also confirms an independent admission defect:
`Queue()` is unlimited and `MAX_WINDOW_CHUNKS` applies only after dequeue.
[Observation](data/whisper-flow-queue-observation.json): 1024 accepted frames even
with a segment cap of 2; no model executes. The report includes reproduction,
workaround, byte-budget implementation suggestions and regression cases:
[upstream issue 64](https://github.com/dimastatz/whisper-flow/issues/64). The service
is not integrated here, so no vulnerable dependency or workaround-only runtime
was added. Source and model quality remain separately unverified.

## Evidence handling

Complete relevant logs are retained, including successful Pages and initial PR
runs to distinguish failure from stale reports. Large logs were inspected in
bounded line chunks with error/summary extraction; source originals retain line
numbers. Historical failures and their complete investigations remain under
`dev/log/issues/5/pulls/6` and the issue 3 case study. A new failure on the exact
candidate must be downloaded and combined with every other same-revision failure
before another push batch. [Sources](sources.md) describes immutable snapshots,
retrieval dates and checksums.
