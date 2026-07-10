# Sherlock Submission Checklist

## Repo

- [ ] README explains problem, architecture, commands, and demo flow.
- [ ] Architecture doc is updated.
- [ ] Evaluation report exists.
- [ ] Demo script exists.
- [ ] Reproducibility guide exists.
- [ ] No secrets committed.
- [ ] `.env.example` uses placeholders only.

## Commands

- [ ] `bun install`
- [ ] `bun run check-types`
- [ ] `bun run build`
- [ ] Package tests
- [ ] Eval CLI
- [ ] Optional Gemini smoke test

## Demo

- [ ] `docker compose up` works from a clean state.
- [ ] Dashboard loads.
- [ ] Recommended scenarios replay.
- [ ] No red dev/issue overlay in recording.
- [ ] Selected candidate explanation is visible.
- [ ] Limitations are stated clearly.

## Submission

- [ ] GitHub repo link ready.
- [ ] Demo video recorded.
- [ ] README includes setup.
- [ ] Email prepared for `priya@sherlock.sh`.

## Optional Post-Submission UI Cleanup

- [ ] Mount `WhyCandidateCard` or remove the unused component.
- [ ] Add a recommended demo path toggle.
