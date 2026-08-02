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
  
  /* --- CONTROLE DE AUTENTICAÇÃO --- */
  // Mude para `false` quando quiser voltar para o formato padrão e dinâmico.
  const USE_HARDCODED_TOKEN = true;
  
  let userSession;

  if (USE_HARDCODED_TOKEN) {
    const testToken = "EAAJMSlpnClgBSJEJ0mAE9SHViAEvV85fGXLPu1kPusPJYKQ1O6p7CoZCAtMPnrTOVNwk2AKbwTZAaDlIySkF9xZBcHtavKZACDtZCdZBa2LyVhdBvfuhIwUfaoetwSZCjHD9tWEqZBW7cmAiMACOV3tHEgSdkB1ZCaOtV9jgGxDzZCGCIaWKbaqI21bhe73Ji8FZAolPW3E2OYIrWFe6LFyoYNOugUbx2VdALdjssPkjgYywFZABSaAK6qp5Ezu6htvSx8zpxwbT07HKsSEeiPfSqeUw0mTVxAf1AWhAdZAWReAZDZD";
    userSession = { accessToken: testToken };
  } else {
    // Formato dinâmico (original):
    if (!authHeader) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Authentication required" },
        id: null
      }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
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
  }
  /* ------------------------------- */

  if (req.method === "POST") {
    let bodyText;
    try {
      bodyText = await req.text();
    } catch (e) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
        id: null
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    try {
      // Forward the JSON-RPC request to the official Meta Ads MCP server
      const metaResponse = await fetch("https://mcp.facebook.com/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userSession.accessToken}`
        },
        body: bodyText
      });
      
      const responseText = await metaResponse.text();
      
      return new Response(responseText, {
        status: metaResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: error instanceof Error ? error.message : "Unknown error connecting to Meta MCP" },
        id: null
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
