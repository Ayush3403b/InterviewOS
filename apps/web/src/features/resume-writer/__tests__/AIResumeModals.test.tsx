import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AIResumeGeneratorModal } from "../components/AIResumeGeneratorModal";
import { AIResumeOptimizerModal } from "../components/AIResumeOptimizerModal";

describe("AI Resume Modals", () => {
  describe("AIResumeGeneratorModal", () => {
    it("renders generator form fields when open", () => {
      render(
        <AIResumeGeneratorModal
          isOpen={true}
          onClose={vi.fn()}
          onGenerated={vi.fn()}
        />
      );

      expect(screen.getByText("AI ATS Resume Generator")).toBeTruthy();
      expect(screen.getByPlaceholderText("e.g. Senior Backend Engineer")).toBeTruthy();
      expect(screen.getByText("Core Skills & Technologies")).toBeTruthy();
      expect(screen.getByText("GitHub Integration")).toBeTruthy();
      expect(screen.getByPlaceholderText("alexmorgan")).toBeTruthy();
      expect(screen.getByText("Generate Complete Resume")).toBeTruthy();
    });

    it("does not render when isOpen is false", () => {
      const { container } = render(
        <AIResumeGeneratorModal
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("AIResumeOptimizerModal", () => {
    it("renders optimizer inputs when open", () => {
      render(
        <AIResumeOptimizerModal
          isOpen={true}
          onClose={vi.fn()}
          resumeId="resume-123"
        />
      );

      expect(screen.getByText("AI Resume ATS Optimizer")).toBeTruthy();
      expect(screen.getByPlaceholderText("Paste the target job description to match keywords...")).toBeTruthy();
      expect(screen.getByText("Run ATS Optimization")).toBeTruthy();
    });

    it("does not render when isOpen is false", () => {
      const { container } = render(
        <AIResumeOptimizerModal
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
