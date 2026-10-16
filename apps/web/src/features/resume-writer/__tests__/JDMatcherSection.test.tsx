import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { JDMatcherSection } from "../components/JDMatcherSection";
import * as resumeWriterApi from "../api";
import type { JDMatchResult } from "../types";

vi.mock("../api");

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockMatchResult: JDMatchResult = {
  matchScore: 82,
  targetRole: "Senior Full Stack Engineer",
  matchingKeywords: ["React", "TypeScript", "Node.js"],
  missingKeywords: ["Docker", "Kubernetes"],
  tailoredSummary:
    "Senior Full Stack Engineer with extensive experience building scalable web apps with React and TypeScript.",
  tailoredBulletPoints: [
    {
      originalBullet: "Built features with team",
      tailoredBullet:
        "Engineered mission-critical web applications utilizing React & TypeScript, boosting user throughput by 35%.",
      highlightedKeywords: ["React", "TypeScript"],
      rationale: "Quantified metric and incorporated target keywords.",
    },
  ],
  recommendations: [
    "Highlight containerization experience with Docker.",
    "Structure experience bullets with action verbs.",
  ],
};

describe("JDMatcherSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input fields and preset buttons", () => {
    renderWithClient(<JDMatcherSection />);

    expect(
      screen.getByText(/Target Job Description \(JD\) Matcher & Tailor/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Senior Full Stack")).toBeInTheDocument();
    expect(screen.getByText("Backend & Cloud")).toBeInTheDocument();
    expect(screen.getByText("Frontend Specialist")).toBeInTheDocument();
  });

  it("populates fields when a preset role button is clicked", () => {
    renderWithClient(<JDMatcherSection />);

    fireEvent.click(screen.getByText("Senior Full Stack"));

    const roleInput = screen.getByPlaceholderText(
      /Target Role Title/i
    ) as HTMLInputElement;
    expect(roleInput.value).toBe("Senior Full Stack Engineer");
  });

  it("calls matchJobDescription API and renders analysis results", async () => {
    vi.mocked(resumeWriterApi.matchJobDescription).mockResolvedValue(
      mockMatchResult
    );

    renderWithClient(
      <JDMatcherSection
        initialResumeText="Experienced developer with React, TypeScript, and Node.js skills."
      />
    );

    // Select preset to fill JD
    fireEvent.click(screen.getByText("Senior Full Stack"));

    const analyzeBtn = screen.getByRole("button", {
      name: /Analyze JD Match/i,
    });
    expect(analyzeBtn).not.toBeDisabled();

    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(resumeWriterApi.matchJobDescription).toHaveBeenCalledTimes(1);
      expect(screen.getByText("82%")).toBeInTheDocument();
      expect(screen.getByText("Strong Candidate Match")).toBeInTheDocument();
      expect(screen.getByText(/Matching Skills \(3\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Missing Key Skills \(2\)/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Engineered mission-critical web applications/i)
      ).toBeInTheDocument();
    });
  });
});
