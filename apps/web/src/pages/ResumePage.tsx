import { AppLayout } from "../layouts/AppLayout";
import {
  ResumeAnalysisCard,
  ResumeUploader,
  ResumeVersionHistory,
  useMyLatestResume,
} from "../features/resume";
import { ResumeWriterTool } from "../features/resume-writer";

export default function ResumePage() {
  const resume = useMyLatestResume();

  return (
    <AppLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Resume
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Upload your resume to get an ATS-style score, skill breakdown, and
        suggestions - and to help the AI ask you more relevant questions.
      </p>

      <div className="mt-6">
        <ResumeUploader onUploaded={() => resume.refetch()} />
      </div>

      <div className="mt-6">
        {resume.isLoading && (
          <p className="text-sm text-ink-soft">Loading your resume...</p>
        )}

        {resume.isSuccess && !resume.data && (
          <p className="text-sm text-ink-soft">
            No resume uploaded yet.
          </p>
        )}

        {resume.data && <ResumeAnalysisCard resume={resume.data} />}
      </div>

      <div className="mt-6">
        <ResumeVersionHistory />
      </div>

      <div className="mt-6">
        <ResumeWriterTool currentResume={resume.data} />
      </div>
    </AppLayout>
  );
}
