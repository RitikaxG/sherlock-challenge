# LLM Transcript Classifier

Phase 7 adds optional Gemini transcript role evidence extraction.

```text
Transcript chunk
  ↓
packages/llm Gemini classifier
  ↓
structured JSON evidence
  ↓
llm_transcript_evidence event
  ↓
apps/http /events ingestion
  ↓
packages/core fusion
  ↓
candidate_state_updated broadcast
```

The LLM does not choose the candidate. It only classifies transcript role evidence such as candidate self-identification, interviewer prompts, generic project statements, or uncertainty.

The Gemini provider reads `GEMINI_API_KEY` and optional `GEMINI_MODEL`. Normal unit tests use a mock provider and do not require a real key. The optional smoke test can be run with:

```sh
GEMINI_API_KEY=... bun --filter '@sherlock/llm' test:integration
```

`packages/core` remains the final deterministic decision-maker.
