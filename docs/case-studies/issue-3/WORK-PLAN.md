# Issue 3 work plan

Objective: implement and verify every requirement of issue 3, including the
issue 1 audit, in PR 4. Keep incomplete evidence explicit; never infer device or
model quality from mocked tests.

- [x] Read repository workflow, contribution and JavaScript-first instructions.
- [x] Read complete issues 3 and 1 and PR 4 feedback (no comments/reviews).
- [x] Read prior PR 2 feedback, research, demo, API, tests and deployment contracts.
- [x] Inventory every prose requirement and map implementation, plan and evidence.
- [x] Research Google AI Edge Gallery, current browser inference, device support,
      model options, Australian hosting, dataset evaluation and microphone options.
- [x] Preserve latest failed main workflow logs; identify each actual failure and
      add reproducing tests before fixes. Track timestamps and exact source SHA.
- [x] Capture the existing demo in a real browser before UI changes.
- [x] Draft and test complete native JavaScript behavior before any other runtime.
- [x] Implement mobile-first React demo, local transcription and chat, capability
      checks, model lifecycle and explicit opt-in service quality comparisons.
- [x] Preserve dataset evaluation, word playback, exports and privacy assertions.
- [x] Audit issue 1 research and close every uncovered requirement with evidence.
- [x] Add automated regression and real-browser acceptance checks; capture final UI.
- [x] Run all required local tests, lint, formatting, duplication, workflow and
      documentation checks under bounded memory; retain logs and inspect failures.
- [x] Add changeset; review full diff, latest main ancestry and acceptance mapping.
- [ ] Commit complete batch, verify exact candidate revision, push only the prepared
      branch once; collect every same-revision CI failure before another batch.
- [ ] Update PR 4 title/body with reproduction, tests, screenshots and closing
      keywords for issues 3 and 1; mark ready only with honest acceptance status.
- [ ] Verify all checks, clean working tree and complete requirement evidence.

Only the coordinator pushes. Merge, release and deployment are separate actions.
Build sequentially when memory intensive; never remove user caches or weaken tests.

Unfinished acceptance: main Dependency graph enablement and owned npm package /
first-publish credentials. Neither is replaced by passing PR report-mode checks.
