import { afterEach, describe, expect, it, vi } from "vitest";

import { ClaudeClient } from "../../../agents/llm/clients/ClaudeClient";
import { OpenAIClient } from "../../../agents/llm/clients/OpenAIClient";
import { GeminiClient } from "../../../agents/llm/clients/GeminiClient";
import { ApiError } from "../../../shared/errors/ApiError";

const RETRY = { maxAttempts: 2, baseDelayMs: 1 };

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("ClaudeClient", () => {

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the Anthropic messages endpoint and returns the text", async () => {

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        content: [{ type: "text", text: "hello" }],
        usage: { input_tokens: 10, output_tokens: 5 },
        model: "claude-sonnet-4-6",
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const client = new ClaudeClient({
      apiKey: "test-key",
      model: "claude-sonnet-4-6",
      retry: RETRY,
    });

    const result = await client.generate({ system: "s", prompt: "p" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.text).toBe("hello");
    expect(result.provider).toBe("claude");
    expect(result.tokensUsed).toBe(15);

  });

  it("retries once on a transient failure, then succeeds", async () => {

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false, 503))
      .mockResolvedValueOnce(
        jsonResponse({
          content: [{ type: "text", text: "recovered" }],
          model: "claude-sonnet-4-6",
        })
      );

    vi.stubGlobal("fetch", fetchMock);

    const client = new ClaudeClient({
      apiKey: "test-key",
      model: "claude-sonnet-4-6",
      retry: RETRY,
    });

    const result = await client.generate({ system: "s", prompt: "p" });

    expect(result.text).toBe("recovered");
    expect(fetchMock).toHaveBeenCalledTimes(2);

  });

  it("throws an ApiError once retries are exhausted", async () => {

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({}, false, 401))
    );

    const client = new ClaudeClient({
      apiKey: "bad-key",
      model: "claude-sonnet-4-6",
      retry: RETRY,
    });

    await expect(
      client.generate({ system: "s", prompt: "p" })
    ).rejects.toThrow(ApiError);

  });

});

describe("OpenAIClient", () => {

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the chat completions endpoint and returns the text", async () => {

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          choices: [{ message: { content: "hello" } }],
          usage: { total_tokens: 20 },
          model: "gpt-4o-mini",
        })
      )
    );

    const client = new OpenAIClient({
      apiKey: "test-key",
      model: "gpt-4o-mini",
      retry: RETRY,
    });

    const result = await client.generate({ system: "s", prompt: "p" });

    expect(result.text).toBe("hello");
    expect(result.provider).toBe("openai");
    expect(result.tokensUsed).toBe(20);

  });

});

describe("GeminiClient", () => {

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the generateContent endpoint and returns the text", async () => {

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          candidates: [{ content: { parts: [{ text: "hello" }] } }],
          usageMetadata: { totalTokenCount: 30 },
        })
      )
    );

    const client = new GeminiClient({
      apiKey: "test-key",
      model: "gemini-2.0-flash",
      retry: RETRY,
    });

    const result = await client.generate({ system: "s", prompt: "p" });

    expect(result.text).toBe("hello");
    expect(result.provider).toBe("gemini");
    expect(result.tokensUsed).toBe(30);

  });

});

describe("attachments", () => {

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const image = { mimeType: "image/png", base64: "aW1n", filename: "page.png" };
  const pdf = { mimeType: "application/pdf", base64: "cGRm", filename: "notes.pdf" };

  function sentBody(fetchMock: ReturnType<typeof vi.fn>) {
    return JSON.parse(fetchMock.mock.calls[0][1].body as string);
  }

  it("Claude sends images and PDFs as content blocks ahead of the prompt", async () => {

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ content: [{ type: "text", text: "ok" }], model: "m" })
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ClaudeClient({ apiKey: "k", model: "m", retry: RETRY }).generate({
      system: "s",
      prompt: "p",
      attachments: [image, pdf],
    });

    expect(sentBody(fetchMock).messages[0].content).toEqual([
      { type: "image", source: { type: "base64", media_type: "image/png", data: "aW1n" } },
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: "cGRm" } },
      { type: "text", text: "p" },
    ]);

  });

  it("OpenAI sends images as image_url parts and PDFs as file parts", async () => {

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "ok" } }], model: "m" })
    );
    vi.stubGlobal("fetch", fetchMock);

    await new OpenAIClient({ apiKey: "k", model: "m", retry: RETRY }).generate({
      system: "s",
      prompt: "p",
      attachments: [image, pdf],
    });

    expect(sentBody(fetchMock).messages[1].content).toEqual([
      { type: "image_url", image_url: { url: "data:image/png;base64,aW1n" } },
      {
        type: "file",
        file: { filename: "notes.pdf", file_data: "data:application/pdf;base64,cGRm" },
      },
      { type: "text", text: "p" },
    ]);

  });

  it("Gemini sends attachments as inlineData parts", async () => {

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ candidates: [{ content: { parts: [{ text: "ok" }] } }] })
    );
    vi.stubGlobal("fetch", fetchMock);

    await new GeminiClient({ apiKey: "k", model: "m", retry: RETRY }).generate({
      system: "s",
      prompt: "p",
      attachments: [pdf],
    });

    expect(sentBody(fetchMock).contents[0].parts).toEqual([
      { inlineData: { mimeType: "application/pdf", data: "cGRm" } },
      { text: "p" },
    ]);

  });

  it("keeps the plain-string message format when there are no attachments", async () => {

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ content: [{ type: "text", text: "ok" }], model: "m" })
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ClaudeClient({ apiKey: "k", model: "m", retry: RETRY }).generate({
      system: "s",
      prompt: "p",
    });

    expect(sentBody(fetchMock).messages[0].content).toBe("p");

  });

});
