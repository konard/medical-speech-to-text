# Issue 7 work plan

Objective: fully address issue 7 in PR 8, preserving existing behavior and acceptance assertions. Only the coordinator pushes issue-7-675e7937f874. Merge/publication are separate actions.

- [x] Confirm prepared branch and clean starting worktree; read AGENTS.md, contributing and JavaScript-first instructions.
- [x] Read issue and all three PR comment/review channels; preserve raw data.
- [x] Read required sub-issues and linked original vision, previous analyses and recent related PRs; inventory every requirement.
- [x] Archive recent CI metadata and relevant complete failed logs with timestamps and exact SHAs; trace Pages and release root causes.
- [x] Search current primary sources; pin and inspect Whisper Flow and missing popular alternatives, license, architecture and fit.
- [x] Write case study: timeline, requirement mapping, root causes, alternatives and concrete quality/service plan, with evidence and limitations.
- [x] Reproduce wrong Pages entrypoint before modifying workflow; retain before screenshot.
- [x] Draft and validate native JavaScript Pages behavior, retain existing universal web/desktop/mobile paths, add regression coverage.
- [x] Wire bounded speech-lab build, browser and real-model acceptance into Pages artifact/deploy path; preserve all assertions and writer protections.
- [x] Capture final mobile/desktop screenshots and update main links/docs and changeset.
- [ ] Update PR description with final hosted checks and remaining external criteria.
- [x] Install locked dependencies; run full Node/Bun/Deno tests sequentially, lint, format, duplication, syntax, workflow/static/security/docs/line/version/changeset checks; bounded local browser tests. Do not run memory-heavy real models locally if unsafe; enforce hosted model acceptance.
- [x] Confirm current default branch is an ancestor, review whole diff, commit useful implementation batch and run checks at exact candidate revision.
- [x] Push implementation batch once only to prepared branch. Wait for every same-revision check; collect all five successful workflows, full logs and actual model evidence before the documentation batch.
- [ ] Validate and push the final evidence batch; wait for every final-revision check and preserve logs.
- [ ] Finish dependent work, refresh all feedback and sub-issues, verify clean tree and PR consistency, mark ready when completed; leave unmerged and explicitly report any genuine external blockers.

Build constraints: 2.92 GiB total memory, measure use, sequential heavy processes, CARGO_BUILD_JOBS=1 if relevant. No Rust migration is requested; native adapters/unsupported capabilities must be explicit. Logs go to files; read >1500-line files in chunks. Experiments remain in experiments/. No user-owned cache deletion.

External completion criteria remain open: Q04/Q05 live rollout requires separately authorized main integration; Q06 main release readiness requires owner-approved npm identity, credentials and publication. No merge or publication has been authorized.
