import { apiClient } from "../../lib/apiClient";
import type {
  ExportResumeDto,
  GrammarCheckResult,
  JDMatchResult,
  RewriteResult,
} from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Mirrors POST /api/resume-writer/grammar-check. */
export async function checkGrammar(text: string): Promise<GrammarCheckResult> {
  const res = await apiClient.post<ApiEnvelope<GrammarCheckResult>>(
    "/resume-writer/grammar-check",
    { text }
  );
  return res.data.data;
}

/** Mirrors POST /api/resume-writer/rewrite. */
export async function rewriteText(
  text: string,
  targetRole?: string
): Promise<RewriteResult> {
  const res = await apiClient.post<ApiEnvelope<RewriteResult>>(
    "/resume-writer/rewrite",
    { text, targetRole }
  );
  return res.data.data;
}

/** Mirrors POST /api/resume-writer/match-jd. */
export async function matchJobDescription(payload: {
  resumeText: string;
  jobDescription: string;
  targetRole?: string;
}): Promise<JDMatchResult> {
  const res = await apiClient.post<ApiEnvelope<JDMatchResult>>(
    "/resume-writer/match-jd",
    payload
  );
  return res.data.data;
}

/** Mirrors POST /api/resume-writer/export-pdf. */
export async function exportResumePdf(
  data: ExportResumeDto
): Promise<Blob> {
  const res = await apiClient.post("/resume-writer/export-pdf", data, {
    responseType: "blob",
  });
  return res.data as Blob;
}

/** Mirrors POST /api/resume-writer/generate. */
export async function generateAIResume(payload: {
  resumeId?: string;
  resumeText?: string;
  targetRole: string;
  experienceLevel: string;
  yearsOfExperience: number;
  skills: string[];
  candidateName?: string;
  industry?: string;
  backgroundNotes?: string;
  jobDescription?: string;
  githubUsername?: string;
  linkedinUrl?: string;
  selectedProjects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    stars?: number;
  }>;
}): Promise<any> {
  const res = await apiClient.post<ApiEnvelope<any>>(
    "/resume-writer/generate",
    payload
  );
  return res.data.data;
}

/** Mirrors GET /api/resumes/github/repos. */
export async function fetchGitHubRepos(
  username: string,
  token?: string
): Promise<
  Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    url: string;
    topics: string[];
  }>
> {
  const params: Record<string, string> = { username };
  if (token) params.token = token;
  const res = await apiClient.get<
    ApiEnvelope<
      Array<{
        name: string;
        description: string;
        language: string;
        stars: number;
        url: string;
        topics: string[];
      }>
    >
  >("/resumes/github/repos", { params });
  return res.data.data;
}

/** Mirrors POST /api/resume-writer/optimize. */
export async function optimizeAIResume(payload: {
  resumeId?: string;
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
  saveToMongo?: boolean;
}): Promise<any> {
  const res = await apiClient.post<ApiEnvelope<any>>(
    "/resume-writer/optimize",
    payload
  );
  return res.data.data;
}
