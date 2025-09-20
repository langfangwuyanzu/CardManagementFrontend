// src/api/messagesApi.js
import { api } from './api';

/** 获取用户未发送给管理员的主帖（按创建时间倒序） */
export async function fetchUserUnsent({ userId, page = 0, size = 20, token }) {
  return api.get(`/api/messages/users/${userId}/unsent?page=${page}&size=${size}`, { token });
}

/** 获取一个线程的全部消息（正序） */
export async function fetchThreadMessages({ threadId, token }) {
  return api.get(`/api/messages/threads/${threadId}`, { token });
}

/** 新建主帖（问题）——前端强制自动发给管理员 */
export async function createQuestion({ authorUserId, content, type = 'TEXT', token }) {
  return api.post(`/api/messages/questions`,
    {
      authorUserId,
      content,
      type,
      sendToAdmin: true, // ✅ 前端强制发给管理员
    },
    { token }
  );
}

/** 在线程下回复（用户或管理员） */
export async function createReply({ threadId, parentId, authorUserId, authorRole = 'USER', content, type = 'TEXT', token }) {
  return api.post(`/api/messages/${threadId}/replies`,
    {
      parentId,
      authorUserId,
      authorRole,
      content,
      type,
    },
    { token }
  );
}

/** 管理员待办（发给管理员且未有管理员回复） */
export async function fetchAdminTodo({ page = 0, size = 20, token }) {
  return api.get(`/api/messages/admin/todo?page=${page}&size=${size}`, { token });
}

/** 管理员历史（已有管理员回复） */
export async function fetchAdminHistory({ page = 0, size = 20, token }) {
  return api.get(`/api/messages/admin/history?page=${page}&size=${size}`, { token });
}

/** 删除/隐藏单条消息（当前后端是硬删除） */
export async function deleteMessage({ id, token }) {
  return api.delete(`/api/messages/${id}`, { token });
}

/** （可选）批量标记某用户主帖 sentToAdmin —— 你的后端已暴露该接口 */
export async function markUserSentToAdmin({ userId, value, token }) {
  return api.put(`/api/messages/users/${userId}/sent-to-admin`, { sentToAdmin: value }, { token });
}
