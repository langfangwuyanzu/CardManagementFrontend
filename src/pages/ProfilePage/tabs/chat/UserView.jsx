// src/views/UserChat.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper,
  CircularProgress,
  Alert,
  IconButton
} from "@mui/material";
import { Send as SendIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import api, { ApiError } from "../../../../utils/api";

export default function UserChat({ token, userId }) {
  const [content, setContent] = useState("");
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // 加载用户的问题列表 - 使用unsent接口
  const loadThreads = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/messages/users/${userId}/unsent?page=0&size=20`,
        { token }
      );
      console.log(res, '加载的问题列表');
      setThreads(res.content || []);
    } catch (e) {
      if (e instanceof ApiError) {
        setError("Failed to load questions: " + e.message);
      } else {
        setError("Failed to load questions");
      }
    } finally {
      setLoading(false);
    }
  };

  // 加载特定线程的消息
  const loadThreadMessages = async (threadId) => {
    try {
      setLoading(true);
      const res = await api.get(`/messages/threads/${threadId}`, { token });
      setMessages(res || []);
    } catch (e) {
      if (e instanceof ApiError) {
        setError("Failed to load messages: " + e.message);
      } else {
        setError("Failed to load messages");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && token) {
      loadThreads();
    }
  }, [userId, token]);

  // 当选择不同线程时加载消息
  useEffect(() => {
    if (activeThread) {
      loadThreadMessages(activeThread.id);
    }
  }, [activeThread]);

  // 提交新问题 - 保留原有功能
  const submitQuestion = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSending(true);
      setError("");
      
      console.log('提交新问题:', content);
      await api.post(
        "/messages/questions",
        {
          authorUserId: parseInt(userId),
          content: content.trim(),
          messageType: "QUESTION",
          authorRole: "USER"
        },
        { token }
      );
      
      setContent("");
      await loadThreads(); // 重新加载问题列表
    } catch (e) {
      console.error('提交问题错误:', e);
      if (e instanceof ApiError) {
        setError("Failed to submit question: " + e.message);
      } else {
        setError("Failed to submit question");
      }
    } finally {
      setSending(false);
    }
  };

  // 发送回复
  const sendReply = async () => {
    if (!content.trim() || !activeThread) return;

    try {
      setSending(true);
      setError("");
      
      await api.post(
        `/messages/${activeThread.id}/replies`,
        {
          authorUserId: parseInt(userId),
          content: content.trim(),
          messageType: "USER_REPLY",
          authorRole: "USER"
        },
        { token }
      );
      
      setContent("");
      await loadThreadMessages(activeThread.id); // 重新加载消息
    } catch (e) {
      if (e instanceof ApiError) {
        setError("Failed to send reply: " + e.message);
      } else {
        setError("Failed to send reply");
      }
    } finally {
      setSending(false);
    }
  };

  // 发送给管理员
  const sendToAdmin = async () => {
    try {
      setSending(true);
      setError("");
      
      await api.put(`/messages/users/${userId}/sent-to-admin?value=true`, {}, { token });
      setError("Questions sent to admin successfully!");
      await loadThreads(); // 重新加载列表
    } catch (e) {
      if (e instanceof ApiError) {
        setError("Failed to send to admin: " + e.message);
      } else {
        setError("Failed to send to admin");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '600px', gap: 2, p: 2 }}>
      {/* 左侧 - 问题列表和提问功能 */}
      <Paper sx={{ width: 350, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Ask Question
          </Typography>
          <form onSubmit={submitQuestion} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <TextField
              size="small"
              fullWidth
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your question..."
              disabled={sending}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!content.trim() || sending}
              startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
            >
              Send
            </Button>
          </form>

          <Button
            variant="outlined"
            fullWidth
            onClick={sendToAdmin}
            disabled={sending || threads.length === 0}
            startIcon={sending ? <CircularProgress size={16} /> : null}
          >
            {sending ? 'Sending...' : 'REACH ADMIN ONLINE'}
          </Button>
        </Box>

        <Typography variant="subtitle1" sx={{ p: 2, pb: 1, fontWeight: 'bold' }}>
          Your Threads
        </Typography>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading && !threads.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List>
              {threads.map((thread) => (
                <ListItem key={thread.id} disablePadding>
                  <ListItemButton
                    selected={activeThread?.id === thread.id}
                    onClick={() => setActiveThread(thread)}
                  >
                    <ListItemText
                      primary={
                        <Typography noWrap>
                          {thread.content?.length > 50 
                            ? thread.content.substring(0, 50) + '...' 
                            : thread.content
                          }
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {threads.length === 0 && !loading && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No questions yet
                </Typography>
              )}
            </List>
          )}
        </Box>
      </Paper>

      {/* 右侧 - 聊天界面 */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeThread ? (
          <>
            {/* 聊天头部 */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => setActiveThread(null)} size="small">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">
                Conversation #{activeThread.id}
              </Typography>
            </Box>

            {/* 消息列表 */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        alignSelf: message.authorRole === 'USER' ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        bgcolor: message.authorRole === 'USER' ? 'primary.main' : 'grey.100',
                        color: message.authorRole === 'USER' ? 'white' : 'text.primary',
                        borderRadius: 2,
                        p: 1.5,
                        wordBreak: 'break-word'
                      }}
                    >
                      <Typography variant="body2">{message.content}</Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.8,
                          color: message.authorRole === 'USER' ? 'white' : 'text.secondary'
                        }}
                      >
                        {new Date(message.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                  {messages.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No messages yet
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            {/* 输入框 - 只在有活跃线程时显示 */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <form onSubmit={(e) => { e.preventDefault(); sendReply(); }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your reply..."
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!content.trim() || sending}
                    startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
                  >
                    Send
                  </Button>
                </Box>
              </form>
            </Box>
          </>
        ) : (
          // 当没有选择线程时显示提示
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography variant="h6" color="text.secondary">
              Select a conversation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a question from the list to view the conversation
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 错误提示 */}
      {error && (
        <Alert 
          severity={error.includes('successfully') ? "success" : "error"}
          sx={{ position: 'fixed', bottom: 16, right: 16, minWidth: 300 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}