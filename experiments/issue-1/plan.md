# Issue 1 execution plan

Objective: address every requirement of issue #1 in PR #2 on
`issue-1-362226f4199c`; leave the PR unmerged. Coordinator alone pushes.

1. [x] Read AGENTS.md, CONTRIBUTING.md, javascript-first.md, complete issue,
       all issue/PR conversation, inline comments and reviews; inspect sub-issues.
       No comments or required sub-issues existed on 2026-10-30.
2. [x] Inspect branch, baseline CI SHA/times, template behavior and recent related
       medical-neural-network-ml work. Fetch latest main before final comparison.
3. [x] Capture original issue and referenced research sources under the case study;
       inventory each prose requirement with files, acceptance evidence and limits.
4. [x] Research official current sources for 20 industry solutions, AU hosting,
       latency, browser models, datasets, preprocessing, microphones and lifecycle.
5. [x] Write a complete dataset-driven research and implementation plan, with
       measurable stages through fine-tuning and training from scratch. Distinguish
       official claims, proposed thresholds and observed results; no invented ranks.
6. [x] Write failing native JavaScript acceptance tests for metrics, dataset import,
       word timing, batch behavior and command refusals before implementation.
7. [x] Implement a static browser demo: local model inference, roughly ten audio
       files, optional references, actual transcripts, WER/CER, timed playback and
       result export. No audio upload or CRM writes. Preserve inherited APIs.
8. [x] Validate in a real browser; record model/revision, actual ASR observations,
       screenshots and network/privacy behavior. Bound inference and memory.
9. [ ] Prepare online demo with an appropriate explicit deployment path; verify
       the actual published URL or record any exact external blocker as unfinished.
10. [x] Add changeset and automated PR checks; native JS first. No production Rust
        added; any future port needs strict inventory, native fixtures and gate.
11. [ ] Run full required local checks, all tests, docs/line/secrets checks on exact
        candidate revision. Save large logs; read files in <=1500-line chunks.
12. [ ] Review whole diff and acceptance mapping, commit useful atomic steps,
        push one validated batch exclusively to the prepared branch.
13. [ ] List fresh CI runs with timestamps/SHA, wait for every same-revision run;
        download all failed logs under ci-logs, identify exact errors before next batch.
14. [ ] Update PR title/body with scope, reproduction, tests, screenshots,
        limitations, demo link and `Fixes #1`; review gh pr diff, clean git status,
        mark ready after verification; no merge/release without authorization.

Resource policy: no Rust needed for this JS-first work. Run expensive tasks
sequentially, no unbounded probes, no deletions of user dependencies/caches.
Research probes/scripts belong in experiments; reusable examples in examples.

Observed: ten actual tiny clips (27.9% WER, 17.7% CER), real unreferenced base
output, playback/seek tests, desktop/mobile screenshots; Node 1041 pass, Bun 1041
pass, Deno 1040 pass + one inherited bin-symlink skip. Root check, secret scan,
workflow policy and browser build pass. Exact committed candidate is checked
again before the coordinator pushes. Paid cloud/clinical work is a planned stage.

Pre-push browser rerun exposed polling that missed a 300 ms active-word span.
The playback test now observes actual DOM transitions during playback, asserts
both words in order and still verifies seeking, gaps and clearing at audio end.
The failure log is preserved in ignored ci-logs; repeated runs verify the change.
An intervening HTML edit reset a Vite inference run through live reload; that run
was interrupted, diagnosed and repeated without editing served files. Model tests
now log browser status and fail promptly on a completed but unsuccessful batch.
