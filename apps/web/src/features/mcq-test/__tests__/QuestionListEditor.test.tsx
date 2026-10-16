import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuestionListEditor } from "../components/QuestionListEditor";
import * as mcqApi from "../api";
import type { McqQuestion } from "../types";

vi.mock("../api");

const QUESTION: McqQuestion = {
  id: "q1",
  text: "What is 2 + 2?",
  options: ["3", "4", "5", "6"],
  correctOptionIndex: 1,
  explanation: "Arithmetic.",
  topic: "Math",
  difficulty: "EASY",
  points: 1,
  source: "AI_TOPICS",
};

function renderEditor(editable: boolean, onDirtyChange = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <QuestionListEditor
        testId="t1"
        questions={[QUESTION]}
        editable={editable}
        onDirtyChange={onDirtyChange}
      />
    </QueryClientProvider>
  );

  return { onDirtyChange };
}

describe("QuestionListEditor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the answer key read-only for a published test", () => {
    renderEditor(false);

    expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    expect(screen.getByText("✓ correct")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save questions/i })).not.toBeInTheDocument();
  });

  it("blocks saving while a question has an empty option, then saves the whole list", async () => {
    vi.mocked(mcqApi.replaceQuestions).mockResolvedValue({} as never);
    const { onDirtyChange } = renderEditor(true);

    fireEvent.change(screen.getByDisplayValue("6"), { target: { value: "" } });

    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Question 1 has an empty option.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save questions/i })).toBeDisabled();

    fireEvent.change(screen.getAllByPlaceholderText(/option/i)[3], {
      target: { value: "  22 " },
    });
    fireEvent.click(screen.getByRole("button", { name: /save questions/i }));

    await vi.waitFor(() =>
      expect(mcqApi.replaceQuestions).toHaveBeenCalledWith("t1", [
        expect.objectContaining({ id: "q1", options: ["3", "4", "5", "22"], correctOptionIndex: 1 }),
      ])
    );
  });

  it("flags two identical options", () => {
    renderEditor(true);

    fireEvent.change(screen.getByDisplayValue("6"), { target: { value: "4" } });

    expect(screen.getByText("Question 1 has two identical options.")).toBeInTheDocument();
  });

  it("keeps the correct answer on the same option when one above it is removed", () => {
    renderEditor(true);

    // Remove option "3" (index 0) - "4" should stay the correct one.
    fireEvent.click(screen.getAllByRole("button", { name: /remove option/i })[0]);

    const correct = screen.getByRole("radio", { checked: true });
    expect(correct.closest("li")?.querySelector("input:not([type=radio])")).toHaveValue("4");
  });
});
