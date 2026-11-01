
import { useMemo, useState } from "react";
import {
  Shield,
  KeyRound,
  RefreshCw,
  Download,
  Video,
  Search,
  Eye,
  PlayCircle,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { mergeVideoPages, type VideoRecord } from "./core/inventory";

type Page = {
  id: string;
  name: string;
};

// Netlify production API URL
const API_BASE_URL = "https://pageguard-fahim.netlify.app";

async function api<T = any>(
  action: string,
  token: string,
  extra: Record<string, unknown> = {}
): Promise<T> {
  const endpoint = `${API_BASE_URL}/.netlify/functions/meta`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      action,
      token,
      ...extra,
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();

  let data: any;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Netlify API returned HTML or invalid JSON (HTTP ${response.status}). Check Function deployment and API URL.`
    );
  }

  if (!response.ok || data.error) {
    throw new Error(
      data.error ||
        data.message ||
        `API request failed (HTTP ${response.status})`
    );
  }

  if (!contentType.includes("application/json")) {
    throw new Error("API response was not JSON.");
  }

  return data as T;
}

export default function App() {
  const [token, setToken] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  const [page, setPage] = useState<Page | null>(null);
  const [videos, setVideos] = useState<VideoRecord[]>([]);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [threshold, setThreshold] = useState(50);
  const [query, setQuery] = useState("");

  const [connected, setConnected] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const low = useMemo(
    () =>
      videos.filter(
        (v) => v.views !== undefined && v.views <= threshold
      ),
    [videos, threshold]
  );

  const filtered = useMemo(
    () =>
      videos.filter((v) =>
        `${v.description || ""} ${v.id}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [videos, query]
  );

  async function connect() {
    if (!token.trim()) {
      setError("Please enter your Meta access token.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const data: any = await api("pages", token);

      setPages(data.data || []);
      setConnected(true);
      setPage(null);
      setVideos([]);
      setCursor(null);
      setHasMore(false);

      setMessage(
        `Token accepted. ${data.data?.length || 0} Pages found.`
      );
    } catch (e: any) {
      setError(e.message || "Unable to connect to Meta.");
      setConnected(false);
    } finally {
      setBusy(false);
    }
  }

  async function loadPage(selected: Page) {
    setBusy(true);
    setError("");
    setMessage("");

    setPage(selected);
    setVideos([]);
    setCursor(null);
    setHasMore(false);

    try {
      const data: any = await api("videos", token, {
        pageId: selected.id,
      });

      setVideos(mergeVideoPages([], data.data || []));
      setCursor(data.paging?.after || null);
      setHasMore(Boolean(data.paging?.next));

      setMessage(
        `Loaded ${data.data?.length || 0} records from the first page.`
      );
    } catch (e: any) {
      setError(e.message || "Unable to load videos.");
    } finally {
      setBusy(false);
    }
  }

  async function loadMore() {
    if (!page || !cursor || busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const data: any = await api("videos", token, {
        pageId: page.id,
        after: cursor,
      });

      setVideos((current) =>
        mergeVideoPages(current, data.data || [])
      );

      setCursor(data.paging?.after || null);
      setHasMore(Boolean(data.paging?.next));

      setMessage("More videos loaded successfully.");
    } catch (e: any) {
      setError(e.message || "Unable to load more videos.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    if (!videos.length) return;

    const rows = [
      [
        "video_id",
        "description",
        "views",
        "created_time",
        "permalink",
      ],
      ...videos.map((v) => [
        v.id,
        v.description || "",
        String(v.views ?? ""),
        v.created_time || "",
        v.permalink_url || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "pageguard-inventory.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function disconnect() {
    setToken("");
    setPages([]);
    setPage(null);
    setVideos([]);
    setCursor(null);
    setHasMore(false);
    setConnected(false);
    setShowToken(false);
    setError("");
    setMessage("Local session cleared.");
  }

  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <Shield />
          <b>PageGuard</b>
        </div>

        <p className="sub">META PAGE TOOLKIT</p>

        <div className="nav">
          <span>
            <Shield /> Pages & Inventory
          </span>
          <span>
            <Video /> Smart Audit
          </span>
        </div>

        <div className="privacy">
          🔒 Token is kept in memory only. Disconnect clears this session.
        </div>
      </aside>

      <main>
        <header>
          <div>
            <small>YOUR PAGES. YOUR CONTROL.</small>
            <h1>PageGuard Dashboard</h1>
          </div>

          <span className={connected ? "online" : "offline"}>
            {connected ? "● Connected" : "● Not connected"}
          </span>
        </header>

        {error && <div className="alert">⚠ {error}</div>}
        {message && <div className="notice">✓ {message}</div>}

        {!connected ? (
          <section className="panel connect">
            <div className="bigicon">
              <KeyRound />
            </div>

            <h2>Connect your Meta account</h2>

            <p>
              Use your own Meta User Access Token with access to
              the Pages you manage. Never share your token.
            </p>

            <label>Access token</label>

            <div className="token">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste Meta access token"
                autoComplete="off"
              />

              <button
                className="secondary"
                type="button"
                onClick={() => setShowToken(!showToken)}
                aria-label="Toggle token visibility"
              >
                <Eye size={16} />
              </button>
            </div>

            <button
              className="primary"
              disabled={!token.trim() || busy}
              onClick={connect}
            >
              {busy ? "Checking…" : "Verify token & load Pages"}
            </button>

            <small>Token is not saved in browser storage.</small>
          </section>
        ) : (
          <>
            <div className="stats">
              <div className="panel">
                <small>Authorized Pages</small>
                <strong>{pages.length}</strong>
              </div>

              <div className="panel">
                <small>Unique videos loaded</small>
                <strong>{videos.length}</strong>
              </div>

              <div className="panel">
                <small>At/below threshold</small>
                <strong>{low.length}</strong>
              </div>
            </div>

            <section className="panel">
              <div className="heading">
                <div>
                  <h2>Choose a Page</h2>
                  <p>
                    Only Pages returned by your Meta token are shown.
                  </p>
                </div>

                <div className="actions">
                  <button
                    className="secondary"
                    onClick={connect}
                    disabled={busy}
                  >
                    <RefreshCw size={15} /> Refresh
                  </button>

                  <button
                    className="secondary"
                    onClick={disconnect}
                    disabled={busy}
                  >
                    <LogOut size={15} /> Disconnect
                  </button>
                </div>
              </div>

              <div className="pages">
                {pages.map((p) => (
                  <button
                    key={p.id}
                    className={`page ${
                      page?.id === p.id ? "selected" : ""
                    }`}
                    onClick={() => loadPage(p)}
                    disabled={busy}
                  >
                    <Shield />
                    <b>{p.name}</b>
                    <small>{p.id}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="heading">
                <div>
                  <h2>Video inventory & Smart Audit</h2>
                  <p>
                    {page
                      ? `Page: ${page.name}`
                      : "Select a Page to load videos"}
                  </p>
                </div>

                <button
                  className="secondary"
                  disabled={!videos.length}
                  onClick={exportCsv}
                >
                  <Download size={15} /> CSV
                </button>
              </div>

              <div className="filters">
                <label>Views ≤</label>

                <select
                  value={threshold}
                  onChange={(e) =>
                    setThreshold(Number(e.target.value))
                  }
                >
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="500">500</option>
                  <option value="1000">1,000</option>
                </select>

                <div className="search">
                  <Search size={15} />

                  <input
                    placeholder="Search description or ID"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="tablebox">
                <table>
                  <thead>
                    <tr>
                      <th>Video</th>
                      <th>Views</th>
                      <th>Created</th>
                      <th>Permalink</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <b>
                            {(v.description || "Untitled video").slice(
                              0,
                              60
                            )}
                          </b>
                          <small>{v.id}</small>
                        </td>

                        <td>
                          <span
                            className={
                              v.views !== undefined &&
                              v.views <= threshold
                                ? "low"
                                : "normal"
                            }
                          >
                            {v.views ?? "Unknown"}
                          </span>
                        </td>

                        <td>
                          {v.created_time
                            ? new Date(
                                v.created_time
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        <td>
                          {v.permalink_url ? (
                            <a
                              href={v.permalink_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <PlayCircle size={15} /> Open
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!videos.length && (
                  <div className="empty">
                    <Video />
                    <b>No videos loaded</b>
                    <small>Select a Page above.</small>
                  </div>
                )}
              </div>

              <div className="pagination">
                <span>
                  {videos.length} unique records loaded
                  {hasMore
                    ? " · more available"
                    : " · end of available cursor pages"}
                </span>

                <button
                  className="primary loadmore"
                  disabled={!hasMore || busy}
                  onClick={loadMore}
                >
                  {busy ? "Loading…" : "Load more"}
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="warning">
                Read-only mode: deletion is disabled until the
                complete Safe Delete Center is implemented and tested.
              </div>
            </section>
          </>
        )}

        <footer>
          Independent tool, not affiliated with Meta. API fields
          and permissions depend on Meta access and review.
        </footer>
      </main>
    </div>
  );
}
