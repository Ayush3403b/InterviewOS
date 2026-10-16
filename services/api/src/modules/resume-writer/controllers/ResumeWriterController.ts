import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import ResumeWriterService from "../services/ResumeWriterService";
import { ExportResumeDto } from "../../../shared/pdf/buildResumePdf";

export default class ResumeWriterController extends BaseController {
  constructor(private readonly resumeWriterService: ResumeWriterService) {
    super();
  }

  private ensureAuthenticated(req: AuthenticatedRequest): void {
    if (!req.user?.sub) {
      throw new ApiError(401, "Authentication required", ErrorCode.UNAUTHORIZED);
    }
  }

  public checkGrammar = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    this.ensureAuthenticated(req);

    const { text } = req.body as { text: string };

    const result = await this.resumeWriterService.checkGrammar(text);

    this.ok(res, "Grammar check complete.", result);
  };

  public rewrite = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    this.ensureAuthenticated(req);

    const { text, targetRole } = req.body as {
      text: string;
      targetRole?: string;
    };

    const result = await this.resumeWriterService.rewrite(text, { targetRole });

    this.ok(res, "Rewrite complete.", result);
  };

  public matchJobDescription = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    this.ensureAuthenticated(req);

    const { resumeText, jobDescription, targetRole } = req.body as {
      resumeText: string;
      jobDescription: string;
      targetRole?: string;
    };

    const result = await this.resumeWriterService.matchJobDescription(
      resumeText,
      jobDescription,
      { targetRole }
    );

    this.ok(res, "Job description match complete.", result);
  };

  public exportResumePdf = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    this.ensureAuthenticated(req);

    const resumeData = req.body as ExportResumeDto;

    const pdfBuffer = await this.resumeWriterService.exportResumePdf(resumeData);

    const safeFilename = `${(resumeData.fullName || "resume")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}-resume.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`
    );

    res.status(200).send(pdfBuffer);
  };

  public generate = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    this.ensureAuthenticated(req);
    const userId = req.user!.sub;

    const result = await this.resumeWriterService.generateResume(req.body, userId);

    this.created(res, "ATS resume generated successfully.", result);
  };

  public optimize = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    this.ensureAuthenticated(req);
    const userId = req.user!.sub;

    const result = await this.resumeWriterService.optimizeResume(userId, req.body);

    this.ok(res, "Resume optimized for ATS successfully.", result);
  };
}
