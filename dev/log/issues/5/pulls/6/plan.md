# Issue 5 / PR 6 work plan

Objective: implement and verify every issue requirement in this PR. Keep external
blockers explicit; do not merge, release or deploy. One coordinator owns pushes.

- [x] Read repository workflow, contributing and JavaScript-first instructions.
- [x] Read the issue, all comment types, PR reviews and required sub-issue list.
- [x] Save source snapshots, exact revisions and recent run timestamps/SHA.
- [x] Download every failed baseline run log and inspect actual errors/warnings.
- [x] Read the referenced best-practices document and both complete template trees.
- [x] Compare all workflow, action, CI script and supporting configuration files;
      record applicable differences and justified language-specific exclusions.
- [x] Research official documentation and existing validation components.
- [x] Inventory every prose requirement, solution alternatives, chosen plan and
      implementation/verification evidence.
- [x] Reproduce each discovered defect with a minimal native JavaScript test
      before implementing the fix; retain acceptance assertions and tracing.
- [x] Apply fixes across every affected location and report shared template bugs
      upstream with reproducible evidence (explicitly authorized by issue 5).
- [x] Add an appropriate changeset; preserve manual version guard policy.
- [ ] Run all required local checks on the exact candidate revision, bounded by
      the 2.92 GiB container memory limit. Save large logs; inspect in chunks of
      at most 1500 lines. Avoid concurrent memory-heavy builds.
- [ ] Review the complete diff, ensure latest main is merged, commit atomic work,
      and push one complete batch to issue-5-5e1ddeb3d502 only.
- [ ] Wait for same-revision CI, collect every failure and warning before the
      next batch, and resolve them without weakening assertions.
- [ ] Update PR title/body with reproduction, tests, evidence and positive
      closing reference for issue 5 and every required sub-issue.
- [ ] Mark PR 6 ready after full verification; ensure clean working tree and
      consistent code, tests, evidence and description.

The first candidate passed every hosted workflow but retained dependency warnings.
The second batch passed five workflows and all actual archive/Pages/desktop
probes; Checks exposed missing Deno native-adapter dependencies, Deno's independent
install-script policy and Windows cold-install budget pressure. The third batch
addresses all findings together, preserving the full suite and existing budgets.
The npm identity/bootstrap criterion remains explicitly blocked; see audit.md.
PR readiness remains unfinished until that external criterion is resolved.
