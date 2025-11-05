import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Typography, Chip, TextField, InputAdornment,
  AppBar, Toolbar, Button, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, useTheme, useMediaQuery, CircularProgress, Alert, Grid, Avatar
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, ArrowDownward as ArrowDownwardIcon,
  ArrowBack as ArrowBackIcon, Visibility as VisibilityIcon
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
  { id: 'view', label: 'VIEW', align: 'center', sortable: false },
];

export default function UserManagementSystem() {
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
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState(null); // 成功/失败提示

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const token = localStorage.getItem("authTokenAdmin");
  const authOpt = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  // 拉列表
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
      const res = await api.get("/users/userList", params, authOpt);
      console.log(res);
      setUsers(Array.isArray(res?.content) ? res.content : []);
      setTotalElements(Number.isFinite(res?.totalElements) ? res.totalElements : 0);
    } catch (e) {
      console.error(e);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, orderBy, order, searchTerm]);

  const statusChip = (s) => {
    if (s === 'APPROVED') return <Chip label="Approved" color="success" size="small" />;
    if (s === 'PENDING')  return <Chip label="Pending" color="warning" size="small" />;
    if (s === 'REJECTED') return <Chip label="Rejected" color="error" size="small" />;
    return <Chip label={s || 'Unknown'} size="small" />;
  };

  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
    setPage(0);
  };

  // 审批动作（只在详情页里触发）
  const doApprove = async (userId) => {
    try {
      setSubmitting(true);
      await api.post(`/users/${userId}/approve`, null, authOpt);
      setInfo({ type: 'success', text: 'Approved successfully.' });
      // 返回列表并刷新
      setSelectedUser(null);
      await getUserData();
    } catch (e) {
      console.error(e);
      setInfo({ type: 'error', text: 'Approve failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectDialog = () => setRejectOpen(true);

  const doReject = async (userId, reason) => {
    try {
      setSubmitting(true);
      await api.post(`/users/${userId}/reject`, { reason }, authOpt);
      setRejectOpen(false);
      setRejectReason('');
      setInfo({ type: 'success', text: 'Rejected successfully.' });
      // 返回列表并刷新
      setSelectedUser(null);
      await getUserData();
    } catch (e) {
      console.error(e);
      setInfo({ type: 'error', text: 'Reject failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ========== 详情页 ==========
  if (selectedUser) {
    const isPending = selectedUser.status === 'PENDING';

    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedUser(null)} sx={{ mb: 2 }}>
          Back
        </Button>

        {info && (
          <Alert severity={info.type} sx={{ mb: 2 }} onClose={() => setInfo(null)}>
            {info.text}
          </Alert>
        )}

        <Paper sx={{ p: 3, position: 'relative' }}>
          {/* 顶部操作：纯文字按钮（无对/错图标），仅 PENDING 可用 */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={openRejectDialog}
              disabled={!isPending || submitting}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              onClick={() => doApprove(selectedUser.id)}
              disabled={!isPending || submitting}
            >
              Approve
            </Button>
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Application Information {statusChip(selectedUser.status)}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography><b>First Name:</b> {selectedUser.firstName || '—'}</Typography>
              <Typography><b>Last Name:</b> {selectedUser.lastName || '—'}</Typography>
              <Typography><b>Email:</b> {selectedUser.email || '—'}</Typography>
              <Typography><b>Card Level:</b> {selectedUser.cardLevel || '—'}</Typography>
              <Typography><b>Address:</b> {selectedUser.streetAddress || '—'}, {selectedUser.suburb || '—'}</Typography>
              <Typography><b>State/Postcode:</b> {selectedUser.state || '—'} {selectedUser.postcode || ''}</Typography>
              <Typography><b>Expire Date:</b> {selectedUser.expireDate || '—'}</Typography>

              {selectedUser.rejectionReason && selectedUser.status === 'REJECTED' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Reject reason: {selectedUser.rejectionReason}
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar sx={{ width: 120, height: 120, fontSize: 40 }}>
                {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
              </Avatar>
            </Grid>
          </Grid>
        </Paper>

        {/* 拒绝弹窗（仅在详情页触发） */}
        <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Reject Application</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Please provide a reason for rejection. This will be shown to the user.
            </DialogContentText>
            <TextField
              multiline
              fullWidth
              minRows={3}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              color="error"
              disabled={!rejectReason.trim() || submitting}
              onClick={() => doReject(selectedUser.id, rejectReason)}
            >
              Confirm Reject
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ========== 列表页 ==========
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
            {/* <Button variant="contained" startIcon={<AddIcon />}>Add User</Button> */}
          </Box>
        </Toolbar>
      </AppBar>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={2} sx={{ width: '100%', overflow: 'auto', position: 'relative' }}>
        {loading && (
          <Box sx={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10
          }}>
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
                    sx={{
                      backgroundColor: 'primary.main', color: 'white', fontWeight: 'bold',
                      cursor: col.sortable ? 'pointer' : 'default'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {col.label}
                      {col.sortable && (
                        <ArrowDownwardIcon
                          sx={{
                            fontSize: 16, ml: 0.5,
                            transform: orderBy === col.id && order === 'desc' ? 'rotate(180deg)' : 'none'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((user) => (
                <TableRow hover key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>{user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.cardLevel}</TableCell>
                  <TableCell>{statusChip(user.status)}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setSelectedUser(user)}
                    >
                      View
                    </Button>
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
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
