import { Response } from "express";

import { BaseController } from "../../../shared/http/BaseController";
import { AuthenticatedRequest } from "../../../shared/security/AuthenticatedRequest";

import { ApiError } from "../../../shared/errors/ApiError";
import { ErrorCode } from "../../../shared/errors/ErrorCode";

import ConversationService from "../services/ConversationService";

import ConversationResponse from "../responses/ConversationResponse";

import { CreateConversationTurnDto } from "../dtos/CreateConversationTurnDto";
import { UpdateConversationTurnDto } from "../dtos/UpdateConversationTurnDto";

class ConversationController extends BaseController {
  constructor(
    private readonly conversationService: ConversationService
  ) {
    super();
  }

  /**
   * Returns authenticated user id.
   */
  private getAuthenticatedUserId(
    req: AuthenticatedRequest
  ): string {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required",
        ErrorCode.UNAUTHORIZED
      );
    }

    return userId;
  }

  /* -------------------------------------------------------------------------- */
  /*                             Create Conversation                            */
  /* -------------------------------------------------------------------------- */

  public createTurn = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    this.getAuthenticatedUserId(req);

    const conversation =
      await this.conversationService.createTurn(
        req.body as CreateConversationTurnDto
      );

    this.created(
      res,
      "Conversation turn created successfully.",
      ConversationResponse.toResponse(conversation)
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                         Get Conversation By Id                             */
  /* -------------------------------------------------------------------------- */

  public getConversationById = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    this.getAuthenticatedUserId(req);

    const conversation =
      await this.conversationService.getConversationById(
        id
      );

    this.ok(
      res,
      "Conversation fetched successfully.",
      ConversationResponse.toResponse(conversation)
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                       Get Conversation History                             */
  /* -------------------------------------------------------------------------- */

  public getConversationHistory = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    this.getAuthenticatedUserId(req);

    const conversations =
      await this.conversationService.getConversationHistory(
        sessionId
      );

    this.ok(
      res,
      "Conversation history fetched successfully.",
      ConversationResponse.toResponseList(conversations)
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                         Get Latest Conversation                            */
  /* -------------------------------------------------------------------------- */

  public getLatestTurn = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    this.getAuthenticatedUserId(req);

    const conversation =
      await this.conversationService.getLatestTurn(
        sessionId
      );

    this.ok(
      res,
      "Latest conversation fetched successfully.",
      ConversationResponse.toResponse(conversation)
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                              Count Turns                                   */
  /* -------------------------------------------------------------------------- */

  public countTurns = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    this.getAuthenticatedUserId(req);

    const totalTurns =
      await this.conversationService.countTurns(
        sessionId
      );

    this.ok(
      res,
      "Conversation turn count fetched successfully.",
      {
        sessionId,
        totalTurns,
      }
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                             Update Answer                                  */
  /* -------------------------------------------------------------------------- */

  public updateAnswer = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    this.getAuthenticatedUserId(req);

    const conversation =
      await this.conversationService.updateAnswer(
        id,
        req.body.answer,
        req.body.timeTaken
      );

    this.ok(
      res,
      "Answer updated successfully.",
      ConversationResponse.toResponse(conversation)
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Update Transcript                                */
  /* -------------------------------------------------------------------------- */

  public updateTranscript = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    this.getAuthenticatedUserId(req);

    const conversation =
      await this.conversationService.updateTranscript(
        id,
        req.body.speechTranscript
      );

    this.ok(
      res,
      "Transcript updated successfully.",
      ConversationResponse.toResponse(conversation)
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Update Conversation                              */
  /* -------------------------------------------------------------------------- */

  public updateTurn = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    this.getAuthenticatedUserId(req);

    const conversation =
      await this.conversationService.updateTurn(
        id,
        req.body as UpdateConversationTurnDto
      );

    this.ok(
      res,
      "Conversation updated successfully.",
      ConversationResponse.toResponse(conversation)
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                         Mark As Evaluated                                  */
  /* -------------------------------------------------------------------------- */

  public markEvaluated = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    this.getAuthenticatedUserId(req);

    const conversation =
      await this.conversationService.markEvaluated(
        id
      );

    this.ok(
      res,
      "Conversation marked as evaluated successfully.",
      ConversationResponse.toResponse(conversation)
    );

    return;
  };

  /* -------------------------------------------------------------------------- */
  /*                           Delete Conversation                              */
  /* -------------------------------------------------------------------------- */

  public deleteTurn = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {

    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    this.getAuthenticatedUserId(req);

    await this.conversationService.deleteTurn(id);

    this.ok(
      res,
      "Conversation deleted successfully."
    );

    return;
  };
}

export default ConversationController;