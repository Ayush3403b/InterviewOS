import {
  ProctoringEventDocument,
  ProctoringSessionDocument,
} from "../types/proctoring.types";
import { getRiskLevel, RiskLevel } from "../services/RiskEngine";

export class ProctoringResponse {
  static toSessionResponse(session: ProctoringSessionDocument) {
    const rawCandidate = session.candidateId as unknown;
    const candidateObj =
      rawCandidate &&
      typeof rawCandidate === "object" &&
      "firstName" in (rawCandidate as Record<string, unknown>)
        ? (rawCandidate as {
            _id: string;
            firstName: string;
            lastName: string;
            email: string;
            avatar?: string;
          })
        : null;

    const candidateId = candidateObj ? candidateObj._id : session.candidateId;
    const candidateName = candidateObj
      ? `${candidateObj.firstName} ${candidateObj.lastName}`.trim()
      : undefined;
    const candidateEmail = candidateObj ? candidateObj.email : undefined;
    const candidateAvatar = candidateObj ? candidateObj.avatar : undefined;

    return {
      id: session._id,
      interviewSessionId: session.interviewSessionId,
      candidateId,
      candidateName,
      candidateEmail,
      candidateAvatar,
      organizationId: session.organizationId,
      status: session.status,
      trustScore: session.trustScore,
      riskScore: session.riskScore,
      /** Derived live from the session's running riskScore - for the
       *  authoritative, full-history recompute, see getReport/toReport. */
      riskLevel: getRiskLevel(session.riskScore),
      totalSignals: session.totalSignals,
      violationCounts: session.violationCounts,
      agentProvider: session.agentProvider,
      consentGivenAt: session.consentGivenAt,
      consentVersion: session.consentVersion,
      referenceFrame: session.referenceFrame,
      startedAt: session.startedAt,
      lastSignalAt: session.lastSignalAt,
      flaggedAt: session.flaggedAt,
      endedAt: session.endedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  static toEventResponse(event: ProctoringEventDocument) {
    return {
      id: event._id,
      type: event.type,
      severity: event.severity,
      message: event.message,
      confidence: event.confidence,
      status: event.status,
      cameraFrame: event.cameraFrame,
      durationMs: event.durationMs,
      metadata: event.metadata,
      occurredAt: event.occurredAt,
    };
  }

  static toEventList(events: ProctoringEventDocument[]) {
    return events.map((event) => this.toEventResponse(event));
  }

  static toReport(report: {
    session: ProctoringSessionDocument;
    timeline: ProctoringEventDocument[];
    severityBreakdown: { _id: string; count: number }[];
    riskScore: number;
    riskLevel: RiskLevel;
    violationCount: number;
    summary: string;
    recommendation: string;
  }) {
    return {
      session: this.toSessionResponse(report.session),
      riskScore: report.riskScore,
      riskLevel: report.riskLevel,
      violationCount: report.violationCount,
      severityBreakdown: report.severityBreakdown.reduce<Record<string, number>>(
        (acc, row) => {
          acc[row._id] = row.count;
          return acc;
        },
        {}
      ),
      summary: report.summary,
      recommendation: report.recommendation,
      timeline: this.toEventList(report.timeline),
    };
  }
}
