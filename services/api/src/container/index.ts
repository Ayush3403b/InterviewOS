import { UserRepository } from "../modules/users/repositories/UserRepository";
import { UserService } from "../modules/users/services/UserService";
import UserController from "../modules/users/controllers/UserController";

import { AuthService } from "../modules/auth/services/AuthService";
import AuthController from "../modules/auth/controllers/AuthController";
import { NodemailerService } from "../shared/mail";
import { RefreshTokenRepository } from "../modules/auth/repositories/RefreshTokenRepository";
import { SessionService } from "../modules/auth/services/SessionService";

import { RefreshTokenService } from "../modules/auth/services/RefreshTokenService";

import { PermissionService } from "../modules/authorization/services/PermissionService";

import OrganizationRepository from "../modules/organization/repositories/OrganizationRepository";

import OrganizationService from "../modules/organization/services/OrganizationService";

import OrganizationController from "../modules/organization/controllers/OrganizationController";

import { InterviewSessionRepository } from "../modules/interview-session/repositories/InterviewSessionRepository";
import InterviewSessionService from "../modules/interview-session/services/InterviewSessionService";
import InterviewSessionController from "../modules/interview-session/controllers/InterviewSessionController";

import ConversationRepository from "../modules/conversation/repositories/ConversationRepository";
import ConversationService from "../modules/conversation/services/ConversationService";
import ConversationController from "../modules/conversation/controllers/ConversationController";

import { EvaluationRepository } from "../modules/evaluation/repositories/EvaluationRepository";
import EvaluationService  from "../modules/evaluation/services/EvaluationService";
import EvaluationController  from "../modules/evaluation/controllers/EvaluationController";

import { aiConfig, getProviderCredentials } from "../config/ai.config";
import { ILLMClient } from "../agents/llm/ILLMClient";
import { ClaudeClient } from "../agents/llm/clients/ClaudeClient";
import { OpenAIClient } from "../agents/llm/clients/OpenAIClient";
import { GeminiClient } from "../agents/llm/clients/GeminiClient";
import { FallbackLLMClient } from "../agents/llm/FallbackLLMClient";
import { PersistingLLMClient } from "../agents/llm/PersistingLLMClient";
import { LLMEvaluationAgent } from "../agents/evaluation/LLMEvaluationAgent";
import { MockEvaluationAgent } from "../agents/evaluation/MockEvaluationAgent";
import { IEvaluationAgent } from "../agents/evaluation/IEvaluationAgent";

import { LLMQuestionAgent } from "../agents/question/LLMQuestionAgent";
import { MockQuestionAgent } from "../agents/question/MockQuestionAgent";
import { IQuestionAgent } from "../agents/question/IQuestionAgent";

import { LLMConversationAgent } from "../agents/conversation/LLMConversationAgent";
import { MockConversationAgent } from "../agents/conversation/MockConversationAgent";
import { IConversationAgent } from "../agents/conversation/IConversationAgent";

import { RulePlannerAgent } from "../agents/planner/RulePlannerAgent";

import { LLMResumeAgent } from "../agents/resume/LLMResumeAgent";
import { MockResumeAgent } from "../agents/resume/MockResumeAgent";
import { IResumeAgent } from "../agents/resume/IResumeAgent";

import { LLMCoachAgent } from "../agents/coach/LLMCoachAgent";
import { MockCoachAgent } from "../agents/coach/MockCoachAgent";
import { ICoachAgent } from "../agents/coach/ICoachAgent";

import { CoachingPlanRepository } from "../modules/coach/repositories/CoachingPlanRepository";
import CoachService from "../modules/coach/services/CoachService";
import CoachController from "../modules/coach/controllers/CoachController";

import { IResumeWriterAgent } from "../agents/resume-writer/IResumeWriterAgent";
import { LLMResumeWriterAgent } from "../agents/resume-writer/LLMResumeWriterAgent";
import { MockResumeWriterAgent } from "../agents/resume-writer/MockResumeWriterAgent";
import ResumeWriterService from "../modules/resume-writer/services/ResumeWriterService";
import ResumeWriterController from "../modules/resume-writer/controllers/ResumeWriterController";

import { LLMMcqAgent } from "../agents/mcq/LLMMcqAgent";
import { MockMcqAgent } from "../agents/mcq/MockMcqAgent";
import { IMcqAgent } from "../agents/mcq/IMcqAgent";

import { LLMReportAgent } from "../agents/report/LLMReportAgent";
import { MockReportAgent } from "../agents/report/MockReportAgent";
import { IReportAgent } from "../agents/report/IReportAgent";

import { ReportRepository } from "../modules/report/repositories/ReportRepository";
import ReportService from "../modules/report/services/ReportService";
import ReportController from "../modules/report/controllers/ReportController";

