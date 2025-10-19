import { google } from "@ai-sdk/google";
import { experimental_createMCPClient as createMcpClient, streamText } from "ai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const mcpClient = await createMcpClient({
    transport: {
      type: "sse",
      url: "http://localhost:3001/sse",
    },
  });

  const {messages} = await req.json();
  const tools = await mcpClient.tools();

  const result = streamText({
    model: google("gemini-2.0-flash-lite"),
    messages,
    tools,
    onFinish: () => {
      mcpClient.close();
    },
  });

  return result.toDataStreamResponse();
}
