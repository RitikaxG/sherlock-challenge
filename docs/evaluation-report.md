# Sherlock Candidate Identity Evaluation Report

## 1. Evaluation Goal

Sherlock evaluates whether the system can identify the actual candidate participant stream in a live interview meeting. The goal is identity routing: deciding which stream should be treated as the candidate stream before downstream analysis runs.

Sherlock does not perform legal identity verification, face recognition, voice biometrics, liveness checks, or cheating/fraud verdicts.

## 2. Evaluation Method

The evaluation uses synthetic scenario fixtures from `scenarios/`. Each scenario contains meeting metadata, participants, an ordered meeting event stream, and an expected final outcome.

The evaluator replays each event through `packages/core`, then compares the final selected candidate stream and final state against the expected result. The suite measures top-1 correctness, state accuracy, false interviewer selections, ambiguity handling, insufficient-data handling, final confidence, evidence coverage, and time to likely or confirmed states when available.

## 3. Scenario Suite

| Scenario | Title | Edge case | Expected state | Expected selected candidate | Why it matters |
| --- | --- | --- | --- | --- | --- |
| `01_exact_name_match` | Candidate joins with exact display name and email | Clean metadata match | `LIKELY_CANDIDATE` | `p_candidate` | Establishes a baseline where clean name/email metadata identifies the candidate stream. |
| `02_generic_device_name` | Generic device remains insufficient with weak transcript evidence | Generic device remains insufficient | `INSUFFICIENT_DATA` | none | Proves the engine does not trust a generic device label alone. |
| `03_wrong_candidate_name_entered` | Candidate metadata has incomplete name but transcript identifies candidate role | Wrong display name | `LIKELY_CANDIDATE` | `p_candidate` | Shows that misleading or incomplete names can be outweighed by stronger evidence. |
| `04_multiple_interviewers` | Multiple interviewers join before candidate | Multiple interviewers | `LIKELY_CANDIDATE` | `p_candidate` | Ensures known interviewers and company-domain participants are not selected. |
| `05_silent_observer` | Silent observer is present but candidate has stronger evidence | Silent observer | `LIKELY_CANDIDATE` | `p_candidate` | Prevents observer streams from becoming accidental candidates. |
| `06_display_name_change` | Candidate changes display name from generic device to candidate name | Display name changes mid-call | `LIKELY_CANDIDATE` | `p_candidate` | Verifies realtime event updates can improve confidence without resetting the meeting. |
| `07_late_join_candidate` | Candidate joins late and evidence updates after arrival | Late join | `LIKELY_CANDIDATE` | `p_candidate` | Shows arrival order is not treated as identity. |
| `08_two_unknown_ambiguous` | Two unknown participants have similar evidence | Two unknown participants ambiguous | `AMBIGUOUS` | none | Demonstrates that refusing to choose is a safe valid outcome. |
| `09_candidate_rejoins` | Candidate leaves and rejoins with same participant identity | Candidate rejoins | `LIKELY_CANDIDATE` | `p_candidate` | Tests continuity across messy meeting lifecycle events. |
| `10_no_transcript_yet` | Only weak generic metadata exists early in the meeting | No transcript | `INSUFFICIENT_DATA` | none | Confirms the engine waits when transcript and strong metadata are absent. |
| `11_generic_transcript_not_enough` | Generic transcript phrase alone does not select candidate | Generic transcript | `INSUFFICIENT_DATA` | none | Prevents weak project phrases from becoming identity proof. |
| `12_strong_self_identification` | Strong self-identification and speech select generic device as likely candidate | Strong self-identification | `LIKELY_CANDIDATE` | `p_candidate` | Shows transcript self-identification can clarify a generic stream. |
| `13_interviewer_candidate_transcript_conflict` | Known interviewer saying candidate-like phrase is contradicted | Transcript conflict | `INSUFFICIENT_DATA` | none | Tests contradiction handling when candidate-like speech appears on an interviewer stream. |
| `14_candidate_name_interviewer_email_conflict` | Candidate name with interviewer email creates metadata conflict | Candidate name with interviewer email | `INSUFFICIENT_DATA` | none | Shows interviewer/company metadata can block a candidate-looking name. |
| `15_no_instant_confirmation` | Strong evidence does not instantly confirm without stability | No instant confirmation | `LIKELY_CANDIDATE` | `p_candidate` | Separates likely selection from stricter confirmation. |
| `16_stable_candidate_confirmation` | Stable candidate evidence across time confirms candidate stream | Stable confirmation | `CONFIRMED_CANDIDATE` | `p_candidate` | Verifies confirmation requires stability across time. |
| `17_old_transcript_decays` | Old transcript and speech evidence decays without persistent metadata | Old evidence decay | `INSUFFICIENT_DATA` | none | Ensures stale transcript evidence does not dominate forever. |
| `18_llm_candidate_self_identification` | LLM evidence identifies candidate-like self-identification | LLM candidate evidence | `LIKELY_CANDIDATE` | `p_candidate` | Shows Gemini-style evidence can support, but not decide, candidate routing. |
| `19_llm_interviewer_prompt_negative` | LLM interviewer prompt evidence prevents candidate selection | LLM interviewer prompt | `INSUFFICIENT_DATA` | none | Confirms LLM evidence can support interviewer exclusion. |
| `20_llm_generic_project_not_enough` | LLM generic project evidence alone remains insufficient | LLM generic project phrase | `INSUFFICIENT_DATA` | none | Keeps generic LLM transcript evidence conservative. |