import { ResumeRepository } from "../modules/resume/repositories/ResumeRepository";
import ResumeService from "../modules/resume/services/ResumeService";
import ResumeController from "../modules/resume/controllers/ResumeController";

import { AiCallLogRepository } from "../modules/ai-usage/repositories/AiCallLogRepository";
import AiUsageService from "../modules/ai-usage/services/AiUsageService";
import { AiUsageAlertService } from "../modules/ai-usage/services/AiUsageAlertService";
import AiUsageController from "../modules/ai-usage/controllers/AiUsageController";
import TelemetryController from "../modules/telemetry/controllers/TelemetryController";

import { InterviewContextRepository } from "../modules/interview-context/repositories/InterviewContextRepository";
import InterviewContextService from "../modules/interview-context/services/InterviewContextService";
import InterviewContextController from "../modules/interview-context/controllers/InterviewContextController";

import { InterviewOrchestrator } from "../modules/orchestrator/services/InterviewOrchestrator";
import OrchestratorController from "../modules/orchestrator/controllers/OrchestratorController";

import { ProctoringSessionRepository } from "../modules/proctoring/repositories/ProctoringSessionRepository";
import { ProctoringEventRepository } from "../modules/proctoring/repositories/ProctoringEventRepository";
import ProctoringService from "../modules/proctoring/services/ProctoringService";
import ProctoringController from "../modules/proctoring/controllers/ProctoringController";
import { ProctoredSubjectType } from "../modules/proctoring/types/proctoring.types";

import { McqTestRepository } from "../modules/mcq-test/repositories/McqTestRepository";
import { McqAttemptRepository } from "../modules/mcq-test/repositories/McqAttemptRepository";
import McqTestService from "../modules/mcq-test/services/McqTestService";
import McqAttemptService from "../modules/mcq-test/services/McqAttemptService";
import McqTestController from "../modules/mcq-test/controllers/McqTestController";
import McqAttemptController from "../modules/mcq-test/controllers/McqAttemptController";

import { AuditLogRepository } from "../modules/audit-log/repositories/AuditLogRepository";
import AuditLogService from "../modules/audit-log/services/AuditLogService";
import AuditLogController from "../modules/audit-log/controllers/AuditLogController";

import { RuleBasedProctoringAgent } from "../agents/proctoring/RuleBasedProctoringAgent";

import { createStorageProvider } from "../config/storage.config";
import CodeSandboxService from "../modules/coding/services/CodeSandboxService";
import CodingController from "../modules/coding/controllers/CodingController";

const userRepository = new UserRepository();

const refreshTokenRepository =
  new RefreshTokenRepository();

const organizationRepository =
  new OrganizationRepository(); 
  
const interviewSessionRepository =
  new InterviewSessionRepository(); 

const storageProvider = createStorageProvider();
const codeSandboxService = new CodeSandboxService();
const codingController = new CodingController(codeSandboxService);
const conversationRepository =
  new ConversationRepository();  

const evaluationRepository =
  new EvaluationRepository();  

const aiCallLogRepository =
  new AiCallLogRepository();

const aiUsageService =
  new AiUsageService(aiCallLogRepository);

const interviewContextRepository =
  new InterviewContextRepository();

const resumeRepository =
  new ResumeRepository();

const coachingPlanRepository =
  new CoachingPlanRepository();

const reportRepository =
  new ReportRepository();

const mcqTestRepository =
  new McqTestRepository();

const mcqAttemptRepository =
  new McqAttemptRepository();

/**
 * Builds the ILLMClient for a single real provider. Purely local wiring
 * logic (not a factory module) - this is what "DI instead of a factory"
 * means in practice: the container constructs the graph directly.
 *
 * Every real client is wrapped in PersistingLLMClient so every AI call -
 * whichever agent makes it - is recorded for cost tracking, before any
 * fallback chaining happens around it.
 */
function buildLlmClient(
  provider: "claude" | "openai" | "gemini"
): ILLMClient {
  const credentials = getProviderCredentials(provider);

  let client: ILLMClient;

  switch (provider) {
    case "claude":
      client = new ClaudeClient({ ...credentials, retry: aiConfig.retry });
      break;
    case "openai":
      client = new OpenAIClient({ ...credentials, retry: aiConfig.retry });
      break;
    case "gemini":
      client = new GeminiClient({ ...credentials, retry: aiConfig.retry });
      break;
  }

  return new PersistingLLMClient(client, aiUsageService);
}

/**
 * Shared "primary provider + optional fallback chain" resolution used
 * by every LLM-backed agent (evaluation, question, conversation).
 * Returns null when the configured provider is "mock" so each agent
 * builder can fall back to its own Mock implementation.
 */
