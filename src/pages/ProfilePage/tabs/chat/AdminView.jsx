// src/pages/ProfilePage/tabs/chat/AdminView.jsx
import React, { useEffect, useRef, useState } from "react";
import api, { ApiError } from "../../../../utils/api";

/** ========== 内联 ChatView（管理员侧查看/回复指定线程） ========== */
function ChatView({ token, threadId, currentUserId, authorRole = "ADMIN", onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  const loadThread = async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/messages/threads/${threadId}`, { token });
      // 后端可能返回数组或 {content:[]}；这里统一成数组
      const list = Array.isArray(res) ? res : res?.content ?? [];
      setMessages(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadThread(); }, [threadId, token]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e) => {
    e?.preventDefault?.();
    if (!text.trim() || !currentUserId || messages.length === 0) return;

    const last = messages[messages.length - 1];
    setSending(true);
    setError(null);
    try {
      await api.post(
        `/messages/${threadId}/replies`,
        {
          parentId: last.id,
          authorUserId: currentUserId,
          authorRole,
          content: text,
          type: "TEXT",
        },
        { token }
      );
      setText("");
      await loadThread();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onBack && <button onClick={onBack}>Back</button>}
        <h3 style={{ margin: 0 }}>Question Number: {threadId}</h3>
      </div>

      <div style={{ flex: 1, border: "1px solid #eee", padding: 12, overflow: "auto", marginTop: 8 }}>
        {loading && <div style={{ color: "#666" }}>Loading messages…</div>}
        {error && <div style={{ color: "#b00" }}>Filed to load{error}</div>}
        {!loading && !error && messages.length === 0 && (
          <div style={{ color: "#777" }}>No message</div>
        )}

        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8, textAlign: m.authorRole === "ADMIN" ? "left" : "right" }}>
            <div
              style={{
                display: "inline-block",
                padding: 8,
                borderRadius: 6,
                background: m.authorRole === "ADMIN" ? "#f5f6fa" : "#dff7df",
                maxWidth: "90%",
              }}
            >
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                {m.authorRole} · {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
              </div>
              <div>{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="input your answer…"
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={sending || !text.trim()}>
          {sending ? "sending…" : "sent"}
        </button>
      </form>
    </div>
  );
}

/** ========== 管理员列表页：To-do / History + 右侧聊天区 ========== */
export default function AdminView({ token, adminUserId = 1 }) {
  const [tab, setTab] = useState("todo");               // "todo" | "history"
  const [threads, setThreads] = useState(null);         // 分页对象或数组
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [page, setPage] = useState(0);
  const size = 20;

  const load = async (p = page, t = tab) => {
    setLoading(true);
    setError(null);
    try {
      const url =
        t === "todo"
          ? `/messages/admin/todo?page=${p}&size=${size}`
          : `/messages/admin/history?page=${p}&size=${size}`;
      const res = await api.get(url, { token });

      // 兼容两种返回：分页对象 {content,totalPages...} 或 直接数组
      const normalized = Array.isArray(res)
        ? { content: res, totalPages: 1, totalElements: res.length, number: p }
        : res ?? { content: [], totalPages: 0, totalElements: 0, number: p };

      setThreads(normalized);
      setPage(p);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load(0, tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  const contentList = threads?.content ?? [];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: activeThreadId ? "360px 1fr" : "1fr",
        gap: 16,
        minHeight: 480,
      }}
    >
      {/* 左侧列表 */}
      <div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setTab("todo");
              setActiveThreadId(null);
              load(0, "todo");
            }}
            disabled={tab === "todo"}
          >
            To-do
          </button>
          <button
            onClick={() => {
              setTab("history");
              setActiveThreadId(null);
              load(0, "history");
            }}
            disabled={tab === "history"}
          >
            History
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          {loading && <div style={{ color: "#666" }}>Loading list…</div>}
          {error && <div style={{ color: "#b00" }}>Failed to load：{error}</div>}
          {!loading && !error && contentList.length === 0 && (
            <div style={{ color: "#777" }}>None</div>
          )}

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {contentList.map((t) => (
              <li
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                style={{
                  padding: 10,
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  background: activeThreadId === t.id ? "#f7f7f7" : "transparent",
                }}
              >
                <div>
                  <strong>Question Number: {t.id}</strong>
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  User #{t.authorUserId} · {t.createdAt ? new Date(t.createdAt).toLocaleString() : ""}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#444",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={t.content}
                >
                  {t.content}
                </div>
              </li>
            ))}
          </ul>

          {/* 简单翻页 */}
          {threads?.totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
              <button disabled={page <= 0} onClick={() => load(page - 1, tab)}>last page</button>
              <span>第 {page + 1} / {threads.totalPages} page</span>
              <button disabled={page >= threads.totalPages - 1} onClick={() => load(page + 1, tab)}>next page</button>
            </div>
          )}
        </div>
      </div>

      {/* 右侧聊天区 */}
      {activeThreadId && (
        <ChatView
          token={token}
          threadId={activeThreadId}
          currentUserId={adminUserId}
          authorRole="ADMIN"
          onBack={() => setActiveThreadId(null)}
        />
      )}
    </div>
  );
}
