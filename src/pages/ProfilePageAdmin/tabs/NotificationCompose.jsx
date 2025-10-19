import React, { useMemo, useState } from 'react';
import {
  Box, Paper, AppBar, Toolbar, Typography, IconButton, Button, TextField, Chip,
  Stack, MenuItem, Divider, InputAdornment, Tooltip, Alert, CircularProgress
} from '@mui/material';
import { ArrowBack, Send, AttachFile, DeleteOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';

const api = {
  post: async (url, body) => {
    const token = localStorage.getItem('authToken');
    const resp = await fetch(`http://localhost:8080${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json().catch(() => ({}));
  }
};

// 你系统里的类型 & 等级可按后端枚举替换
const TYPE_OPTIONS = ['Expire', 'Application', 'Training', 'System'];
const LEVEL_OPTIONS = [1, 2, 3, 4];

export default function NotificationCompose() {
  const navigate = useNavigate();

  const [fromDisplay] = useState('Admin001 (Admin001@yyf.com.au)'); // 仅展示
  const [to, setTo] = useState('');     // 可填写邮箱或留空，配合 level 批量发
  const [levels, setLevels] = useState([1, 3]); // 默认勾选，可编辑
  const [type, setType] = useState('Expire');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState('');

  const handleAddLevel = () => {
    const next = LEVEL_OPTIONS.find(l => !levels.includes(l));
    if (next) setLevels([...levels, next]);
  };
  const handleRemoveLevel = (lv) => setLevels(levels.filter(l => l !== lv));

  const handleSelectFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...list]);
  };

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ font: [] }, { size: [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ header: '1' }, { header: '2' }, 'blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }, { align: [] }],
      ['link'],
      ['clean']
    ]
  }), []);

  const validate = () => {
    if (!subject.trim()) return 'Subject is required';
    if (!html || html === '<p><br></p>') return 'Content is required';
    // 可按需要求：必须选 level 或填 To
    if (levels.length === 0 && !to.trim()) return 'Please select at least one Level or specify recipients';
    return '';
  };

  const handleSend = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setError('');
    setOkMsg('');
    setSaving(true);
    try {
      // 这里演示 JSON 发送。如果你要真传附件，改用 FormData + 后端 Multipart。
      const payload = {
        type,              // e.g. "Expire"
        subject,           // string
        contentHtml: html, // 富文本 HTML
        to,                // 逗号分隔的邮箱（可选）
        levels,            // [1,3]
        // files: 省略（改用 upload 接口或 multipart）
      };
      await api.post('/api/notifications', payload);
      setOkMsg('Notification sent');
      // 成功后返回列表
      setTimeout(() => navigate(-1), 600);
    } catch (e) {
      setError('Send failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => navigate(-1);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>{'< BACK'}</Typography>
          <Button onClick={handleDiscard} variant="outlined" sx={{ mr: 1 }}>Discard</Button>
          <Button variant="outlined" startIcon={<AttachFile />} component="label" sx={{ mr: 1 }}>
            Attach File
            <input hidden type="file" multiple onChange={handleSelectFiles} />
          </Button>
          <Button variant="contained" endIcon={<Send />} onClick={handleSend} disabled={saving}>
            {saving ? 'Sending...' : 'Send'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 980, mx: 'auto', p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {okMsg && <Alert severity="success" sx={{ mb: 2 }}>{okMsg}</Alert>}
        {saving && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <CircularProgress size={18} /> <Typography variant="body2">Processing…</Typography>
          </Stack>
        )}

        <Paper variant="outlined" sx={{ p: 2 }}>
          {/* From */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography sx={{ width: 72, color: 'text.secondary' }}>From:</Typography>
            <Typography sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', py: .5 }}>
              {fromDisplay}
            </Typography>
          </Stack>

          {/* To */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography sx={{ width: 72, color: 'text.secondary' }}>To:</Typography>
            <TextField
              placeholder="user1@example.com, user2@example.com (optional)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              fullWidth
              variant="standard"
              InputProps={{ endAdornment: <InputAdornment position="end"> </InputAdornment> }}
            />
            <Stack direction="row" spacing={1}>
              {levels.map(lv => (
                <Chip key={lv} label={`LEVEL ${lv}`} onDelete={() => handleRemoveLevel(lv)} color="primary" variant="outlined" />
              ))}
              <Button size="small" onClick={handleAddLevel}>Add Level</Button>
            </Stack>
          </Stack>

          {/* Type + Subject */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Typography sx={{ width: 72, color: 'text.secondary' }}>TYPE</Typography>
            <TextField
              select size="small" value={type} onChange={(e) => setType(e.target.value)}
              sx={{ width: 160 }}
            >
              {TYPE_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>

            <Typography sx={{ color: 'text.secondary', ml: 2 }}>Subject:</Typography>
            <TextField
              variant="standard"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              placeholder="Write a subject…"
            />
          </Stack>

          {/* Editor */}
          <ReactQuill theme="snow" value={html} onChange={setHtml} modules={quillModules} style={{ height: 280 }} />
          <Divider sx={{ my: 2 }} />

          {/* 附件列表（展示用） */}
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {files.map((f, idx) => (
              <Chip
                key={`${f.name}-${idx}`}
                label={`${f.name} (${Math.round(f.size/1024)} KB)`}
                onDelete={() => setFiles(files.filter((_, i) => i !== idx))}
                deleteIcon={<DeleteOutline />}
                variant="outlined"
              />
            ))}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
