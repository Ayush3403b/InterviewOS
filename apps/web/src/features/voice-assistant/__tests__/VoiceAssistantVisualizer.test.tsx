import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VoiceAssistantVisualizer } from "../VoiceAssistantVisualizer";

describe("VoiceAssistantVisualizer", () => {
  it("renders canvas element with standby status by default", () => {
    const { container } = render(<VoiceAssistantVisualizer isActive={false} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(screen.getByText("Standby")).toBeTruthy();
  });

  it("shows Mic Active indicator when microphone is listening", () => {
    render(<VoiceAssistantVisualizer isActive={true} />);
    expect(screen.getByText("Mic Active")).toBeTruthy();
  });

  it("shows AI Speaking indicator when AI is voicing responses", () => {
    render(<VoiceAssistantVisualizer isActive={false} isAiSpeaking={true} />);
    expect(screen.getByText("AI Speaking")).toBeTruthy();
  });
});
