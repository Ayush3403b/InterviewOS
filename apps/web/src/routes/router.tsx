import { createBrowserRouter } from "react-router-dom";

import {
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "../features/auth";

import LandingPage from "../pages/LandingPage";
import DashboardPage from "../pages/DashboardPage";
import InterviewSessionPage from "../pages/InterviewSessionPage";
import ResumePage from "../pages/ResumePage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { PublicReportPage } from "../pages/PublicReportPage";
import FlaggedSessionsPage from "../pages/FlaggedSessionsPage";
import ProctoringSessionDetailPage from "../pages/ProctoringSessionDetailPage";
import TestsPage from "../pages/TestsPage";
import TestEditorPage from "../pages/TestEditorPage";
import TestResultsPage from "../pages/TestResultsPage";
import TestAttemptReviewPage from "../pages/TestAttemptReviewPage";
import TakeTestPage from "../pages/TakeTestPage";
import NotFoundPage from "../pages/NotFoundPage";

import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/report/share/:shareToken", element: <PublicReportPage /> },

  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  {
    path: "/forgot-password",
    element: (
      <PublicOnlyRoute>
        <ForgotPasswordPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <PublicOnlyRoute>
        <ResetPasswordPage />
      </PublicOnlyRoute>
    ),
  },

  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/app/interviews/:id",
    element: (
      <ProtectedRoute>
        <InterviewSessionPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/app/resume",
    element: (
      <ProtectedRoute>
        <ResumePage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/app/analytics",
    element: (
      <ProtectedRoute>
        <AnalyticsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/app/proctoring/flagged",
    element: (
      <ProtectedRoute>
        <FlaggedSessionsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/app/proctoring/sessions/:id",
    element: (
      <ProtectedRoute>
        <ProctoringSessionDetailPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/app/tests",
    element: (
      <ProtectedRoute>
        <TestsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/app/tests/:id",
    element: (
      <ProtectedRoute>
        <TestEditorPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/app/tests/:id/results",
    element: (
      <ProtectedRoute>
        <TestResultsPage />
      </ProtectedRoute>
    ),
  },

  {
    path: "/app/tests/:id/results/:attemptId",
    element: (
      <ProtectedRoute>
        <TestAttemptReviewPage />
      </ProtectedRoute>
    ),
  },

  /** The link shared with candidates - signed-out visitors log in and land back here. */
  {
    path: "/app/take/:code",
    element: (
      <ProtectedRoute>
        <TakeTestPage />
      </ProtectedRoute>
    ),
  },

  { path: "*", element: <NotFoundPage /> },
]);
