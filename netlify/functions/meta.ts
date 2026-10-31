const GRAPH_VERSION = "v26.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const response = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") return response(200, {});
  if (event.httpMethod !== "POST") return response(405, { error: "POST required" });

  try {
    const input = JSON.parse(event.body || "{}");
    const token = String(input.token || "").trim();
    if (!token || token.length > 10000) return response(400, { error: "Access token required" });

    // Credentials are sent in the Authorization header, never in Graph API URLs.
    const graph = async (url: URL, accessToken = token, method = "GET") => {
      const r = await fetch(url.toString(), {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(20000),
      });
      const data = await r.json();
      if (!r.ok || data.error) {
        throw new Error(data.error?.message || `Meta API error (${r.status})`);
      }
      return data;
    };

    const pagesUrl = new URL(`${GRAPH}/me/accounts`);
    pagesUrl.searchParams.set("fields", "id,name,access_token,tasks");
    pagesUrl.searchParams.set("limit", "100");
    const getPages = async () => (await graph(pagesUrl)).data || [];

    if (input.action === "pages") {
      const pages = await getPages();
      return response(200, {
        data: pages.map((p: any) => ({ id: p.id, name: p.name, tasks: p.tasks || [] })),
      });
    }

    if (input.action === "videos") {
      const pageId = String(input.pageId || "");
      if (!/^\d+$/.test(pageId)) return response(400, { error: "Invalid Page ID" });

      const page = (await getPages()).find((p: any) => p.id === pageId);
      if (!page?.access_token) return response(403, { error: "Page access token unavailable" });

      const url = new URL(`${GRAPH}/${pageId}/videos`);
      url.searchParams.set("fields", "id,description,views,permalink_url,created_time");
      url.searchParams.set("limit", "100");
      const data = await graph(url, page.access_token);
      return response(200, {
        data: data.data || [],
        paging: data.paging || null,
        inventoryComplete: !data.paging?.next,
      });
    }

    if (input.action === "delete") {
      // Destructive operations remain disabled until the full Safe Delete Center
      // (fresh lookup, ownership verification, preview, dual confirmation,
      // queue state machine, post-delete verification and immutable audit log)
      // has been implemented and tested.
      return response(423, {
        error: "Deletion is disabled in this build. Use read-only audit until Safe Delete Center is ready.",
        status: "READ_ONLY",
      });
    }

    return response(400, { error: "Unsupported operation" });
  } catch (error: any) {
    return response(400, { error: error.message || "Request failed" });
  }
};
