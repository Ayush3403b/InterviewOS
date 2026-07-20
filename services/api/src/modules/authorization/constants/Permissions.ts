export enum Permission {
  // -------------------------
  // Profile
  // -------------------------
  PROFILE_READ = "profile.read",
  PROFILE_UPDATE = "profile.update",

  // -------------------------
  // Organization
  // -------------------------
  ORGANIZATION_CREATE = "organization.create",
  ORGANIZATION_READ = "organization.read",
  ORGANIZATION_UPDATE = "organization.update",
  ORGANIZATION_DELETE = "organization.delete",
  ORGANIZATION_RESTORE = "organization.restore",

  // -------------------------
  // Institute
  // -------------------------
  INSTITUTE_CREATE = "institute.create",
  INSTITUTE_READ = "institute.read",
  INSTITUTE_UPDATE = "institute.update",
  INSTITUTE_DELETE = "institute.delete",

  // -------------------------
  // Student
  // -------------------------
  STUDENT_CREATE = "student.create",
  STUDENT_READ = "student.read",
  STUDENT_UPDATE = "student.update",
  STUDENT_DELETE = "student.delete",
  STUDENT_MANAGE = "student.manage",

  // -------------------------
  // Recruiter / Candidate
  // -------------------------
  RECRUITER_CREATE = "recruiter.create",
  RECRUITER_READ = "recruiter.read",
  RECRUITER_UPDATE = "recruiter.update",
  RECRUITER_DELETE = "recruiter.delete",

  CANDIDATE_VIEW = "candidate.view",

  // -------------------------
  // Interview
  // -------------------------
  INTERVIEW_CREATE = "interview.create",
  INTERVIEW_READ = "interview.read",
  INTERVIEW_UPDATE = "interview.update",
  INTERVIEW_DELETE = "interview.delete",

  // -------------------------
  // Question Bank
  // -------------------------
  QUESTION_CREATE = "question.create",
  QUESTION_READ = "question.read",
  QUESTION_UPDATE = "question.update",
  QUESTION_DELETE = "question.delete",

  // -------------------------
  // Reports
  // -------------------------
  REPORT_READ = "report.read",
  REPORT_EXPORT = "report.export",

  // -------------------------
  // User Administration
  // -------------------------
  USER_MANAGE = "user.manage",

  // -------------------------
  // System
  // -------------------------
  SYSTEM_SETTINGS = "system.settings",
}