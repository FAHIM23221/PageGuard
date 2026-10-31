const GRAPH_VERSION = "v26.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;
const reply = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") return reply(200, {});
  if (event.httpMethod !== "POST") return reply(405, { error: "POST required" });
  try {
    const input = JSON.parse(event.body || "{}");
    const token = String(input.token || "").trim();
    if (!token || token.length > 10000) return reply(400, { error: "Access token required" });

    const callGraph = async (url: URL, accessToken = token) => {
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        const err: any = new Error(data.error?.message || `Meta API error (${response.status})`);
        err.status = response.status;
        throw err;
      }
      return data;
    };

    const pageUrl = new URL(`${GRAPH}/me/accounts`);
    pageUrl.searchParams.set("fields", "id,name,access_token,tasks");
    pageUrl.searchParams.set("limit", "100");
    const getPages = async () => (await callGraph(pageUrl)).data || [];

    if (input.action === "pages") {
      const pages = await getPages();
      return reply(200, { data: pages.map((p: any) => ({ id: p.id, name: p.name, tasks: p.tasks || [] })) });
    }

    if (input.action === "videos") {
      const pageId = String(input.pageId || "");
      if (!/^\d+$/.test(pageId)) return reply(400, { error: "Invalid Page ID" });
      const page = (await getPages()).find((p: any) => p.id === pageId);
      if (!page?.access_token) return reply(403, { error: "Page access token unavailable" });

      // Cursor is treated as an opaque Graph API paging cursor, never as a URL.
      const after = typeof input.after === "string" ? input.after : "";
      if (after.length > 2048 || /[^A-Za-z0-9_\-=]/.test(after)) {
        return reply(400, { error: "Invalid pagination cursor" });
      }
      const url = new URL(`${GRAPH}/${pageId}/videos`);
      url.searchParams.set("fields", "id,description,views,permalink_url,created_time");
      url.searchParams.set("limit", "100");
      if (after) url.searchParams.set("after", after);
      const data = await callGraph(url, page.access_token);
      return reply(200, {
        data: data.data || [],
        paging: { next: Boolean(data.paging?.next), after: data.paging?.cursors?.after || null },
      });
    }

    if (input.action === "delete") {
      return reply(423, {
        error: "Deletion is disabled until Safe Delete Center has completed verification and testing.",
        status: "READ_ONLY",
      });
    }
    return reply(400, { error: "Unsupported operation" });
  } catch (error: any) {
    const status = error.status === 403 ? 403 : 400;
    return reply(status, { error: error.message || "Request failed" });
  }
};
