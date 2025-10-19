import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Typography, Chip, TextField, InputAdornment,
  AppBar, Toolbar, Button, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, useTheme, useMediaQuery, CircularProgress, Alert, Grid, Avatar
} from '@mui/material';
import {
  Delete as DeleteIcon, Search as SearchIcon, Add as AddIcon, ArrowDownward as ArrowDownwardIcon,
  Edit as EditIcon, ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import api from "../../../utils/api";

const columns = [
  { id: 'id', label: 'ID', align: 'left', sortable: true },
  { id: 'firstName', label: 'FIRST NAME', align: 'left', sortable: true },
  { id: 'lastName', label: 'LAST NAME', align: 'left', sortable: true },
  { id: 'email', label: 'EMAIL', align: 'left', sortable: true },
  { id: 'cardLevel', label: 'LEVEL', align: 'left', sortable: true },
  { id: 'status', label: 'STATUS', align: 'left', sortable: true },
  { id: 'role', label: 'ROLE', align: 'left', sortable: true },
  { id: 'actions', label: 'ACTIONS', align: 'center', sortable: false },
];

export default function UserManagementSystem() {
  // -------- 顶层 Hooks（不要放进条件分支里）--------
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('asc');

  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);

  // 删除弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 拒绝弹窗（详情页操作）
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const authOpt = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  // ---------- API: 获取用户列表（分页/搜索/排序） ----------
  const getUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size: rowsPerPage,
        search: searchTerm?.trim() || undefined,
        sort: `${orderBy},${order}`,
      };
      // 你的 api 工具：api.get(url, params, options)
      const res = await api.get("/users/userList", params, authOpt);
      setUsers(Array.isArray(res?.content) ? res.content : []);
      setTotalElements(Number.isFinite(res?.totalElements) ? res.totalElements : 0);
    } catch (e) {
      console.error("userList error:", e);
      setError("Failed to load users.");
      setUsers([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, orderBy, order, searchTerm]);

  const handleSort = (columnId) => {
    const col = columns.find(c => c.id === columnId);
    if (!col?.sortable) return;
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
    setPage(0);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    // TODO: 调用后端删除接口
    setUsers(prev => prev.filter(u => u.id !== (selectedUser?.id)));
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleViewUser = (user) => setSelectedUser(user);
  const handleBackToList = () => setSelectedUser(null);
  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const statusChip = (s) => {
    if (s === 'APPROVED') return <Chip label="Approved" color="success" size="small" />;
    if (s === 'PENDING')  return <Chip label="In progress" color="warning" size="small" />;
    if (s === 'REJECTED') return <Chip label="Rejected" color="error" size="small" />;
    return <Chip label={s || 'Unknown'} size="small" />;
  };

  // ---------- 详情页操作：批准/拒绝 ----------
  const refreshRow = async () => {
    try {
      if (!selectedUser) return;
      const fresh = await api.get(`/users/${selectedUser.id}`, {}, authOpt);
      setSelectedUser(fresh);
    } catch {
      // ignore; 列表刷新就行
    } finally {
      await getUserData();
    }
  };

  const onApprove = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      await api.post(`/admin/users/${selectedUser.id}/approve`, null, authOpt);
      await refreshRow();
    } catch (e) {
      console.error(e);
      alert("Approve failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const onRejectClick = () => setRejectOpen(true);

  const confirmReject = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      await api.post(
        `/admin/users/${selectedUser.id}/reject`,
        { reason: rejectReason },
        authOpt
      );
      setRejectOpen(false);
      setRejectReason('');
      await refreshRow();
    } catch (e) {
      console.error(e);
      alert("Reject failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== 详情模式 ==========
  if (selectedUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackToList} sx={{ mb: 2 }}>
          Back
        </Button>

        <Paper sx={{ p: 3, position: 'relative' }}>
          {/* 顶部右侧操作按钮 */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
            
          </Box>

          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            Application Information
            {statusChip(selectedUser.status)}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography>First Name: <b>{selectedUser.firstName || '—'}</b></Typography>
                <Typography>Last Name: <b>{selectedUser.lastName || '—'}</b></Typography>
                <Typography>Year of Birth: <b>{selectedUser.birthday || '—'}</b></Typography>
              </Box>

              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography>Email: <b>{selectedUser.email || '—'}</b></Typography>
                <Typography>Card Level: <b>{selectedUser.cardLevel || '—'}</b></Typography>
                <Typography>Valid to: <b>{selectedUser.expireDate || '—'}</b></Typography>
              </Box>

              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography>Street Address: <b>{selectedUser.streetAddress || '—'}</b></Typography>
                <Typography>Suburb: <b>{selectedUser.suburb || '—'}</b></Typography>
                <Typography>State: <b>{selectedUser.state || '—'}</b></Typography>
                <Typography>Postcode: <b>{selectedUser.postcode || '—'}</b></Typography>
              </Box>

              {selectedUser.rejectionReason && selectedUser.status === 'REJECTED' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Reject reason: {selectedUser.rejectionReason}
                </Alert>
              )}

              <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Training Experience</Typography>
              {(!selectedUser.experiences || selectedUser.experiences.length === 0) ? (
                <Typography color="text.secondary">No training experience.</Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {selectedUser.experiences.map((exp) => (
                    <Typography key={exp.id}>
                      • {exp.trainingName} — {exp.provider} — {exp.date}
                    </Typography>
                  ))}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar sx={{ width: 120, height: 120, fontSize: 40 }}>
                {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
              </Avatar>
            </Grid>
          </Grid>
        </Paper>

        {/* Reject 对话框（放在根组件里，避免条件 Hook） */}
        <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Reject Application</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Please provide a reason for rejection. This will be shown to the user.
            </DialogContentText>
            <TextField
              autoFocus
              multiline
              minRows={3}
              fullWidth
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button onClick={confirmReject} color="error" disabled={submitting || !rejectReason.trim()}>
              Confirm Reject
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ========== 列表模式 ==========
  return (
    <Box sx={{ width: '100%', p: isMobile ? 1 : 3 }}>
      <AppBar position="static" elevation={0}
              sx={{ backgroundColor: 'white', color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider', mb: 2 }}>
        <Toolbar sx={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 2 : 0 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: isMobile ? 'center' : 'left' }}>
            All Users | {totalElements}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
            <Button variant="contained" startIcon={<AddIcon />}>Add User</Button>
          </Box>
        </Toolbar>
      </AppBar>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={2} sx={{ width: '100%', overflow: 'auto', position: 'relative' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
                     position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
            <CircularProgress />
          </Box>
        )}
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.align}
                    onClick={() => col.sortable && handleSort(col.id)}
                    sx={{ backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold',
                          cursor: col.sortable ? 'pointer' : 'default' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {col.label}
                      {col.sortable && (
                        <ArrowDownwardIcon
                          sx={{ fontSize: 16, ml: 0.5,
                                transform: orderBy === col.id && order === 'desc' ? 'rotate(180deg)' : 'none' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow hover key={user.id} onClick={() => handleViewUser(user)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>{user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.cardLevel}</TableCell>
                  <TableCell>{statusChip(user.status)}</TableCell>
                  <TableCell>
                    <Chip label={user.role} size="small"
                          color={user.role === 'ADMIN' ? 'primary' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <IconButton sx={{ color: 'primary.main' }} onClick={() => handleViewUser(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton sx={{ color: 'error.main' }} onClick={() => handleDeleteClick(user)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="body2">Showing {users.length} of {totalElements} users</Typography>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalElements}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </Paper>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} fullScreen={isMobile}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
