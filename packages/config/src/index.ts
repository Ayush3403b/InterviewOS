export const APP_CONFIG = {
  appName: "InterviewOS",
  version: "1.0.0",
  defaultInterviewTurns: 5,
  minInterviewTurns: 3,
  maxInterviewTurns: 15,
  answerTimeLimitSeconds: 180,
  maxResumeUploadSizeBytes: 10 * 1024 * 1024, // 10MB
  supportedResumeMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  riskScoreThresholds: {
    low: 25,
    moderate: 60,
    high: 80,
  },
  supportedCodingLanguages: [
    "typescript",
    "javascript",
    "python",
    "java",
    "cpp",
    "go",
  ] as const,
};

export type SupportedCodingLanguage =
  (typeof APP_CONFIG.supportedCodingLanguages)[number];