## 4. Metrics

Command:

```sh
bun --filter '@sherlock/eval' eval
```

Observed output:

```text
Scenarios: 20/20 passed
Top-1 accuracy: 100%
State accuracy: 100%
False interviewer selections: 0
Avg final confidence: 0.595
Avg evidence count: 6
Ambiguous handled: 1/1
Insufficient-data handled: 8/8
Avg time to likely: 25.5s
Avg time to confirmed: 90s
```

All 20 scenarios passed. The suite reported zero false interviewer selections and correct handling for the single ambiguous scenario and all eight insufficient-data scenarios.

## 5. Edge Case Coverage

- Generic device name: the engine does not select a candidate from a label like `MacBook Pro` alone.
- Wrong display name: stronger transcript and metadata evidence can overcome misleading display names.
- Multiple interviewers: known interviewer and company-domain signals reduce interviewer selection risk.
- Silent observer: lack of candidate evidence keeps observers below the threshold.
- Display name change: realtime name changes update confidence and explanation.
- Late join: a candidate can be selected after arriving later than other participants.
- Ambiguous top two: close competing streams can produce `AMBIGUOUS`.
- Candidate rejoin: lifecycle events remain explainable across leave/rejoin behavior.
- No transcript: weak metadata without transcript can remain `INSUFFICIENT_DATA`.
- Generic transcript not enough: generic project phrases do not prove candidate identity.
- Strong self-identification: explicit self-identification can select a generic device stream.
- Interviewer/candidate contradiction: candidate-like transcript on interviewer metadata triggers safety behavior.
- Evidence decay: old transcript and behavior evidence can expire.
- Stable confirmation: confirmation is stricter than likely selection.
- LLM evidence: structured Gemini evidence enters as transcript role evidence only.

## 6. Failure Safety

The system can return `INSUFFICIENT_DATA` when evidence is too weak. It can return `AMBIGUOUS` when top streams are too close. Interviewer exclusion and contradiction detection help avoid false interviewer selections. Confirmation requires stability, and old transcript evidence can decay so stale evidence does not dominate later decisions.

## 7. LLM Evaluation

Gemini is used only to extract structured transcript role evidence. Normal package tests use a mock provider. Real Gemini integration is optional and requires `GEMINI_API_KEY`.

LLM evidence enters the system as `llm_transcript_evidence`. That evidence is validated and then passed into the same deterministic core fusion engine. The LLM does not select the candidate; `packages/core` remains the final decision-maker.

## 8. Limitations

- No production Zoom, Google Meet, Teams, or calendar integration.
- No raw audio recording.
- No face recognition.
- No voice biometrics.
- No legal identity verification.
- No cheating or fraud verdict.
- Scenario fixtures are synthetic, not real-world labeled interview data.
- Production use would require meeting integrations, ASR ingestion, security/privacy hardening, operational monitoring, and larger datasets.

## 9. Conclusion

Sherlock is suitable for the challenge because it solves candidate stream routing before fraud detectors run. It fuses multiple weak signals, explains the decision, handles uncertainty safely, and remains testable through repeatable scenario replay.
