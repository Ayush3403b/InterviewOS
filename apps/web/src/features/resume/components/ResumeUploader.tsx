import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";

import { getApiErrorMessage } from "../../../lib/apiClient";
import { useUploadResume } from "../useResume";
import type { ResumeAnalysis } from "../types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface ResumeUploaderProps {
  interviewSessionId?: string;
  onUploaded?: (resume: ResumeAnalysis) => void;
}

export function ResumeUploader({
  interviewSessionId,
  onUploaded,
}: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const upload = useUploadResume();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setLocalError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Please upload a PDF or DOCX file.");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setLocalError("File is too large - the limit is 5MB.");
      return;
    }

    upload.mutate(
      { file, interviewSessionId },
      { onSuccess: (resume) => onUploaded?.(resume) }
    );
  };

  const error = localError ?? (upload.isError ? getApiErrorMessage(upload.error) : null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
        className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-signal/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {upload.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {upload.isPending ? "Analyzing resume..." : "Upload resume (PDF or DOCX)"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}

      {upload.isSuccess && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-live">
          <FileText className="h-3.5 w-3.5" />
          {upload.data.fileName} analyzed.
        </p>
      )}
    </div>
  );
}
