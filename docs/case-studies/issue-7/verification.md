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
Final clean-environment local and hosted results will follow candidate validation.
The 2.92 GiB container cannot safely validate the full speech/chat model set;
those acceptance assertions remain enforced on the adequately provisioned
hosted runner rather than reduced locally.

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
