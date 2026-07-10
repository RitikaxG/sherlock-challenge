import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import {
  applyMeetingEvent,
  createInitialSessionState,
  extractBehaviorSignals,
  extractInterviewerExclusionSignals,
  extractMetadataSignals,
  extractTranscriptSignals,
  fuseCandidateSignals,
  rankParticipants
} from "./index.ts";
import {
  MeetingEventSchema,
  MeetingSchema,
  ParticipantSchema
} from "@sherlock/shared";

const meeting = MeetingSchema.parse({
  id: "meeting_1",
  candidateName: "Ritika Gupta",
  candidateEmail: "ritika@gmail.com",
  interviewerNames: ["Priya Sharma"],
  interviewerEmails: ["priya@sherlock.ai"],
  companyDomains: ["sherlock.ai"]
});

function participant(input: {
  id: string;
  displayName: string;
  email?: string;
  isKnownInterviewerHint?: boolean;
}) {
  return ParticipantSchema.parse({
    meetingId: meeting.id,
    isKnownInterviewerHint: false,
    ...input
  });
}

describe("@sherlock/core Phase 3 signal extraction", () => {
  test("valid MeetingEventSchema parses correctly", () => {
    expect(
      MeetingEventSchema.parse({
        type: "participant_joined",
        participantId: "participant_1",
        timestampSec: 0
      }).type
    ).toBe("participant_joined");
  });

  test("malformed meeting events are rejected", () => {
    expect(() =>
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "participant_1",
        timestampSec: 10,
        text: ""
      })
    ).toThrow();
  });

  test("metadata signals detect exact candidate name matches", () => {
    const state = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "Ritika Gupta" })
    ]);

    expect(extractMetadataSignals(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participantId: "p_candidate",
          kind: "candidate_name_exact",
          direction: "positive"
        })
      ])
    );
  });

  test("metadata signals keep generic device names weak and neutral", () => {
    const state = createInitialSessionState(meeting, [
      participant({ id: "p_device", displayName: "MacBook Pro" })
    ]);

    expect(extractMetadataSignals(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participantId: "p_device",
          kind: "generic_device_name",
          direction: "neutral"
        })
      ])
    );
  });

  test("interviewer name, email, and company domain produce negative signals", () => {
    const state = createInitialSessionState(meeting, [
      participant({
        id: "p_interviewer",
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);

    const signals = [
      ...extractMetadataSignals(state),
      ...extractInterviewerExclusionSignals(state)
    ];

    expect(signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "interviewer_name_match" }),
        expect.objectContaining({ kind: "interviewer_email_match" }),
        expect.objectContaining({ kind: "company_domain_email" })
      ])
    );
    expect(signals.every((signal) => signal.direction !== "positive")).toBe(true);
  });

  test("session state applies event updates deterministically", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "MacBook Pro" })
    ]);

    const state = [
      MeetingEventSchema.parse({
        type: "display_name_changed",
        participantId: "p_candidate",
        timestampSec: 10,
        newDisplayName: "Ritika Gupta"
      }),
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 20,
        durationSec: 45
      }),
      MeetingEventSchema.parse({
        type: "webcam_changed",
        participantId: "p_candidate",
        timestampSec: 25,
        webcamOn: true
      }),
      MeetingEventSchema.parse({
        type: "screen_share_changed",
        participantId: "p_candidate",
        timestampSec: 30,
        sharing: true
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 40,
        text: "My name is Ritika and I worked on a project."
      })
    ].reduce(applyMeetingEvent, baseState);

    expect(state.currentDisplayNames.p_candidate).toBe("Ritika Gupta");
    expect(state.participantSpeakingDurationSec.p_candidate).toBe(45);
    expect(state.webcamOnByParticipant.p_candidate).toBe(true);
    expect(state.screenShareByParticipant.p_candidate).toBe(true);
    expect(state.transcriptSnippetsByParticipant.p_candidate).toEqual([
      "My name is Ritika and I worked on a project."
    ]);
  });

  test("behavior signals reflect speaking activity, webcam, and screen share", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "Ritika Gupta" })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 20,
        durationSec: 90
      }),
      MeetingEventSchema.parse({
        type: "webcam_changed",
        participantId: "p_candidate",
        timestampSec: 25,
        webcamOn: true
      }),
      MeetingEventSchema.parse({
        type: "screen_share_changed",
        participantId: "p_candidate",
        timestampSec: 30,
        sharing: true
      })
    ].reduce(applyMeetingEvent, baseState);

    expect(extractBehaviorSignals(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "speaking_activity" }),
        expect.objectContaining({ kind: "webcam_on" }),
        expect.objectContaining({ kind: "screen_share" })
      ])
    );
  });

  test("transcript signals detect candidate-like and interviewer-like phrases", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "Ritika Gupta" }),
      participant({ id: "p_interviewer", displayName: "Priya Sharma" })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 40,
        text: "My name is Ritika and I worked on my project."
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_interviewer",
        timestampSec: 50,
        text: "Tell me about yourself and then can you explain the role."
      })
    ].reduce(applyMeetingEvent, baseState);

    expect(extractTranscriptSignals(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participantId: "p_candidate",
          kind: "candidate_name_spoken",
          direction: "positive"
        }),
        expect.objectContaining({
          participantId: "p_interviewer",
          kind: "interviewer_question_prompt",
          direction: "negative"
        })
      ])
    );
  });

  test("strong candidate match selects the candidate with high confidence", () => {
    const state = createInitialSessionState(meeting, [
      participant({
        id: "p_candidate",
        displayName: "Ritika Gupta",
        email: "ritika@gmail.com"
      }),
      participant({
        id: "p_interviewer",
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);

    const snapshot = rankParticipants(state);

    expect(["LIKELY_CANDIDATE", "CONFIRMED_CANDIDATE"]).toContain(
      snapshot.state
    );
    expect(snapshot.selectedCandidateId).toBe("p_candidate");
    expect(snapshot.confidence).toBeGreaterThanOrEqual(0.75);
  });

  test("generic device name only stays insufficient", () => {
    const state = createInitialSessionState(meeting, [
      participant({ id: "p_device", displayName: "MacBook Pro" })
    ]);

    const snapshot = rankParticipants(state);

    expect(snapshot.state).toBe("INSUFFICIENT_DATA");
    expect(snapshot.selectedCandidateId).toBeNull();
    expect(snapshot.confidence).toBe(0);
  });

  test("generic device that later changes name and speaks can be selected", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "MacBook Pro" }),
      participant({ id: "p_other", displayName: "Guest" })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "display_name_changed",
        participantId: "p_candidate",
        timestampSec: 30,
        newDisplayName: "Ritika Gupta"
      }),
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 60,
        durationSec: 120
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 70,
        text: "My name is Ritika and I worked on my project."
      })
    ].reduce(applyMeetingEvent, baseState);

    const snapshot = rankParticipants(state);

    expect(snapshot.selectedCandidateId).toBe("p_candidate");
    expect(snapshot.confidence).toBeGreaterThanOrEqual(0.7);
  });

  test("known interviewer exclusion prevents selecting the interviewer", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({
        id: "p_candidate",
        displayName: "Ritika",
        email: "ritika@gmail.com"
      }),
      participant({
        id: "p_interviewer",
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);
    const state = applyMeetingEvent(
      baseState,
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_interviewer",
        timestampSec: 120,
        durationSec: 600
      })
    );

    const snapshot = rankParticipants(state);

    expect(snapshot.selectedCandidateId).toBe("p_candidate");
    expect(snapshot.participants[0]?.participantId).toBe("p_candidate");
  });

  test("similar evidence across two participants becomes ambiguous", () => {
    const ambiguousMeeting = MeetingSchema.parse({
      ...meeting,
      candidateName: "Ritika Gupta",
      candidateEmail: undefined
    });
    const state = createInitialSessionState(ambiguousMeeting, [
      participant({ id: "p_one", displayName: "Ritika" }),
      participant({ id: "p_two", displayName: "Ritika" })
    ]);
    const withTranscript = [
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_one",
        timestampSec: 40,
        text: "My name is Ritika and my project involved backend systems."
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_two",
        timestampSec: 42,
        text: "My name is Ritika and my project involved backend systems."
      })
    ].reduce(applyMeetingEvent, state);

    const snapshot = rankParticipants(withTranscript);

    expect(snapshot.state).toBe("AMBIGUOUS");
    expect(snapshot.selectedCandidateId).toBeNull();
    expect(snapshot.decisionTrace?.safetyGates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gate: "ambiguity_margin",
          status: "blocked"
        })
      ])
    );
  });

  test("transcript evidence lifts candidate and lowers interviewer", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "MacBook Pro" }),
      participant({ id: "p_interviewer", displayName: "Guest" })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 40,
        text: "I am the candidate and my experience includes backend work."
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_interviewer",
        timestampSec: 50,
        text: "Tell me about yourself and I will ask the next question."
      })
    ].reduce(applyMeetingEvent, baseState);

    const fusion = fuseCandidateSignals(state);
    const candidate = fusion.participantScores.find(
      (score) => score.participantId === "p_candidate"
    );
    const interviewer = fusion.participantScores.find(
      (score) => score.participantId === "p_interviewer"
    );

    expect(candidate?.rawScore).toBeGreaterThan(0);
    expect(interviewer?.rawScore).toBeLessThan(0);
    expect(candidate?.confidence).toBeGreaterThan(interviewer?.confidence ?? 0);
  });

  test("generic transcript phrase alone stays insufficient", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "MacBook Pro" })
    ]);
    const state = applyMeetingEvent(
      baseState,
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 40,
        text: "My project used TypeScript."
      })
    );

    const snapshot = rankParticipants(state);

    expect(["INSUFFICIENT_DATA", "POSSIBLE_CANDIDATE"]).toContain(
      snapshot.state
    );
    if (snapshot.state === "INSUFFICIENT_DATA") {
      expect(snapshot.selectedCandidateId).toBeNull();
    }
  });

  test("self-identification plus speech can produce a likely candidate", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "MacBook Pro" }),
      participant({
        id: "p_interviewer",
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 30,
        durationSec: 300
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 35,
        text: "My name is Ritika Gupta, I am here for the interview."
      })
    ].reduce(applyMeetingEvent, baseState);

    const snapshot = rankParticipants(state);

    expect(snapshot.selectedCandidateId).toBe("p_candidate");
    expect(snapshot.state).toBe("LIKELY_CANDIDATE");
  });

  test("generic phrase plus strong metadata can help reach likely", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({
        id: "p_candidate",
        displayName: "Ritika Gupta",
        email: "ritika@gmail.com"
      })
    ]);
    const state = applyMeetingEvent(
      baseState,
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 30,
        text: "My project used TypeScript."
      })
    );

    const snapshot = rankParticipants(state);

    expect(snapshot.selectedCandidateId).toBe("p_candidate");
    expect(snapshot.state).toBe("LIKELY_CANDIDATE");
  });

  test("candidate-like transcript with interviewer email does not confirm", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({
        id: "p_conflicted",
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);
    const state = applyMeetingEvent(
      baseState,
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_conflicted",
        timestampSec: 20,
        text: "I am the candidate."
      })
    );

    const snapshot = rankParticipants(state);

    expect(snapshot.state).not.toBe("CONFIRMED_CANDIDATE");
    expect(snapshot.uncertainty).toEqual(
      expect.arrayContaining([
        expect.stringContaining("contradictory candidate and interviewer evidence")
      ])
    );
  });

  test("candidate name with interviewer email creates contradiction uncertainty", () => {
    const conflictMeeting = MeetingSchema.parse({
      ...meeting,
      candidateName: "Priya Sharma",
      candidateEmail: undefined
    });
    const state = createInitialSessionState(conflictMeeting, [
      ParticipantSchema.parse({
        id: "p_conflicted",
        meetingId: meeting.id,
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);

    const snapshot = rankParticipants(state);

    expect(snapshot.state).not.toBe("CONFIRMED_CANDIDATE");
    expect(snapshot.uncertainty).toEqual(
      expect.arrayContaining([
        expect.stringContaining("contradictory candidate and interviewer evidence")
      ])
    );
  });

  test("mixed candidate and interviewer transcript role lowers confidence", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_mixed", displayName: "Ritika Gupta" })
    ]);
    const candidateOnly = applyMeetingEvent(
      baseState,
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_mixed",
        timestampSec: 20,
        text: "My name is Ritika Gupta and I am here for the interview."
      })
    );
    const mixed = applyMeetingEvent(
      candidateOnly,
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_mixed",
        timestampSec: 25,
        text: "Tell me about yourself and I will ask the next question."
      })
    );

    expect(rankParticipants(mixed).confidence).toBeLessThan(
      rankParticipants(candidateOnly).confidence
    );
  });

  test("confirmation requires temporal stability", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({
        id: "p_candidate",
        displayName: "Ritika Gupta",
        email: "ritika@gmail.com"
      })
    ]);
    const unstable = applyMeetingEvent(
      baseState,
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 5,
        text: "My name is Ritika Gupta and I am here for the interview."
      })
    );
    const stable = [
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 70,
        durationSec: 30
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_candidate",
        timestampSec: 80,
        text: "My experience includes backend systems."
      })
    ].reduce(applyMeetingEvent, unstable);

    expect(rankParticipants(unstable).state).toBe("LIKELY_CANDIDATE");
    expect(rankParticipants(unstable).decisionTrace?.safetyGates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gate: "confirmation_stability",
          status: "warning"
        })
      ])
    );
    expect(rankParticipants(stable).state).toBe("CONFIRMED_CANDIDATE");
    expect(rankParticipants(stable).decisionTrace?.safetyGates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gate: "confirmation_stability",
          status: "passed"
        })
      ])
    );
  });

  test("old transcript and speaking evidence decay while metadata persists", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_device", displayName: "MacBook Pro" }),
      participant({ id: "p_named", displayName: "Ritika Gupta" })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_device",
        timestampSec: 10,
        durationSec: 120
      }),
      MeetingEventSchema.parse({
        type: "transcript_chunk",
        participantId: "p_device",
        timestampSec: 20,
        text: "My name is Ritika Gupta and I am here for the interview."
      }),
      MeetingEventSchema.parse({
        type: "participant_joined",
        participantId: "p_named",
        timestampSec: 500
      })
    ].reduce(applyMeetingEvent, baseState);

    const snapshot = rankParticipants(state);

    expect(snapshot.selectedCandidateId).toBe("p_named");
  });

  test("likely candidate includes human identity verification limitation", () => {
    const state = createInitialSessionState(meeting, [
      participant({
        id: "p_candidate",
        displayName: "Ritika Gupta",
        email: "ritika@gmail.com"
      })
    ]);

    const snapshot = rankParticipants(state);

    expect(snapshot.state).toBe("LIKELY_CANDIDATE");
    expect(snapshot.uncertainty).toEqual(
      expect.arrayContaining([
        expect.stringContaining("human identity verification")
      ])
    );
  });

  test("LLM candidate self-identification evidence can help candidate become likely", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "MacBook Pro" }),
      participant({
        id: "p_interviewer",
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "speaking_activity",
        participantId: "p_candidate",
        timestampSec: 10,
        durationSec: 300
      }),
      MeetingEventSchema.parse({
        type: "llm_transcript_evidence",
        participantId: "p_candidate",
        timestampSec: 20,
        role: "candidate_like",
        confidence: 0.9,
        selfIdentifiedName: "Ritika Gupta",
        mentionedCandidateName: true,
        shouldAffectCandidateIdentity: true,
        uncertainty: [],
        evidence: [
          {
            kind: "candidate_self_identification",
            role: "candidate_like",
            confidence: 0.9,
            strength: "strong",
            reason: "Speaker self-identified as the candidate."
          },
          {
            kind: "candidate_name_spoken",
            role: "candidate_like",
            confidence: 0.86,
            strength: "strong",
            reason: "Speaker mentioned the candidate name."
          },
          {
            kind: "candidate_experience_statement",
            role: "candidate_like",
            confidence: 0.72,
            strength: "medium",
            reason: "Speaker described candidate-relevant experience."
          }
        ]
      })
    ].reduce(applyMeetingEvent, baseState);

    const snapshot = rankParticipants(state);

    expect(snapshot.selectedCandidateId).toBe("p_candidate");
    expect(snapshot.state).toBe("LIKELY_CANDIDATE");
  });

  test("LLM generic evidence alone does not select a candidate", () => {
    const state = applyMeetingEvent(
      createInitialSessionState(meeting, [
        participant({ id: "p_candidate", displayName: "MacBook Pro" })
      ]),
      MeetingEventSchema.parse({
        type: "llm_transcript_evidence",
        participantId: "p_candidate",
        timestampSec: 20,
        role: "candidate_like",
        confidence: 0.45,
        selfIdentifiedName: null,
        mentionedCandidateName: false,
        shouldAffectCandidateIdentity: true,
        uncertainty: ["Generic project language is weak role evidence."],
        evidence: [
          {
            kind: "candidate_project_statement",
            role: "candidate_like",
            confidence: 0.45,
            strength: "weak",
            reason: "Project discussion is generic."
          }
        ]
      })
    );

    const snapshot = rankParticipants(state);

    expect(snapshot.selectedCandidateId).toBeNull();
    expect(snapshot.state).toBe("INSUFFICIENT_DATA");
  });

  test("LLM interviewer evidence lowers participant score", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "MacBook Pro" }),
      participant({ id: "p_prompt", displayName: "Guest" })
    ]);
    const state = applyMeetingEvent(
      baseState,
      MeetingEventSchema.parse({
        type: "llm_transcript_evidence",
        participantId: "p_prompt",
        timestampSec: 20,
        role: "interviewer_like",
        confidence: 0.9,
        selfIdentifiedName: null,
        mentionedCandidateName: false,
        shouldAffectCandidateIdentity: true,
        uncertainty: [],
        evidence: [
          {
            kind: "interviewer_question_prompt",
            role: "interviewer_like",
            confidence: 0.9,
            strength: "strong",
            reason: "Speaker prompted another participant."
          }
        ]
      })
    );
    const promptScore = rankParticipants(state).participants.find(
      (score) => score.participantId === "p_prompt"
    );

    expect(promptScore?.rawScore).toBeLessThan(0);
  });

  test("LLM uncertain evidence becomes uncertainty, not candidate proof", () => {
    const state = applyMeetingEvent(
      createInitialSessionState(meeting, [
        participant({ id: "p_uncertain", displayName: "MacBook Pro" })
      ]),
      MeetingEventSchema.parse({
        type: "llm_transcript_evidence",
        participantId: "p_uncertain",
        timestampSec: 20,
        role: "uncertain",
        confidence: 0.2,
        selfIdentifiedName: null,
        mentionedCandidateName: false,
        shouldAffectCandidateIdentity: false,
        uncertainty: ["No clear transcript role evidence."],
        evidence: [
          {
            kind: "no_clear_role_evidence",
            role: "uncertain",
            confidence: 0.2,
            strength: "weak",
            reason: "No role evidence."
          }
        ]
      })
    );

    const snapshot = rankParticipants(state);

    expect(snapshot.selectedCandidateId).toBeNull();
    expect(snapshot.uncertainty).toEqual(
      expect.arrayContaining([
        expect.stringContaining("No clear transcript role evidence")
      ])
    );
  });

  test("LLM evidence decays like transcript evidence", () => {
    const baseState = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "MacBook Pro" })
    ]);
    const state = [
      MeetingEventSchema.parse({
        type: "llm_transcript_evidence",
        participantId: "p_candidate",
        timestampSec: 20,
        role: "candidate_like",
        confidence: 0.9,
        selfIdentifiedName: "Ritika Gupta",
        mentionedCandidateName: true,
        shouldAffectCandidateIdentity: true,
        uncertainty: [],
        evidence: [
          {
            kind: "candidate_self_identification",
            role: "candidate_like",
            confidence: 0.9,
            strength: "strong",
            reason: "Speaker self-identified."
          }
        ]
      }),
      MeetingEventSchema.parse({
        type: "participant_joined",
        participantId: "p_candidate",
        timestampSec: 500
      })
    ].reduce(applyMeetingEvent, baseState);

    const snapshot = rankParticipants(state);

    expect(snapshot.selectedCandidateId).toBeNull();
    expect(snapshot.state).toBe("INSUFFICIENT_DATA");
  });

  test("snapshot includes evidence and uncertainty explanations", () => {
    const state = createInitialSessionState(meeting, [
      participant({ id: "p_candidate", displayName: "Ritika Gupta" }),
      participant({ id: "p_device", displayName: "MacBook Pro" })
    ]);

    const snapshot = rankParticipants(state);

    expect(snapshot.evidence.length).toBeGreaterThan(0);
    expect(snapshot.evidence[0]).toEqual(
      expect.objectContaining({
        source: expect.any(String),
        direction: expect.any(String),
        rawStrength: expect.any(Number),
        sourceWeight: expect.any(Number),
        weightedImpact: expect.any(Number)
      })
    );
    expect(snapshot.uncertainty).toEqual(
      expect.arrayContaining([
        expect.stringContaining("generic device name")
      ])
    );
  });

  test("snapshot includes pipeline trace and score breakdown", () => {
    const state = createInitialSessionState(meeting, [
      participant({
        id: "p_candidate",
        displayName: "Ritika Gupta",
        email: "ritika@gmail.com"
      }),
      participant({
        id: "p_interviewer",
        displayName: "Priya Sharma",
        email: "priya@sherlock.ai"
      })
    ]);

    const snapshot = rankParticipants(state);

    expect(snapshot.decisionTrace?.pipeline.map((step) => step.step)).toEqual(
      expect.arrayContaining([
        "Signals extracted",
        "Signal weights applied",
        "Safety gates checked",
        "Decision emitted"
      ])
    );
    expect(snapshot.decisionTrace?.scoreBreakdown[0]).toEqual(
      expect.objectContaining({
        participantId: "p_candidate",
        positiveWeight: expect.any(Number),
        negativeWeight: expect.any(Number),
        rawScore: expect.any(Number),
        confidence: expect.any(Number)
      })
    );
    expect(snapshot.decisionTrace?.safetyGates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gate: "identity_verification_limit",
          status: "warning"
        })
      ])
    );
  });

  test("core imports stay pure", () => {
    const forbiddenImports = [
      "@sherlock/db",
      "@sherlock/realtime",
      "@sherlock/llm",
      "fastify",
      "prisma",
      "react",
      "websocket"
    ];
    const files = readdirSync(new URL(".", import.meta.url))
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
      .map((file) => join(new URL(".", import.meta.url).pathname, file));

    for (const file of files) {
      const source = readFileSync(file, "utf8").toLowerCase();

      for (const forbiddenImport of forbiddenImports) {
        expect(source).not.toContain(forbiddenImport);
      }
    }
  });
});
