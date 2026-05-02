import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerCampaignResources(
  server: McpServer,
  metaClient: any
) {
  // Campaign Data Resource
  server.resource(
    "campaign-data",
    new ResourceTemplate("meta://campaigns/{account_id}", { list: undefined }),
    async (uri: any, { account_id }: any) => {
      try {
        const client = await metaClient;
        const result = await client.getCampaigns(account_id as string, {
          limit: 100,
          fields: [
            "id",
            "name",
            "status",
            "objective",
            "daily_budget",
            "lifetime_budget",
            "start_time",
            "stop_time",
          ],
        });

        const campaignSummary = {
          account_id,
          total_campaigns: result.data.length,
          active_campaigns: result.data.filter((c: any) => c.status === "ACTIVE")
            .length,
          paused_campaigns: result.data.filter((c: any) => c.status === "PAUSED")
            .length,
          campaigns: result.data.map((campaign: any) => ({
            id: campaign.id,
            name: campaign.name,
            objective: campaign.objective,
            status: campaign.status,
            budget: campaign.daily_budget
              ? `${campaign.daily_budget} (Daily)`
              : campaign.lifetime_budget
              ? `${campaign.lifetime_budget} (Lifetime)`
              : "Not set",
          })),
        };

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(campaignSummary, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  error: "Failed to fetch campaign data",
                  message: errorMessage,
                  account_id,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  // Campaign Detailed Overview Resource
  server.resource(
    "campaign-overview",
    new ResourceTemplate("meta://campaign-overview/{account_id}", {
      list: undefined,
    }),
    async (uri: any, { account_id }: any) => {
      try {
        const client = await metaClient;
        const result = await client.getCampaigns(account_id as string, {
          limit: 200,
          fields: [
            "id",
            "name",
            "status",
            "effective_status",
            "objective",
            "daily_budget",
            "lifetime_budget",
            "buying_type",
            "bid_strategy",
          ],
        });

        const statusBreakdown = result.data.reduce((acc: any, campaign: any) => {
          const status = campaign.effective_status || campaign.status;
          if (!acc[status]) {
            acc[status] = {
              count: 0,
              campaigns: [],
              total_daily_budget: 0,
              total_lifetime_budget: 0,
            };
          }
          acc[status].count++;
          acc[status].campaigns.push({
            id: campaign.id,
            name: campaign.name,
            objective: campaign.objective,
          });

          if (campaign.daily_budget) {
            acc[status].total_daily_budget += parseFloat(campaign.daily_budget);
          }
          if (campaign.lifetime_budget) {
            acc[status].total_lifetime_budget += parseFloat(
              campaign.lifetime_budget
            );
          }

          return acc;
        }, {} as any);

        const overview = {
          account_id,
          total_campaigns: result.data.length,
          status_breakdown: statusBreakdown,
          objectives_breakdown: result.data.reduce((acc: any, campaign: any) => {
            acc[campaign.objective] = (acc[campaign.objective] || 0) + 1;
            return acc;
          }, {} as any),
          budget_summary: {
            total_daily_budget: result.data.reduce(
              (sum: any, c: any) => sum + parseFloat(c.daily_budget || "0"),
              0
            ),
            total_lifetime_budget: result.data.reduce(
              (sum: any, c: any) => sum + parseFloat(c.lifetime_budget || "0"),
              0
            ),
          },
          last_updated: new Date().toISOString(),
        };

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(overview, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  error: "Failed to fetch campaign overview data",
                  message: errorMessage,
                  account_id,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  // Campaign Ad Sets Resource
  server.resource(
    "campaign-ad-sets",
    new ResourceTemplate("meta://campaign/{campaign_id}/ad-sets", {
      list: undefined,
    }),
    async (uri: any, { campaign_id }: any) => {
      try {
        const client = await metaClient;
        const result = await client.getAdSets({
          campaignId: campaign_id as string,
          limit: 100,
        });

        const adSetSummary = {
          campaign_id,
          total_ad_sets: result.data.length,
          active_ad_sets: result.data.filter((as: any) => as.status === "ACTIVE")
            .length,
          paused_ad_sets: result.data.filter((as: any) => as.status === "PAUSED")
            .length,
          ad_sets: result.data.map((adSet: any) => ({
            id: adSet.id,
            name: adSet.name,
            status: adSet.status,
            effective_status: adSet.effective_status,
            daily_budget: adSet.daily_budget,
            lifetime_budget: adSet.lifetime_budget,
            optimization_goal: adSet.optimization_goal,
            billing_event: adSet.billing_event,
          })),
          budget_breakdown: {
            total_daily_budget: result.data.reduce(
              (sum: any, as: any) => sum + parseFloat(as.daily_budget || "0"),
              0
            ),
            total_lifetime_budget: result.data.reduce(
              (sum: any, as: any) => sum + parseFloat(as.lifetime_budget || "0"),
              0
            ),
          },
          last_updated: new Date().toISOString(),
        };

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(adSetSummary, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  error: "Failed to fetch campaign ad sets data",
                  message: errorMessage,
                  campaign_id,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );
}
