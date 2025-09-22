// src/views/UserChat.jsx
import React, { useEffect, useState } from "react";
import api, { ApiError } from "../../../../utils/api";
import ChatView from "./ChatView";

export default function UserChat({ token, userId }) {
  const [content, setContent] = useState("");
  const [threads, setThreads] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [page, setPage] = useState(0);
  const size = 20;

  const loadThreads = async (p = page) => {
    try {
      const res = await api.get(
        `/api/messages/users/${userId}/unsent?page=${p}&size=${size}`,
        { token }
      );
      setThreads(res);
      setPage(p);
    } catch (e) {
      if (e instanceof ApiError) {
        console.error("Failed to load threads:", e.message);
      }
    }
  };

  useEffect(() => {
    if (userId && token) loadThreads(0);
  }, [userId, token]);

  const submitQuestion = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.post(
        "/messages/questions",
        {
          authorUserId: userId,
          content,
          type: "TEXT", // ⚠️ 注意：这里字段要和 CreateQuestionRequest.java 对齐
          sendToAdmin: true,
        },
        { token }
      );
      setContent("");
      await loadThreads(0);
    } catch (e) {
      if (e instanceof ApiError) {
        alert("Failed to submit question: " + e.message);
      }
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: activeThreadId ? "300px 1fr" : "1fr",
        gap: 16,
      }}
    >
      <div>
        <h2>Ask a Question</h2>
        <form onSubmit={submitQuestion} style={{ display: "flex", gap: 8 }}>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your question..."
            style={{ flex: 1 }}
          />
          <button type="submit">Send</button>
        </form>

        <h3 style={{ marginTop: 20 }}>Your Threads</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {threads?.content?.map((t) => (
            <li
              key={t.id}
              onClick={() => setActiveThreadId(t.id)}
              style={{
                padding: 8,
                borderBottom: "1px solid #eee",
                cursor: "pointer",
              }}
            >
              <div>
                <strong>Thread #{t.id}</strong>
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {new Date(t.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {activeThreadId && (
        <ChatView
          token={token}
          threadId={activeThreadId}
          currentUserId={userId}
          authorRole="USER"
          onBack={() => setActiveThreadId(null)}
        />
      )}
    </div>
  );
}
