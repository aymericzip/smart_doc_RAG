import { NextRequest } from "next/server";
import { askDocQuestion } from "@/utils/askDocQuestion/askDocQuestion";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { messages, discutionId } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (data: unknown) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Initial comment to establish SSE
      controller.enqueue(encoder.encode(`: connected\n\n`));

      askDocQuestion(messages, {
        onMessage: (chunk) => {
          send({ chunk });
        },
      })
        .then((fullResponse) => {
          // Optionally persist discussion based on last user message length (>2 words)
          try {
            const lastUserMessage = [...messages]
              .reverse()
              .find((m: any) => m?.role === "user");
            const wordCount = lastUserMessage?.content
              ? String(lastUserMessage.content).split(" ").length
              : 0;
            if (wordCount > 2) {
              // Persist discussion if needed
              console.log("Persisting discussion", fullResponse, discutionId);
            }
          } catch {
            // ignore persistence errors
          }

          send({ done: true, response: fullResponse });
          controller.close();
        })
        .catch((err: any) => {
          const message = err?.message ?? "Unknown error";
          const payload =
            `event: error\n` + `data: ${JSON.stringify({ message })}\n\n`;
          controller.enqueue(encoder.encode(payload));
          controller.close();
        });
    },
    cancel() {
      // no-op
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
