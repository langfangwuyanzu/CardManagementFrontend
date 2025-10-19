import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Typography, Chip, TextField, InputAdornment,
  AppBar, Toolbar, Button, useTheme, useMediaQuery, CircularProgress, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';

// ===== API 服务（和你的一致风格）=====
const api = {
  get: async (url, params = {}) => {
    const token = localStorage.getItem('authToken');
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();

    const resp = await fetch(`http://localhost:8080${url}?${qs}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    return await resp.json();
  }
};

// ===== 表头配置（与你一致的结构）=====
const columns = [
  { id: 'id', label: 'ID', align: 'left', sortable: true },
  { id: 'name', label: 'NAME', align: 'left', sortable: true },
  { id: 'createdAt', label: 'Time', align: 'left', sortable: true },
  { id: 'type', label: 'TYPE', align: 'left', sortable: true },
  { id: 'level', label: 'LEVEL', align: 'left', sortable: true },
  { id: 'email', label: 'Email', align: 'left', sortable: true },
  { id: 'status', label: 'STATES', align: 'left', sortable: true },
];
// 拉取所有页的数据（按当前服务器筛选/排序）
const fetchAllNotifications = async () => {
  const sort = `${orderBy},${order}`;
  const pageSize = 200; // 一次取 200 条，避免请求过大
  let pageIndex = 0;
  let all = [];
  // 按 type 筛选（你前面把 status 输入框删掉了，这里就只保留 type）
  const params = (p) => ({
    page: p,
    size: pageSize,
    type: filterType || undefined,
    sort
  });

  while (true) {
    const data = await api.get('/api/notifications', params(pageIndex));
    const content = data?.content || [];
    all = all.concat(content);
    // 结束条件：到了最后一页
    if (data.last === true || content.length === 0) break;
    pageIndex += 1;
  }
  return all;
};



// 状态 → 芯片样式
const statusToChip = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'SUCCESS' || s === 'READ') return { label: '• Success', color: 'success' };
  if (s === 'FAIL' || s === 'ERROR') return { label: '• Fail', color: 'error' };
  return { label: '• Pending', color: 'warning' };
};

// 时间格式
const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
};

export default function NotificationCenter() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // 服务器筛选（和你 UI 顶栏搜索一致做法）
  const [searchTerm, setSearchTerm] = useState(''); // 本地关键字（name/email）
  const [filterType, setFilterType] = useState(''); // 传给后端的 type
  const [filterStatus, setFilterStatus] = useState(''); // 传给后端的 status

  const [rows, setRows] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // 拉取所有页的数据（按当前服务器筛选/排序）
  const fetchAllNotifications = async () => {
    const sort = `${orderBy},${order}`;
    const pageSize = 200; // 一次取 200 条，避免请求过大
    let pageIndex = 0;
    let all = [];
    // 按 type 筛选（你前面把 status 输入框删掉了，这里就只保留 type）
    const params = (p) => ({
      page: p,
      size: pageSize,
      type: filterType || undefined,
      sort
    });

    while (true) {
      const data = await api.get('/api/notifications', params(pageIndex));
      const content = data?.content || [];
      all = all.concat(content);
      // 结束条件：到了最后一页
      if (data.last === true || content.length === 0) break;
      pageIndex += 1;
    }
    return all;
  };

  // 生成 Excel 并下载
  const exportExcel = async () => {
    try {
      setLoading(true);
      // 拉全量（按当前 type 过滤 & 当前排序）
      const allRows = await fetchAllNotifications();

      // 映射为扁平对象（只导出需要的列）
      const rowsForExcel = allRows.map(r => ({
        ID: r.id,
        Name: r.name || '',
        Email: r.email || '',
        Level: r.level ?? '',
        Type: r.type || '',
        Status: r.status || '',
        Time: r.createdAt ? new Date(r.createdAt).toLocaleString() : ''
      }));

      const ws = XLSX.utils.json_to_sheet(rowsForExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Notifications');

      // 自动按内容调列宽（简单估算）
      const colWidths = Object.keys(rowsForExcel[0] || { A: '' }).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...rowsForExcel.map(row => String(row[key] ?? '').length)
        );
        return { wch: Math.min(Math.max(maxLen + 2, 8), 40) }; // 8~40之间
      });
      ws['!cols'] = colWidths;

      const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      XLSX.writeFile(wb, `notifications-${ts}.xlsx`);
    } catch (e) {
      setError('Export failed: ' + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };


  // 拉数据（严格服务器分页/排序/筛选）
  const fetchNotifications = async (pageNum, size) => {
    try {
      setLoading(true);
      setError(null);

      const sort = `${orderBy},${order}`;
      const data = await api.get('/api/notifications', {
        page: pageNum,
        size,
        type: filterType || undefined,
        status: filterStatus || undefined,
        sort
      });

      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
      setPage(data.number ?? pageNum);
      setRowsPerPage(data.size ?? size);
    } catch (err) {
      setError('Failed to fetch notifications: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, orderBy, order, filterType, filterStatus]);

  // 表头排序
  const handleSort = (columnId) => {
    if (!columns.find(c => c.id === columnId)?.sortable) return;
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  // 页码/每页
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setRowsPerPage(newSize);
    setPage(0);
    fetchNotifications(0, newSize);
  };

  // 本地关键字过滤（只匹配 name/email）
  const filteredData = rows.filter(row => {
    if (!searchTerm) return true;
    const kw = searchTerm.toLowerCase();
    return (row.name || '').toLowerCase().includes(kw) ||
      (row.email || '').toLowerCase().includes(kw);
  });

  return (
    <Box sx={{
      width: '100%',
      p: isMobile ? 1 : 3,
      '& .MuiTableCell': { padding: isMobile ? '8px 4px' : '16px', fontSize: isMobile ? '0.75rem' : '0.875rem' }
    }}>
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider', mb: 2 }}>
        <Toolbar sx={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 2 : 0 }}>
          <Typography variant="h6" sx={{ flexGrow: isMobile ? 0 : 1, textAlign: isMobile ? 'center' : 'left', fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            Notification | {totalElements}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 2, width: isMobile ? '100%' : 'auto' }}>
            {/* 本地关键字搜索（name/email） */}
            <TextField
              variant="outlined" size="small" placeholder="Search name or email..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
              sx={{ width: isMobile ? '100%' : 250 }}
            />
            {/* 服务器筛选：type / status（可换成 Select） */}
            {/* <TextField
              variant="outlined" size="small" placeholder="Type (Expire/Application/Training...)"
              value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
              sx={{ width: isMobile ? '100%' : 220 }}
            />
            <TextField
              variant="outlined" size="small" placeholder="Status (SUCCESS/FAIL/PENDING/READ)"
              value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
              sx={{ width: isMobile ? '100%' : 220 }}
            /> */}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportExcel}
              sx={{ borderRadius: 2, whiteSpace: 'nowrap', minWidth: isMobile ? '100%' : 'auto' }}
            >
              Export Excel
            </Button>

            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>
              Create Notification
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={2} sx={{ width: '100%', overflow: 'auto', maxHeight: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 200px)', position: 'relative' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
            <CircularProgress />
          </Box>
        )}

        <TableContainer>
          <Table stickyHeader aria-label="notification table" size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    onClick={() => column.sortable && handleSort(column.id)}
                    sx={{
                      backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold',
                      cursor: column.sortable ? 'pointer' : 'default',
                      fontSize: isMobile ? '0.7rem' : '0.875rem',
                      py: isMobile ? 1 : 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {column.label}
                      {column.sortable && (
                        <ArrowDownwardIcon
                          sx={{
                            fontSize: isMobile ? 14 : 16, ml: .5,
                            transform: orderBy === column.id && order === 'desc' ? 'rotate(180deg)' : 'rotate(0)',
                            opacity: orderBy === column.id ? 1 : 0.3
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.map((row) => {
                const chip = statusToChip(row.status);
                return (
                  <TableRow hover key={row.id}>
                    <TableCell sx={{ fontWeight: 'medium' }}>{row.id}</TableCell>

                    {/* NAME：头像 + 名字（没有头像就用占位） */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <img
                          src={row.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name || 'User')}`}
                          alt="avatar" width={28} height={28} style={{ borderRadius: '50%' }}
                          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                        />
                        <Typography sx={{ fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.name || '—'}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>{formatTime(row.createdAt)}</TableCell>
                    <TableCell>{row.type || '—'}</TableCell>
                    <TableCell>{row.level ?? '—'}</TableCell>
                    <TableCell>{row.email || '—'}</TableCell>
                    <TableCell>
                      <Chip label={chip.label} color={chip.color} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', p: 2, gap: isMobile ? 2 : 0 }}>
          <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            Showing {filteredData.length} of {totalElements}
          </Typography>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalElements}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: isMobile ? '0.75rem' : '0.875rem' } }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
