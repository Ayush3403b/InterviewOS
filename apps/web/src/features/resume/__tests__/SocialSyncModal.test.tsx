import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SocialSyncModal } from "../components/SocialSyncModal";

describe("SocialSyncModal", () => {
  it("renders GitHub and LinkedIn sync tabs when open", () => {
    render(
      <SocialSyncModal
        isOpen={true}
        onClose={vi.fn()}
        onImportSuccess={vi.fn()}
      />
    );

    expect(screen.getByText("Sync Candidate Profile")).toBeTruthy();
    expect(screen.getByText("GitHub Sync")).toBeTruthy();
    expect(screen.getByText("LinkedIn Sync")).toBeTruthy();
    expect(screen.getByPlaceholderText("e.g. torvalds or octocat")).toBeTruthy();
  });

  it("switches tabs to LinkedIn when clicked", () => {
    render(
      <SocialSyncModal
        isOpen={true}
        onClose={vi.fn()}
        onImportSuccess={vi.fn()}
      />
    );

    const linkedInTab = screen.getByText("LinkedIn Sync");
    fireEvent.click(linkedInTab);

    expect(
      screen.getByPlaceholderText(
        "Paste your LinkedIn 'About', 'Experience', and 'Skills' text or JSON export..."
      )
    ).toBeTruthy();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <SocialSyncModal
        isOpen={false}
        onClose={vi.fn()}
        onImportSuccess={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
