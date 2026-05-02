import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerAudienceResources(
  server: McpServer,
  metaClient: any
) {
  // Audiences Overview Resource
  server.resource(
    "audiences",
    new ResourceTemplate("meta://audiences/{account_id}", { list: undefined }),
    async (uri: any, { account_id }: any) => {
      try {
        const client = await metaClient;
        const result = await client.getCustomAudiences(
          account_id as string,
          {
            limit: 100,
            fields: [
              "id",
              "name",
              "description",
              "subtype",
              "status",
              "approximate_count_upper_bound",
              "approximate_count_lower_bound",
              "time_created",
              "time_updated",
            ],
          }
        );

        const audiences = result.data.map((audience: any) => ({
          id: audience.id,
          name: audience.name,
          description: audience.description,
          type: audience.subtype,
          status: audience.status?.name || "UNKNOWN",
          approximate_count: audience.approximate_count_upper_bound,
          created: new Date(audience.time_created * 1000).toISOString(),
          updated: new Date(audience.time_updated * 1000).toISOString(),
        }));

        // Categorize audiences
        const customAudiences = audiences.filter(
          (a: any) => a.type !== "LOOKALIKE"
        );
        const lookalikeAudiences = audiences.filter(
          (a: any) => a.type === "LOOKALIKE"
        );

        const audiencesByType = audiences.reduce((acc: any, audience: any) => {
          const type = audience.type || "OTHER";
          if (!acc[type]) acc[type] = [];
          acc[type].push(audience);
          return acc;
        }, {} as any);

        const overview = {
          account_id,
          total_audiences: audiences.length,
          custom_audiences_count: customAudiences.length,
          lookalike_audiences_count: lookalikeAudiences.length,
          audiences_by_type: audiencesByType,
          health_summary: {
            ready: audiences.filter(
              (a: any) => a.status === "AVAILABLE"
            ).length,
            not_ready: audiences.filter(
              (a: any) => a.status !== "AVAILABLE"
            ).length,
          },
          audience_size_summary: {
            total_approximate_count: audiences.reduce(
              (sum: any, a: any) => sum + (a.approximate_count || 0),
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
                  error: "Failed to fetch audience data",
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

  // Audience Health Check Resource
  server.resource(
    "audience-health",
    new ResourceTemplate("meta://audience-health/{account_id}", {
      list: undefined,
    }),
    async (uri: any, { account_id }: any) => {
      try {
        const client = await metaClient;
        const result = await client.getCustomAudiences(
          account_id as string,
          {
            limit: 50,
            fields: [
              "id",
              "name",
              "description",
              "subtype",
              "status",
              "approximate_count_upper_bound",
            ],
          }
        );

        const healthDetails = result.data.map((audience: any) => {
          const size = audience.approximate_count_upper_bound || 0;
          let healthStatus = "GOOD";
          const issues = [];

          if (size < 1000) {
            healthStatus = "WARNING";
            issues.push("Audience size too small for effective targeting");
          }
          if (audience.status?.name !== "AVAILABLE") {
            healthStatus = "ERROR";
            issues.push(`Audience status is ${audience.status?.name}`);
          }

          return {
            id: audience.id,
            name: audience.name,
            status: healthStatus,
            issues,
            size,
          };
        });

        const report = {
          account_id,
          overall_health: healthDetails.every((d: any) => d.status === "GOOD")
            ? "HEALTHY"
            : "ISSUES_DETECTED",
          audience_health_details: healthDetails,
          last_updated: new Date().toISOString(),
        };

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(report, null, 2),
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
                  error: "Failed to fetch audience health data",
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
}
