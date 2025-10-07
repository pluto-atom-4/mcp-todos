import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {z, type ZodRawShape} from "zod";

const app = new Hono();

// Enable CORS for all routes
app.use("/*", cors());

// Create MCP server instance
const mcpServer = new McpServer({
  name: "todo-mcp-server",
  version: "1.0.0",
});

// Register tools with the MCP server
async function addTodoItem(title: string) {
  try {
    const response = await fetch("http://localhost:8080/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: title }),
    });
    if (!response.ok) {
      console.error(
        `[addTodoItem] APIサーバーからエラー: ${response.status} ${response.statusText}`
      );
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error("[addTodoItem] fetchでエラー:", err);
    return null;
  }
}

async function deleteTodoItem(id: number) {
  try {
    console.log("[deleteTodoItem] ID:", id);
    const response = await fetch(`http://localhost:8080/todos/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      console.error(
        `[deleteTodoItem] APIサーバーからエラー: ${response.status} ${response.statusText}`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[deleteTodoItem] fetchでエラー:", err);
    return false;
  }
}

async function updateTodoItem(id: string, completed: boolean) {
  try {
    const response = await fetch(`http://localhost:8080/todos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed }),
    });
    if (!response.ok) {
      console.error(
        `[updateTodoItem] APIサーバーからエラー: ${response.status} ${response.statusText}`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[updateTodoItem] fetchでエラー:", err);
    return false;
  }
}

const addTodoParams: ZodRawShape = {
  title: z.string().min(1).describe("Title for new Todo"),
};

mcpServer.tool(
  "addTodoItem",
  "Add a new todo item",
  addTodoParams,
  async ({ title }) => {
    await addTodoItem(title);
    return {
      content: [
        {
          type: "text",
          text: `${title}を追加しました`,
        },
      ],
    };
  }
);

const deleteTodoParams: ZodRawShape = {
  id: z.number().describe("ID of the Todo to delete"),
};

mcpServer.tool(
  "deleteTodoItem",
  "Delete a todo item",
  deleteTodoParams,
  async ({ id }) => {
    console.log("[deleteTodoItem] ID:", id);
    await deleteTodoItem(id);
    return {
      content: [
        {
          type: "text",
          text: `${id}を削除しました`,
        },
      ],
    };
  }
);

const updateTodoParams: ZodRawShape = {
  id: z.number().describe("ID of the Todo to update"),
  completed: z.boolean().describe("Completion status of the Todo"),
};

mcpServer.tool(
  "updateTodoItem",
  "Update a todo item",
  updateTodoParams,
  async ({ id, completed }) => {
    await updateTodoItem(id, completed);
    return {
      content: [
        {
          type: "text",
          text: `${id}を更新しました`,
        },
      ],
    };
  }
);

// Create a simple wrapper for the MCP server to handle HTTP requests
class HttpMcpTransport {
  private mcpServer: McpServer;

  constructor(mcpServer: McpServer) {
    this.mcpServer = mcpServer;
  }

  async handleRequest(request: any): Promise<any> {
    // This is a simplified transport that routes requests to the MCP server
    // In a real implementation, this would handle the full transport protocol

    if (request.method === "initialize") {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: "todo-mcp-server",
            version: "1.0.0"
          }
        }
      };
    }

    if (request.method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: [
            {
              name: "addTodoItem",
              description: "Add a new todo item",
              inputSchema: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Title for new Todo" }
                },
                required: ["title"]
              }
            },
            {
              name: "deleteTodoItem",
              description: "Delete a todo item",
              inputSchema: {
                type: "object",
                properties: {
                  id: { type: "number", description: "ID of the Todo to delete" }
                },
                required: ["id"]
              }
            },
            {
              name: "updateTodoItem",
              description: "Update a todo item",
              inputSchema: {
                type: "object",
                properties: {
                  id: { type: "number", description: "ID of the Todo to update" },
                  completed: { type: "boolean", description: "Completion status" }
                },
                required: ["id", "completed"]
              }
            }
          ]
        }
      };
    }

    if (request.method === "tools/call") {
      const { name, arguments: args } = request.params;

      if (name === "addTodoItem") {
        await addTodoItem(args.title);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: [{ type: "text", text: `${args.title}を追加しました` }]
          }
        };
      }

      if (name === "deleteTodoItem") {
        await deleteTodoItem(args.id);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: [{ type: "text", text: `${args.id}を削除しました` }]
          }
        };
      }

      if (name === "updateTodoItem") {
        await updateTodoItem(args.id, args.completed);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            content: [{ type: "text", text: `${args.id}を更新しました` }]
          }
        };
      }
    }

    return {
      jsonrpc: "2.0",
      id: request.id,
      error: { code: -32601, message: "Method not found" }
    };
  }
}

const transport = new HttpMcpTransport(mcpServer);

// SSE endpoint for MCP protocol
app.get("/sse", async (c) => {
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send initial server info
        const serverInfo = {
          jsonrpc: "2.0",
          method: "server/info",
          params: {
            name: "todo-mcp-server",
            version: "1.0.0",
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            }
          }
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(serverInfo)}\n\n`));

        // Keep connection alive
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`data: {"type":"ping"}\n\n`));
          } catch (error) {
            clearInterval(keepAlive);
          }
        }, 30000);

        // Cleanup after 5 minutes
        setTimeout(() => {
          clearInterval(keepAlive);
          try {
            controller.close();
          } catch (error) {
            // Connection already closed
          }
        }, 300000);
      }
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    }
  );
});

// MCP registration endpoint that clients expect
app.post("/sse/register", async (c) => {
  console.log("Registration request received");
  return c.json({
    jsonrpc: "2.0",
    result: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      serverInfo: {
        name: "todo-mcp-server",
        version: "1.0.0"
      }
    }
  });
});

// Additional endpoints for different transport types
app.options("/sse", async (c) => {
  return c.body(null, 200);
});

app.options("/sse/register", async (c) => {
  return c.body(null, 200);
});

// Handle different HTTP methods for the SSE endpoint
app.all("/sse/*", async (c) => {
  console.log(`Request to ${c.req.path} with method ${c.req.method}`);

  if (c.req.method === "POST") {
    try {
      const request = await c.req.json();
      console.log("Received MCP request:", request);

      const response = await transport.handleRequest(request);
      return c.json(response);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      return c.json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: "Internal error" }
      }, 500);
    }
  }

  return c.json({ error: "Method not allowed" }, 405);
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", server: "todo-mcp-server", version: "1.0.0" });
});

serve({
  fetch: app.fetch,
  port: 3001,
});

console.log("[MCP] サーバーがポート3001で起動しました");
