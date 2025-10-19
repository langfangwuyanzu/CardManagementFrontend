// UserDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Avatar,
  Grid,
  Chip,
  Alert,
} from "@mui/material";

export default function UserDetail() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 获取当前登录用户信息
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No token found");

      const res = await fetch("/api/users/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const data = await res.json();
      console.log("✅ 当前用户信息:", data);
      setUser(data);
    } catch (err) {
      console.error("❌ 获取用户信息失败:", err);
      setError("无法获取当前用户信息，请检查登录状态或服务器连接。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // ✅ 加载中
  if (loading)
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );

  // ✅ 出错提示
  if (error)
    return (
      <Box sx={{ p: 3 }}>
        <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          {"< Back"}
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  // ✅ 成功显示用户资料
  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        {"< BACK"}
      </Button>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Profile Information{" "}
              {user.enabled ? (
                <Chip size="small" label="Active" color="success" />
              ) : (
                <Chip size="small" label="Inactive" />
              )}
            </Typography>

            <Typography sx={{ mb: 1 }}>ID: {user.id}</Typography>
            <Typography sx={{ mb: 1 }}>
              Name: {user.firstName} {user.lastName}
            </Typography>
            <Typography sx={{ mb: 1 }}>Email: {user.email}</Typography>
            <Typography sx={{ mb: 1 }}>
              Role: {user.role || "USER"}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              Card Level: {user.cardLevel || "N/A"}
            </Typography>
            <Typography sx={{ mb: 1 }}>
              Address:{" "}
              {user.streetAddress
                ? `${user.streetAddress}, ${user.suburb}, ${user.state} ${user.postcode}`
                : "—"}
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <Avatar sx={{ width: 144, height: 144, fontSize: 40 }}>
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </Avatar>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
