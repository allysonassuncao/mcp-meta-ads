import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { UserAuthManager } from "../src/utils/user-auth.js";

const handler = async (req: Request) => {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    "https://app.usemakecrm.com.br",
    "https://usermakecrm.com.br",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8080"
  ];

  const isAllowedOrigin = origin && (allowedOrigins.includes(origin) || origin.endsWith(".usemakecrm.com.br"));

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Allow-Credentials": "true",
  };

  if (isAllowedOrigin) {
    corsHeaders["Access-Control-Allow-Origin"] = origin!;
  }

  // 0. Handle Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("authorization");
  
  if (!authHeader) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Authentication required" },
      id: null
    }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  
  let userSession;
  try {
    userSession = await UserAuthManager.authenticateUser(authHeader);
    if (!userSession) throw new Error("Invalid token");
  } catch (error) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: error instanceof Error ? error.message : "Invalid token" },
      id: null
    }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    try {
      // Create a transport to connect to the official Meta Ads MCP server
      const transport = new SSEClientTransport(
        new URL("https://mcp.facebook.com/ads"),
        {
          headers: {
            "Authorization": `Bearer ${userSession.accessToken}`
          }
        }
      );
      
      const client = new Client(
        { name: "meta-ads-mcp-proxy", version: "1.0.0" },
        { capabilities: {} }
      );
      
      await client.connect(transport);
      
      let result;
      if (body.method === "tools/list") {
        result = await client.listTools();
      } else if (body.method === "tools/call") {
        result = await client.callTool({
          name: body.params.name,
          arguments: body.params.arguments || {}
        });
      } else if (body.method === "resources/list") {
        result = await client.listResources();
      } else if (body.method === "resources/read") {
        result = await client.readResource({
          uri: body.params.uri
        });
      } else if (body.method === "prompts/list") {
        result = await client.listPrompts();
      } else if (body.method === "prompts/get") {
        result = await client.getPrompt({
          name: body.params.name,
          arguments: body.params.arguments
        });
      } else {
        throw new Error(`Method ${body.method} not supported by this proxy.`);
      }
      
      await transport.close();
      
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        result,
        id: body.id
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: error instanceof Error ? error.message : "Unknown error connecting to Meta MCP" },
        id: body.id || null
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  }

  // Fallback for GET or other methods
  return new Response("Meta Ads MCP Proxy Server is running. Send JSON-RPC requests via POST.", {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain"
    }
  });
};

export { handler as GET, handler as POST, handler as OPTIONS };