function resolvePrimaryLlmClient(): ILLMClient | null {
  if (aiConfig.primaryProvider === "mock") {
    return null;
  }

  const clients = [aiConfig.primaryProvider, ...aiConfig.fallbackProviders].map(
    buildLlmClient
  );

  return clients.length > 1 ? new FallbackLLMClient(clients) : clients[0];
}

/**
 * Provider (and optional fallback chain) chosen by AI_EVALUATION_PROVIDER
 * / AI_FALLBACK_PROVIDERS in .env. Nothing else in the app has to change
 * to switch providers or add a fallback - only this wiring.
 */
function buildEvaluationAgent(): IEvaluationAgent {
  const llmClient = resolvePrimaryLlmClient();

  if (!llmClient) {
    return new MockEvaluationAgent();
  }

  return new LLMEvaluationAgent(llmClient, {
    validationRetryAttempts: aiConfig.validationRetryAttempts,
  });
}

/**
 * Same pattern as buildEvaluationAgent - one primary+fallback client
 * chain, shared across every LLM-backed agent so switching providers
 * in .env changes all of them at once.
 */
function buildQuestionAgent(): IQuestionAgent {
  const llmClient = resolvePrimaryLlmClient();

  if (!llmClient) {
    return new MockQuestionAgent();
  }

  return new LLMQuestionAgent(llmClient, {
    validationRetryAttempts: aiConfig.validationRetryAttempts,
  });
}

function buildConversationAgent(): IConversationAgent {
  const llmClient = resolvePrimaryLlmClient();

  if (!llmClient) {
    return new MockConversationAgent();
  }

  return new LLMConversationAgent(llmClient, {
    validationRetryAttempts: aiConfig.validationRetryAttempts,
  });
}

function buildResumeAgent(): IResumeAgent {
  const llmClient = resolvePrimaryLlmClient();

  if (!llmClient) {
    return new MockResumeAgent();
  }

  return new LLMResumeAgent(llmClient, {
    validationRetryAttempts: aiConfig.validationRetryAttempts,
  });
}

function buildCoachAgent(): ICoachAgent {
  const llmClient = resolvePrimaryLlmClient();

  if (!llmClient) {
    return new MockCoachAgent();
  }

  return new LLMCoachAgent(llmClient, {
    validationRetryAttempts: aiConfig.validationRetryAttempts,
  });
}

function buildResumeWriterAgent(): IResumeWriterAgent {
  const llmClient = resolvePrimaryLlmClient();

  if (!llmClient) {
    return new MockResumeWriterAgent();
  }

  return new LLMResumeWriterAgent(llmClient, {
    validationRetryAttempts: aiConfig.validationRetryAttempts,
  });
}

function buildReportAgent(): IReportAgent {
  const llmClient = resolvePrimaryLlmClient();

  if (!llmClient) {
    return new MockReportAgent();
  }

  return new LLMReportAgent(llmClient, {
    validationRetryAttempts: aiConfig.validationRetryAttempts,
  });
}

function buildMcqAgent(): IMcqAgent {
  const llmClient = resolvePrimaryLlmClient();

  if (!llmClient) {
    return new MockMcqAgent();
  }

  return new LLMMcqAgent(llmClient, {
    validationRetryAttempts: aiConfig.validationRetryAttempts,
  });
}

const evaluationAgent = buildEvaluationAgent();
const questionAgent = buildQuestionAgent();
const conversationAgent = buildConversationAgent();
const resumeAgent = buildResumeAgent();
const coachAgent = buildCoachAgent();

const resumeWriterAgent = buildResumeWriterAgent();
const reportAgent = buildReportAgent();
const mcqAgent = buildMcqAgent();
const plannerAgent = new RulePlannerAgent();

const proctoringSessionRepository =
  new ProctoringSessionRepository();

const proctoringEventRepository =
  new ProctoringEventRepository();

const auditLogRepository =
  new AuditLogRepository();

/**
 * Swap this for a smarter agent (or a CompositeProctoringAgent
 * combining several) as tracking needs grow - nothing else here
 * has to change.
 */
const proctoringAgent =
  new RuleBasedProctoringAgent();

/**
 * Services
 */
const userService =
  new UserService(userRepository);

const emailService =
  new NodemailerService();

const refreshTokenService =
  new RefreshTokenService(
    refreshTokenRepository
  );

const sessionService =
  new SessionService(
    refreshTokenService
  );  

const authService =
  new AuthService(
    userService,
    refreshTokenService,
    emailService
  );  

const permissionService =
  new PermissionService();   

const organizationService =
  new OrganizationService(
    organizationRepository
  ); 
  
const interviewSessionService =
  new InterviewSessionService(
    interviewSessionRepository
  ); 
  
const conversationService =
  new ConversationService(
    conversationRepository
  ); 
  
