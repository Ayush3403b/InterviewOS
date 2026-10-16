import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CodeWorkspace } from "../components/CodeWorkspace";

describe("CodeWorkspace Component", () => {
  it("renders with default starter template and language selector", () => {
    render(<CodeWorkspace initialLanguage="javascript" />);

    expect(screen.getByText("Live Code Workspace")).toBeDefined();
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByPlaceholderText("Write your code implementation here...")).toBeDefined();
  });

  it("updates code when switching languages", () => {
    render(<CodeWorkspace initialLanguage="javascript" />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "python" } });

    expect(select.value).toBe("python");
    const textarea = screen.getByPlaceholderText("Write your code implementation here...") as HTMLTextAreaElement;
    expect(textarea.value).toContain("def solution(data):");
  });

  it("invokes onInsertIntoAnswer callback when button is clicked", () => {
    const onInsert = vi.fn();
    render(<CodeWorkspace initialLanguage="javascript" onInsertIntoAnswer={onInsert} />);

    const insertBtn = screen.getByText("Insert into Answer");
    fireEvent.click(insertBtn);

    expect(onInsert).toHaveBeenCalledWith(expect.stringContaining("```javascript"));
  });
});
