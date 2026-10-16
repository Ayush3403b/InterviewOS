import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";
import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import ResumeService from "../services/ResumeService";
import {
  toResumeResponse,
  toResumeVersionList,
} from "../dtos/ResumeResponse";

export default class ResumeController extends BaseController {
  constructor(private readonly resumeService: ResumeService) {
    super();
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(401, "Authentication required", ErrorCode.UNAUTHORIZED);
    }

    return userId;
  }

  public upload = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);

    if (!req.file) {
      throw new ApiError(
        400,
        "No file uploaded. Attach a PDF or DOCX under the \"file\" field.",
        ErrorCode.BAD_REQUEST
      );
    }

    const interviewSessionId =
      typeof req.body.interviewSessionId === "string"
        ? req.body.interviewSessionId
        : undefined;

    const resume = await this.resumeService.uploadAndAnalyze(
      userId,
      {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
      },
      interviewSessionId
    );

    this.created(res, "Resume uploaded and analyzed.", toResumeResponse(resume));
  };

  public getMine = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);

    const resume = await this.resumeService.getLatestForUser(userId);

    this.ok(
      res,
      "Latest resume resolved.",
      resume ? toResumeResponse(resume) : null
    );
  };

  public getById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const resume = await this.resumeService.getById(id, userId);

    this.ok(res, "Resume resolved.", toResumeResponse(resume));
  };

  public listVersions = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);

    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const result = await this.resumeService.listVersions(userId, page, limit);

    this.ok(res, "Resume versions fetched.", toResumeVersionList(result));
  };

  public compareVersions = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);

    const from =
      typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;

    if (!from || !to) {
      throw new ApiError(
        400,
        "Both ?from= and ?to= resume ids are required.",
        ErrorCode.BAD_REQUEST
      );
    }

    const comparison = await this.resumeService.compareVersions(
      userId,
      from,
      to
    );

    this.ok(res, "Resume versions compared.", comparison);
  };

  public update = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const updated = await this.resumeService.updateResume(userId, id, req.body);

    this.ok(res, "Resume updated successfully.", toResumeResponse(updated));
  };

  public importGitHub = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const { username, githubToken, maxRepos } = req.body;

    if (!username || typeof username !== "string") {
      throw new ApiError(400, "GitHub username is required.", ErrorCode.BAD_REQUEST);
    }

    const resume = await this.resumeService.importGitHubProfile(userId, {
      username,
      githubToken,
      maxRepos: typeof maxRepos === "number" ? maxRepos : undefined,
    });

    this.created(res, "GitHub profile imported into resume.", toResumeResponse(resume));
  };

  public importLinkedIn = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    const userId = this.getUserId(req);
    const { profileData, rawText } = req.body;

    if (!profileData && !rawText) {
      throw new ApiError(
        400,
        "LinkedIn profileData JSON or rawText is required.",
        ErrorCode.BAD_REQUEST
      );
    }

    const resume = await this.resumeService.importLinkedInProfile(userId, {
      profileData,
      rawText,
    });

    this.created(res, "LinkedIn profile imported into resume.", toResumeResponse(resume));
  };

  public getGitHubRepos = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    this.getUserId(req);
    const username = typeof req.query.username === "string" ? req.query.username : undefined;
    const token = typeof req.query.token === "string" ? req.query.token : undefined;

    if (!username || !username.trim()) {
      throw new ApiError(400, "Query parameter 'username' is required.", ErrorCode.BAD_REQUEST);
    }

    const repos = await this.resumeService.getGitHubRepositories(username, token);

    this.ok(res, "GitHub repositories fetched.", repos);
  };
}
