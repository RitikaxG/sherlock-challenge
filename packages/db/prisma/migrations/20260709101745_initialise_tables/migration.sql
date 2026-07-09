-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT,
    "scheduledStart" TIMESTAMP(3),
    "interviewerNames" JSONB NOT NULL,
    "interviewerEmails" JSONB NOT NULL,
    "companyDomains" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "currentName" TEXT,
    "joinedAtSec" DOUBLE PRECISION,
    "leftAtSec" DOUBLE PRECISION,
    "isKnownInterviewerHint" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingEvent" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "participantId" TEXT,
    "type" TEXT NOT NULL,
    "timestampSec" DOUBLE PRECISION NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreSnapshot" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "participantId" TEXT,
    "selectedCandidateId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "state" TEXT NOT NULL,
    "participants" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "uncertainty" JSONB NOT NULL,
    "rawSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioResult" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "meetingId" TEXT,
    "expectedCandidateId" TEXT,
    "predictedCandidateId" TEXT,
    "passed" BOOLEAN NOT NULL,
    "metrics" JSONB NOT NULL,
    "finalSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Participant_meetingId_idx" ON "Participant"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingEvent_meetingId_idx" ON "MeetingEvent"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingEvent_participantId_idx" ON "MeetingEvent"("participantId");

-- CreateIndex
CREATE INDEX "MeetingEvent_timestampSec_idx" ON "MeetingEvent"("timestampSec");

-- CreateIndex
CREATE INDEX "MeetingEvent_meetingId_timestampSec_idx" ON "MeetingEvent"("meetingId", "timestampSec");

-- CreateIndex
CREATE INDEX "MeetingEvent_meetingId_participantId_timestampSec_idx" ON "MeetingEvent"("meetingId", "participantId", "timestampSec");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_meetingId_idx" ON "ScoreSnapshot"("meetingId");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_participantId_idx" ON "ScoreSnapshot"("participantId");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_createdAt_idx" ON "ScoreSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_meetingId_createdAt_idx" ON "ScoreSnapshot"("meetingId", "createdAt");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_meetingId_participantId_createdAt_idx" ON "ScoreSnapshot"("meetingId", "participantId", "createdAt");

-- CreateIndex
CREATE INDEX "ScenarioResult_scenarioId_idx" ON "ScenarioResult"("scenarioId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingEvent" ADD CONSTRAINT "MeetingEvent_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingEvent" ADD CONSTRAINT "MeetingEvent_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreSnapshot" ADD CONSTRAINT "ScoreSnapshot_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreSnapshot" ADD CONSTRAINT "ScoreSnapshot_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioResult" ADD CONSTRAINT "ScenarioResult_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
