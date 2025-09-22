import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  AppBar,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  ArrowDownward as ArrowDownwardIcon,
  Edit as EditIcon
} from '@mui/icons-material';

// API服务函数
const api = {
  get: async (url, params = {}) => {
    try {
      const response = await fetch(`http://localhost:8080${url}?${new URLSearchParams(params)}`, {
        headers: {
          'Authorization': `Bearer ${params.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
};

// 表头配置
const columns = [
  { id: 'id', label: 'ID', align: 'left', sortable: true },
  { id: 'firstName', label: 'FIRST NAME', align: 'left', sortable: true },
  { id: 'lastName', label: 'LAST NAME', align: 'left', sortable: true },
  { id: 'email', label: 'EMAIL', align: 'left', sortable: true },
  { id: 'cardLevel', label: 'LEVEL', align: 'left', sortable: true },
  { id: 'role', label: 'ROLE', align: 'left', sortable: true },
  { id: 'actions', label: 'ACTIONS', align: 'center', sortable: false },
];

export default function UserManagementSystem() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 获取用户数据
  const fetchUsers = async (pageNum, size) => {
    try {
      setLoading(true);
      setError(null);
      // 这里需要替换为实际的token获取方式
      const token = localStorage.getItem('authToken');
      const data = await api.get("/api/users/userList", { 
        page: pageNum, 
        size: size,
        token 
      });
      
      setUsers(data.content);
      setTotalElements(data.totalElements);
      setPage(data.number);
      setRowsPerPage(data.size);
    } catch (err) {
      setError('Failed to fetch users: ' + err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, rowsPerPage);
  }, [page, rowsPerPage]);

  // 处理排序
  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  // 处理删除对话框打开
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    try {
      // 在实际应用中，这里会调用API删除用户
      console.log('Deleting user:', selectedUser);
      // 删除成功后重新获取数据
      await fetchUsers(page, rowsPerPage);
    } catch (err) {
      setError('Failed to delete user: ' + err.message);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  // 处理删除取消
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  // 处理页码变化
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // 处理每页行数变化
  const handleChangeRowsPerPage = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setRowsPerPage(newSize);
    setPage(0);
    fetchUsers(0, newSize);
  };

  // 过滤数据
  const filteredData = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.cardLevel && user.cardLevel.toString().includes(searchTerm))
  );

  // 排序数据
  const sortedData = [...filteredData].sort((a, b) => {
    if (order === 'asc') {
      return a[orderBy] < b[orderBy] ? -1 : 1;
    } else {
      return a[orderBy] > b[orderBy] ? -1 : 1;
    }
  });

  return (
    <Box sx={{ 
      width: '100%', 
      p: isMobile ? 1 : 3,
      // 移动设备特定样式
      '& .MuiTableCell': {
        padding: isMobile ? '8px 4px' : '16px',
        fontSize: isMobile ? '0.75rem' : '0.875rem'
      },
      '& .MuiChip-root': {
        fontSize: isMobile ? '0.7rem' : '0.8125rem'
      },
      '& .MuiButton-root': {
        fontSize: isMobile ? '0.75rem' : '0.875rem'
      }
    }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'white', 
          color: 'text.primary',
          borderBottom: '1px solid',
          borderBottomColor: 'divider',
          mb: 2
        }}
      >
        <Toolbar sx={{ 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 2 : 0
        }}>
          <Typography variant="h6" component="div" sx={{ 
            flexGrow: isMobile ? 0 : 1,
            textAlign: isMobile ? 'center' : 'left',
            fontSize: isMobile ? '1.1rem' : '1.25rem'
          }}>
            All Users | {totalElements}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1 : 2,
            width: isMobile ? '100%' : 'auto'
          }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                width: isMobile ? '100%' : 250,
                '& .MuiInputBase-input': {
                  fontSize: isMobile ? '0.8rem' : '0.875rem'
                }
              }}
            />
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ 
                borderRadius: 2,
                whiteSpace: 'nowrap',
                minWidth: isMobile ? '100%' : 'auto'
              }}
            >
              Add User
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ 
        width: '100%', 
        overflow: 'auto',
        maxHeight: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 200px)',
        position: 'relative'
      }}>
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10
          }}>
            <CircularProgress />
          </Box>
        )}
        
        <TableContainer>
          <Table stickyHeader aria-label="user table" size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: column.sortable ? 'pointer' : 'default',
                      fontSize: isMobile ? '0.7rem' : '0.875rem',
                      py: isMobile ? 1 : 2
                    }}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {column.label}
                      {column.sortable && (
                        <ArrowDownwardIcon 
                          sx={{ 
                            fontSize: isMobile ? 14 : 16, 
                            ml: 0.5,
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
              {sortedData.map((user) => (
                <TableRow hover key={user.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ 
                    fontWeight: 'medium',
                    maxWidth: isMobile ? 80 : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.id}
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'medium',
                    maxWidth: isMobile ? 100 : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.firstName}
                  </TableCell>
                  <TableCell sx={{ 
                    maxWidth: isMobile ? 100 : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.lastName}
                  </TableCell>
                  <TableCell sx={{ 
                    maxWidth: isMobile ? 120 : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.cardLevel || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      size="small" 
                      color={user.role === 'ADMIN' ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      aria-label="edit"
                      size={isMobile ? "small" : "medium"}
                      sx={{ color: 'primary.main', mr: 1 }}
                    >
                      <EditIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                    <IconButton 
                      aria-label="delete"
                      onClick={() => handleDeleteClick(user)}
                      sx={{ color: 'error.main' }}
                      size={isMobile ? "small" : "medium"}
                    >
                      <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          gap: isMobile ? 2 : 0
        }}>
          <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            Showing {sortedData.length} of {totalElements} users
          </Typography>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalElements}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }
            }}
          />
        </Box>
      </Paper>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullScreen={isMobile}
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete user <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}