const evaluationService =
  new EvaluationService(
    evaluationRepository,
    conversationRepository,
    interviewSessionRepository,
    evaluationAgent
  );  

/**
 * How proctoring confirms who a subject's candidate is before it opens a
 * session for them - one lookup per thing that can be proctored.
 */
const proctoringService =
  new ProctoringService(
    proctoringSessionRepository,
    proctoringEventRepository,
    proctoringAgent,
    {
      [ProctoredSubjectType.INTERVIEW]: async (subjectId) => {
        const interview = await interviewSessionRepository.findById(subjectId);

        return interview ? { candidateId: interview.userId.toString() } : null;
      },
      [ProctoredSubjectType.MCQ_ATTEMPT]: async (subjectId) => {
        const attempt = await mcqAttemptRepository.findById(subjectId);

        return attempt
          ? {
              candidateId: attempt.candidateId.toString(),
              organizationId: attempt.organizationId?.toString(),
            }
          : null;
      },
    }
  );

const mcqTestService =
  new McqTestService(
    mcqTestRepository,
    mcqAttemptRepository,
    userRepository,
    mcqAgent
  );

const mcqAttemptService =
  new McqAttemptService(
    mcqAttemptRepository,
    mcqTestRepository,
    proctoringService
  );

const auditLogService =
  new AuditLogService(auditLogRepository);

const coachService =
  new CoachService(
    coachingPlanRepository,
    coachAgent,
    evaluationService,
    interviewSessionService
  );

const resumeWriterService =
  new ResumeWriterService(resumeWriterAgent, resumeRepository);

const reportService =
  new ReportService(
    reportRepository,
    reportAgent,
    evaluationService,
    interviewSessionService,
    coachService,
    userService
  );

const interviewContextService =
  new InterviewContextService(interviewContextRepository);

const resumeService =
  new ResumeService(resumeRepository, resumeAgent, interviewContextService);

const interviewOrchestrator =
  new InterviewOrchestrator(
    interviewSessionService,
    conversationService,
    interviewContextService,
    evaluationService,
    questionAgent,
    conversationAgent,
    plannerAgent,
    proctoringSessionRepository,
    resumeRepository
  );

/**
 * Controllers
 */
const userController =
  new UserController(userService);

const authController =
  new AuthController(authService, auditLogService);

const organizationController =
  new OrganizationController(
    organizationService
  );  

const interviewSessionController =
  new InterviewSessionController(
    interviewSessionService
  );
  
const conversationController =
  new ConversationController(
    conversationService
  );  

const evaluationController =
  new EvaluationController(
    evaluationService
  );  

const proctoringController =
  new ProctoringController(
    proctoringService,
    auditLogService
  );

const auditLogController =
  new AuditLogController(auditLogService);

const aiUsageAlertService =
  new AiUsageAlertService(aiCallLogRepository);

const aiUsageController =
  new AiUsageController(aiUsageService, aiUsageAlertService);

const interviewContextController =
  new InterviewContextController(interviewContextService);

const resumeController =
  new ResumeController(resumeService);

const coachController =
  new CoachController(coachService);

const resumeWriterController =
  new ResumeWriterController(resumeWriterService);

const reportController =
  new ReportController(reportService);

const orchestratorController =
  new OrchestratorController(interviewOrchestrator);

const telemetryController =
  new TelemetryController();

const mcqTestController =
  new McqTestController(mcqTestService, mcqAttemptService);

const mcqAttemptController =
  new McqAttemptController(mcqAttemptService);

export {
  userRepository,

  userService,

  authService,

  userController,

  authController,

  emailService,

  refreshTokenRepository,

  refreshTokenService,

  sessionService,

  permissionService,

  organizationRepository,

  organizationService,

  organizationController,

  interviewSessionRepository,

  interviewSessionService,

  interviewSessionController,

  conversationRepository,

  conversationService,

  conversationController,

  evaluationRepository,

  evaluationService,

  evaluationController,

  proctoringSessionRepository,

  proctoringEventRepository,

  proctoringService,

  proctoringController,

  auditLogRepository,

  auditLogService,

  auditLogController,

  aiCallLogRepository,

  aiUsageService,

  aiUsageAlertService,

  aiUsageController,

  interviewContextRepository,

  interviewContextService,

  interviewContextController,

  interviewOrchestrator,

  orchestratorController,

  resumeRepository,

  resumeService,

  resumeController,

  coachingPlanRepository,

  coachService,

  coachController,

  resumeWriterService,

  resumeWriterController,

  reportRepository,

  reportService,

  reportController,

  telemetryController,

  storageProvider,

  codeSandboxService,

  codingController,

  mcqTestRepository,

  mcqAttemptRepository,

  mcqTestService,

  mcqAttemptService,

  mcqTestController,

  mcqAttemptController,
};