import { ChatCompletionRequestMessage } from "@/components/ChatBot/MessagesList";

export type AskDocQuestionResult = {
  response: string;
  relatedFiles: string[];
};

export type AskDocQuestionClientArgs = {
  messages: ChatCompletionRequestMessage[];
  discutionId?: string;
  onMessage?: (chunk: string) => void;
  onDone?: (data: AskDocQuestionResult) => void;
  onError?: (message: string) => void;
};

// Simple SSE parser for fetch-based streams
const parseSSE = (
  buffer: string,
  onEvent: (event: { event?: string; data?: string }) => void
) => {
  const events = buffer.split("\n\n");
  for (const evt of events) {
    if (!evt.trim()) continue;
    const lines = evt.split("\n");
    let eventName: string | undefined;
    let data = "";
    for (const line of lines) {
      if (line.startsWith(":")) continue; // comment
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice(5).trim();
      }
    }
    onEvent({ event: eventName, data });
  }
};

export async function askDocQuestionClient({
  messages,
  discutionId,
  onMessage,
  onDone,
  onError,
}: AskDocQuestionClientArgs) {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, discutionId }),
  });

  if (!res.body) {
    onError?.("No response body from server");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = decoder.decode(value, { stream: true });
      pending += chunkText;

      // Process only full SSE events; keep remainder in pending
      const lastDoubleNewline = pending.lastIndexOf("\n\n");
      if (lastDoubleNewline === -1) continue;
      const toProcess = pending.slice(0, lastDoubleNewline + 2);
      pending = pending.slice(lastDoubleNewline + 2);

      parseSSE(toProcess, ({ event, data }) => {
        if (!data) return;
        try {
          const parsed = JSON.parse(data);
          if (event === "error") {
            onError?.(parsed?.message ?? "Unknown error");
            return;
          }
          if (parsed.chunk) {
            onMessage?.(parsed.chunk as string);
            return;
          }
          if (parsed.done) {
            onDone?.(parsed.response as AskDocQuestionResult);
            return;
          }
        } catch (e) {
          // ignore malformed event
        }
      });
    }
  } catch (e: any) {
    onError?.(e?.message || "Stream error");
  }
}

