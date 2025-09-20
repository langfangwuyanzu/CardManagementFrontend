// src/views/UserChat.jsx
import React, { useEffect, useRef, useState } from "react";
import api, { ApiError } from "../../../utils/api";
import AdminView from "./chat/AdminView"; // ✅ 新增：引入你写好的 AdminView
// 统一从缓存读取 userId：优先 localStorage，其次 sessionStorage
function getCachedUserId() {
  const raw = localStorage.getItem("userId") ?? sessionStorage.getItem("userId");
  const num = raw != null ? Number(raw) : undefined;
  return Number.isFinite(num) ? num : undefined;
}

// --- AdminView 占位组件 ---


// 聊天详情（线程内消息）
function ThreadView({ token, threadId, authorRole = "USER", onBack }) {
  const currentUserId = getCachedUserId(); // ✅ 用缓存里的 userId
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const load = async () => {
    try {
      const res = await api.get(`/api/messages/threads/${threadId}`, { token });
      setMessages(res || []);
    } catch (e) {
      if (e instanceof ApiError) console.error(e.message);
    }
  };

  useEffect(() => { if (threadId) load(); }, [threadId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || messages.length === 0 || !currentUserId) return;
    const lastId = messages[messages.length - 1].id;
    try {
      await api.post(
        `/api/messages/${threadId}/replies`,
        {
          parentId: lastId,
          authorUserId: currentUserId, // ✅ 来自缓存
          authorRole,
          content: text,
          type: "TEXT",
        },
        { token }
      );
      setText("");
      await load();
    } catch (e) {
      if (e instanceof ApiError) alert("Send failed: " + e.message);
    }
  };

  if (!currentUserId) {
    return (
      <div style={{ padding: 12, color: "#b00" }}>
        未找到用户 ID，请先登录（或在 localStorage/sessionStorage 设置 userId）。
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onBack && <button onClick={onBack}>Back</button>}
        <h3>Thread #{threadId}</h3>
      </div>
      <div style={{ flex: 1, border: "1px solid #eee", padding: 12, overflow: "auto" }}>
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: 8, textAlign: m.authorRole === "ADMIN" ? "left" : "right" }}>
            <div style={{ display: "inline-block", padding: 8, borderRadius: 6, background: m.authorRole === "ADMIN" ? "#f5f6fa" : "#dff7df" }}>
              <div style={{ fontSize: 12, color: "#666" }}>
                {m.authorRole} · {new Date(m.createdAt).toLocaleString()}
              </div>
              <div>{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…" style={{ flex: 1 }} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

// 用户提问 + 线程入口
export default function UserChat({ token }) {
  const userId = getCachedUserId(); // ✅ 用缓存里的 userId
  const [threads, setThreads] = useState(null);
  const [content, setContent] = useState("");
  const [activeThreadId, setActiveThreadId] = useState(null);

  const loadThreads = async () => {
    try {
      const res = await api.get(`/api/messages/users/${userId}/unsent?page=0&size=20`, { token });
      setThreads(res);
    } catch (e) {
      if (e instanceof ApiError) console.error(e.message);
    }
  };

  useEffect(() => { if (userId) loadThreads(); }, [userId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !userId) return;
    try {
      await api.post(
        "/api/messages/questions",
        {
          authorUserId: userId,   // ✅ 来自缓存
          content,
          type: "TEXT",
          messageType: "TEXT",
          sendToAdmin: true,
          sentToAdmin: true,
          authorRole: "USER",
        },
        { token }
      );
      setContent("");
      await loadThreads();
    } catch (e) {
      if (e instanceof ApiError) alert("Failed: " + e.message);
    }
  };

  if (!userId) {
    return (
      <div style={{ padding: 12, color: "#b00" }}>
        未找到用户 ID，请先登录。开发期也可临时在控制台设置：
        <pre style={{ background: "#f6f8fa", padding: 8, borderRadius: 6 }}>
{`localStorage.setItem('userId', '1')`}
        </pre>
      </div>
    );
  }

  // ✅ 判断是否管理员（id === 1）
  if (userId === 1) {
    return <AdminView />;
  }

  return activeThreadId ? (
    <ThreadView token={token} threadId={activeThreadId} authorRole="USER" onBack={() => setActiveThreadId(null)} />
  ) : (
    <div>
      <h2>Ask a Question</h2>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input value={content} onChange={e => setContent(e.target.value)} placeholder="Type your question…" style={{ flex: 1 }} />
        <button type="submit">Send</button>
      </form>
      <h3 style={{ marginTop: 20 }}>Your Threads</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {threads?.content?.map(t => (
          <li key={t.id} onClick={() => setActiveThreadId(t.id)} style={{ padding: 8, borderBottom: "1px solid #eee", cursor: "pointer" }}>
            <div><strong>Thread #{t.id}</strong></div>
            <div style={{ fontSize: 12, color: "#666" }}>{new Date(t.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
