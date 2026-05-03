import { createMcpHandler } from "@vercel/mcp-adapter";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MetaApiClient } from "../src/meta-client.js";
import { UserAuthManager } from "../src/utils/user-auth.js";
import { registerCampaignTools } from "../src/tools/campaigns.js";
import { registerAnalyticsTools } from "../src/tools/analytics.js";
import { registerAudienceTools } from "../src/tools/audiences.js";
import { registerCreativeTools } from "../src/tools/creatives.js";
import { registerOAuthTools } from "../src/tools/oauth.js";
import { registerCampaignResources } from "../src/resources/campaigns.js";
import { registerInsightsResources } from "../src/resources/insights.js";
import { registerAudienceResources } from "../src/resources/audiences.js";

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
  const acceptHeader = req.headers.get("accept") || "";

  // Helper to register all tools and resources to a server instance
  const setupServer = (server: any, metaClientPromise: Promise<MetaApiClient>) => {
    const authManagerPromise = (async () => {
      const client = await metaClientPromise;
      return client.authManager;
    })();

    registerCampaignTools(server, metaClientPromise);
    registerAnalyticsTools(server, metaClientPromise);
    registerAudienceTools(server, metaClientPromise);
    registerCreativeTools(server, metaClientPromise);
    registerOAuthTools(server, authManagerPromise);

    registerCampaignResources(server, metaClientPromise);
    registerInsightsResources(server, metaClientPromise);
    registerAudienceResources(server, metaClientPromise);

    server.tool("get_ad_accounts", {}, async () => {
      try {
        const client = await metaClientPromise;
        const accounts = await client.getAdAccounts();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(accounts.map(acc => ({ id: acc.id, name: acc.name })), null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }],
          isError: true
        };
      }
    });
  };

  // 1. Handle Simple POST (Postman/REST mode)
  if (req.method === "POST" && !acceptHeader.includes("text/event-stream")) {
    try {
      const body = await req.json();
      const server = new McpServer({
        name: "meta-ads-mcp",
        version: "1.7.0",
      });

      const metaClientPromise = (async () => {
        if (!authHeader) throw new Error("Authentication required");
        const user = await UserAuthManager.authenticateUser(authHeader);
        if (!user) throw new Error("Invalid token");
        return new MetaApiClient(UserAuthManager.createAuthManagerFromSession(user));
      })();

      setupServer(server, metaClientPromise);

      // Manual JSON-RPC Handling for Postman
      if (body.method === "tools/list") {
        const tools = Object.entries((server as any)._registeredTools).map(([name, tool]: [string, any]) => ({
          name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        }));

        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: { tools },
          id: body.id
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }

      if (body.method === "tools/call") {
        const toolName = body.params?.name;
        const tool = (server as any)._registeredTools[toolName];

        if (!tool) {
          throw new Error(`Tool not found: ${toolName}`);
        }

        const args = body.params?.arguments || {};
        // Auto-map ad_account_id to account_id for convenience
        if (args.ad_account_id && !args.account_id) {
          args.account_id = args.ad_account_id;
        }

        const result = await tool.handler(args);
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
      }

      // Fallback for other methods
      throw new Error(`Method ${body.method} not supported in simple POST mode. Use SSE for full protocol support.`);
    } catch (error) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: error instanceof Error ? error.message : "Unknown error" },
        id: null
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  }

  const response = await createMcpHandler(
    (server) => {
      const metaClientPromise = (async () => {
        if (!authHeader) throw new Error("Authentication required");
        const user = await UserAuthManager.authenticateUser(authHeader);
        if (!user) throw new Error("Invalid token");
        const auth = UserAuthManager.createAuthManagerFromSession(user);
        await auth.refreshTokenIfNeeded();
        return new MetaApiClient(auth);
      })();

      setupServer(server, metaClientPromise);
    },
    {},
    {
      basePath: "/api",
      maxDuration: 60,
      verboseLogs: true,
    }
  )(req);

  // Add CORS headers to the adapter response
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
};

export { handler as GET, handler as POST, handler as OPTIONS };
