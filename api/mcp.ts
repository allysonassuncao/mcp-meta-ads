import { createMcpHandler } from "@vercel/mcp-adapter";
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

  return createMcpHandler(
    (server) => {
      // Create a promise that resolves to the metaClient for the current user
      const metaClientPromise = (async () => {
        if (!authHeader) {
          throw new Error("Authentication required: Missing Authorization header. Please log in first.");
        }
        const user = await UserAuthManager.authenticateUser(authHeader);
        if (!user) {
          throw new Error("Invalid authentication token. Please log in again.");
        }
        const auth = await UserAuthManager.createUserAuthManager(user.userId);
        if (!auth) {
          throw new Error("Failed to initialize user authentication");
        }
        await auth.refreshTokenIfNeeded();
        return new MetaApiClient(auth);
      })();

      // Create a promise that resolves to the auth manager specifically (for OAuth tools)
      const authManagerPromise = (async () => {
        const client = await metaClientPromise;
        return client.authManager;
      })();

      // Register all tools using shared registration functions
      // These now support receiving a Promise<MetaApiClient>
      registerCampaignTools(server, metaClientPromise);
      registerAnalyticsTools(server, metaClientPromise);
      registerAudienceTools(server, metaClientPromise);
      registerCreativeTools(server, metaClientPromise);
      registerOAuthTools(server, authManagerPromise);
      
      // Register resources
      registerCampaignResources(server, metaClientPromise);
      registerInsightsResources(server, metaClientPromise);
      registerAudienceResources(server, metaClientPromise);

      // Add account discovery tool (global for current user)
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
