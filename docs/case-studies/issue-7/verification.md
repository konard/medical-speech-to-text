# Verification and deployment status

The reproduction test failed on the old workflow before implementation:
[data/pages-regression-before.txt](data/pages-regression-before.txt).
It checks the published application, retained universal artifact, production
subpath/real-model verification and both change triggers.

The deterministic browser test runs the actual Vite production bundle under
`/medical-speech-to-text/` and mocks only inference. It loads/hashes all ten real
sample files, checks ten result cards, word seeking/highlighting, chat navigation,
320/390/1440px layouts and same-origin failures. The separate existing real-model
suite executes actual tiny/base and local chat, offline follow-up and cache
removal; its assertions are unchanged and the Pages build now runs it before
uploading the production artifact. Source-browser tests remain in their existing
workflow as well.

[Before observation](data/before-page.json) is the live public site;
[after observation](data/after-page.json) and screenshots are the locally served
candidate production bundle. No physical phone or full native app was tested.
The queue experiment uses a 256 MiB limit and 1024 finite frames, with no model
execution; its adapter and limits are documented in the requirement inventory.

Before the final candidate, native tests passed on Node 26 (1083), Bun (1083)
and Deno (1082, one explicit network skip). The bounded browser suite passed
10 tests, with the two existing real-model tests and the external-URL-only Pages
test explicitly gated; built Pages acceptance passed separately.

An initial Node 24 validation launcher used `npm exec --package=node@24`, which
propagated `npm_config_package=node@24.22.2` to nested `npx` calls. Three release
fixture tests then failed by trying to install Node inside their offline fixture.
[Calibration receipts](data/local-runner-calibration/results.json) and complete
Node/Bun/Deno logs preserve this tooling failure. The corrected launcher places
the installed Node 24 binary directly on PATH; it requires no source workaround.
The 2.92 GiB container cannot safely validate the full speech/chat model set;
those acceptance assertions remain enforced on the adequately provisioned
hosted runner rather than reduced locally.

## Verified source candidate

Revision `ea14d3c1df34857a0e3471dbcf1933794d5f2699` passed all 23 local checks
using Node 24.22.2: Node and Bun each passed 1083 tests; Deno passed 1082 with
one explicit network skip. Lint/format/duplication, syntax, file limits,
documentation, version/changeset guards, workflow/status policy, actionlint,
shellcheck, both zizmor modes, secret scan, high-severity dependency audit,
both web builds and the bounded queue probe passed. Source browser acceptance
passed 10 tests with 3 explicit gated tests; built Pages acceptance passed
separately. The isolated offline release-versioning dry run passed too.
[Local commands, results and complete logs](data/validation-ea14d3c/local/results.json)
are preserved with [checksums](data/validation-ea14d3c/index.json).
The audit reports seven existing moderate vulnerabilities; passing its
high-severity threshold does not mean the dependency tree has no advisories.

All five workflows started at 31 October 2026 22:49:59 UTC on that exact SHA
and completed successfully:

| Workflow            | Complete run                                                                             | Raw log                                               |
| ------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Checks and release  | [41249916726](https://github.com/konard/medical-speech-to-text/actions/runs/41249916726) | [log](data/validation-ea14d3c/hosted/41249916726.txt) |
| Example app         | [41249916757](https://github.com/konard/medical-speech-to-text/actions/runs/41249916757) | [log](data/validation-ea14d3c/hosted/41249916757.txt) |
| Security            | [41249916752](https://github.com/konard/medical-speech-to-text/actions/runs/41249916752) | [log](data/validation-ea14d3c/hosted/41249916752.txt) |
| Workflows           | [41249916759](https://github.com/konard/medical-speech-to-text/actions/runs/41249916759) | [log](data/validation-ea14d3c/hosted/41249916759.txt) |
| Broken Link Checker | [41249916710](https://github.com/konard/medical-speech-to-text/actions/runs/41249916710) | [log](data/validation-ea14d3c/hosted/41249916710.txt) |

The runtime matrix passed Node/Bun/Deno on Linux, Windows and macOS. Desktop
packaging passed on all three platforms. Android/iOS, PR preview and main-only
publication/deployment retain their existing conditional gates; a skipped gate
does not verify those delivery paths. All same-revision runs were collected
before the evidence batch; there were no failed workflows to repair.

The production-subpath browser test passed in the hosted web job (Example app
log line 2055), followed by both unchanged real-model tests (line 2335).
[Speech exports](data/validation-ea14d3c/hosted/model-evidence/browser-results.json)
contain ten completed tiny-model samples; the
[base-model check](data/validation-ea14d3c/hosted/model-evidence/browser-base-result.json)
also completed with an absent reference left unscored. The aggregate displayed
WER was 28.6% on this small demonstration corpus. This is smoke-test evidence,
not a clinical evaluation or evidence of superiority to Wispr Flow.
[Chat evidence](data/validation-ea14d3c/hosted/model-evidence/chat-results.json)
records actual local generation, a warm offline follow-up and cache deletion;
the warm follow-up took about 2.4 seconds with 1233 ms to first text. These
observations do not meet or establish the proposed subsecond service target.

Hosted [speech](data/validation-ea14d3c/hosted/model-evidence/result.png) and
[mobile chat](data/validation-ea14d3c/hosted/model-evidence/chat.png) screenshots
show the actual model runs. Network/model revisions, timings, device/runtime
metadata and browser errors are retained in the same evidence directory.
The final feedback refresh found no issue comments, required sub-issues,
PR conversation comments, inline comments or reviews; the paginated responses
are archived alongside these results.

## Unfinished external criteria

The Pages environment permits only `main`, as shown in
[data/pages-branch-policies.json](data/pages-branch-policies.json). This PR is
unmerged; merge is a separately authorized action. Until the candidate is
integrated and deployed through that policy, the live medical URL is not fixed.
No protection was weakened to deploy PR code. Q04/Q05 remain unfinished for the
public endpoint, despite a working and tested production artifact.

Main's separate npm release preflight is still blocked by an unpublished
placeholder package and no bootstrap credential. Q06's main-CI requirement
remains unfinished. The explicit main-branch error is retained. Fresh
[secret metadata](data/current-secret-metadata.json) contains no configured
Actions secrets, and the [current registry response](data/npm-registry-current.json)
is HTTP 404, independently confirming the unresolved configuration. An authorized
owner must select/confirm the intended npm identity, establish publish rights
and first-publication credentials, authorize publication, then configure the
trusted publisher. PR report-mode success and a successful Pages deployment
cannot establish that readiness.
