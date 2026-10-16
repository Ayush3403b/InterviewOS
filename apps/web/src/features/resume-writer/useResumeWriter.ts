import { useMutation } from "@tanstack/react-query";

import {
  checkGrammar,
  exportResumePdf,
  matchJobDescription,
  rewriteText,
} from "./api";
import type { ExportResumeDto } from "./types";

export function useGrammarCheck() {
  return useMutation({
    mutationFn: (text: string) => checkGrammar(text),
  });
}

export function useRewrite() {
  return useMutation({
    mutationFn: (args: { text: string; targetRole?: string }) =>
      rewriteText(args.text, args.targetRole),
  });
}

export function useJDMatch() {
  return useMutation({
    mutationFn: (args: {
      resumeText: string;
      jobDescription: string;
      targetRole?: string;
    }) => matchJobDescription(args),
  });
}

export function useExportResumePdf() {
  return useMutation({
    mutationFn: async (data: ExportResumeDto) => {
      const blob = await exportResumePdf(data);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (data.fullName || "resume")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      link.download = `${safeName}-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
