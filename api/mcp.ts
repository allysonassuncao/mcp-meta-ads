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
  // If it's a POST and doesn't explicitly ask for SSE, handle it as a standard JSON-RPC request
  if (req.method === "POST" && !acceptHeader.includes("text/event-stream")) {
    try {
      const body = await req.json();
      const server = new McpServer({
        name: "meta-ads-mcp",
        version: "1.7.0",
      });

      const metaClientPromise = (async () => {
        if (!authHeader) {
          throw new Error("Authentication required: Missing Authorization header.");
        }
        const user = await UserAuthManager.authenticateUser(authHeader);
        if (!user) {
          throw new Error("Invalid authentication token.");
        }
        const auth = UserAuthManager.createAuthManagerFromSession(user);
        return new MetaApiClient(auth);
      })();

      setupServer(server, metaClientPromise);

      // Execute the request directly through the MCP SDK's internal server
      const response = await (server as any).server.handleRequest(body);
      
      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: error instanceof Error ? error.message : "Unknown error" },
        id: null
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 2. Handle Standard MCP (SSE mode) via Vercel Adapter
  return createMcpHandler(
    (server) => {
      const metaClientPromise = (async () => {
        if (!authHeader) {
          throw new Error("Authentication required: Missing Authorization header.");
        }
        const user = await UserAuthManager.authenticateUser(authHeader);
        if (!user) {
          throw new Error("Invalid authentication token.");
        }
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
};

export { handler as GET, handler as POST };
