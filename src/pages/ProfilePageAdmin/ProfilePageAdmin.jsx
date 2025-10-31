import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Box, Grid, Typography, List, ListItemIcon, ListItemText,
  ListItemButton, Drawer, IconButton, useMediaQuery, Alert,
  CircularProgress, Stack, Avatar
} from "@mui/material";
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useTheme } from "@mui/material/styles";
import {
  Menu as MenuIcon, AccountCircle, Autorenew, Upgrade,
  CreditCard, ContactMail, Chat
} from "@mui/icons-material";
import "./ProfilePageAdmin.css";
import bannerImg from "../../assets/profile/banner.png";

// ✅ 使用你的请求封装
import api, { ApiError } from "../../utils/api";

const NAV = [
  { key: "profile", label: "Home", icon: <AccountCircle /> },
  { key: "renewal", label: "Application", icon: <Autorenew /> },
  { key: "upgrade", label: "Issue Card", icon: <Upgrade /> },
  { key: "card", label: "Notification", icon: <CreditCard /> },
  { key: "contact", label: "Message", icon: <ContactMail /> },
  // { key: "message", label: "Payment", icon: <Chat /> },
];

// 懒加载各 Tab
const TabsMap = {
  profile: lazy(() => import("./tabs/ProfileTab")),
  renewal: lazy(() => import("./tabs/RenewalTab")),
  upgrade: lazy(() => import("./tabs/UpgradeTab")),
  card: lazy(() => import("./tabs/DigitalCardTab")),
  contact: lazy(() => import("./tabs/ContactTab")),
  // message: lazy(() => import("./tabs/MessageTab")),
};

const levelName = (lvl) => {
  if (lvl === "1" || lvl === 1) return "Level 1 - Yolŋu Aware";
  if (lvl === "2" || lvl === 2) return "Level 2 - Yolŋu Informed";
  if (lvl === "3" || lvl === 3) return "Level 3 - Yolŋu Competent";
  if (lvl === "4" || lvl === 4) return "Level 4 - Yolŋu Leader";
  return lvl ?? "-";
};

function SideNav({ activeKey, onClick }) {
  return (
    <List className="navList">
      {NAV.map((i) => {
        const selected = i.key === activeKey;
        return (
          <ListItemButton
            key={i.key}
            selected={selected}
            className={`navItem ${selected ? "navItem--active" : ""}`}
            onClick={() => onClick?.(i.key)}
          >
            <ListItemIcon
              className={`navIcon ${selected ? "navIcon--active" : ""}`}
            >
              {i.icon}
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{
                className: selected ? "navText--active" : "",
              }}
              primary={i.label}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

export default function ProfilePageAdmin() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(NAV[0].key);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState({
    name: '',
    level: 'Level ',
    avatarUrl: 'https://example.com/avatar.jpg'
  });
  const ActiveComp = useMemo(
    () => TabsMap[activeKey] ?? TabsMap.profile,
    [activeKey]
  );

  useEffect(() => {

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("没有登录信息，请先登录");
      setLoading(false);
      navigate("/login");
      return;
    }
    (async () => {
      try {
        // ✅ 用封装的 api.get
        const data = await api.get("/users/me", { token });
        console.log(data, 'me')
        localStorage.setItem("userId", data.id);
        setProfile(data);
        setUser({
          name: data.firstName + " " + data.lastName,
          level: 'Level ' + data.cardLevel,
          avatarUrl: data.avatarUrl || 'https://example.com/avatar.jpg'
        });
      } catch (e) {
        if (e instanceof ApiError) {
          setError(`${e.code}: ${e.message}`);
        } else {
          setError(e.message || "加载失败");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);



  const Banner = () => {
    const firstName = profile?.firstName || "";
    const lastName = profile?.lastName || "";
    const lv = levelName(profile?.cardLevel);
    return (
      <Box className="banner" style={{ backgroundImage: `url(${bannerImg})` }}>
        <div className="bannerMask">
          <Typography className="bannerTitle">
            Hello {firstName || lastName ? `${firstName} ${lastName}`.trim() : "there"}!
          </Typography>
          <Typography className="bannerSub">
            Welcome back! Our <b>{lv}</b> cardholder.
          </Typography>
        </div>
      </Box>
    );
  };

  return (
    <Box className="pageRoot">
      {!isMdUp && (
        <Box className="topbar">
          <IconButton onClick={() => setOpen(true)} aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Typography className="topbarTitle">Profile</Typography>
        </Box>
      )}

      <Grid container className="shell">
        {isMdUp && (
          <Grid item md={3} lg={2} className="sidebar">
            <SideNav activeKey={activeKey} onClick={setActiveKey} />
          </Grid>
        )}

        <Grid item xs={12} md={9} lg={10} className="mainCol">
          <Box className="mainInner">
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              justifyContent="flex-end"  // 关键：靠右对齐
              sx={{ backgroundColor: '#fff', p: 1.5, borderRadius: 2 }}
            >
              {/* Icons */}
              <Stack direction="row" spacing={1}>
                <IconButton>
                  <MailOutlineIcon />
                </IconButton>
                <IconButton>
                  <NotificationsNoneIcon />
                </IconButton>
              </Stack>

              {/* Avatar + User Info */}
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  alt={user.name}
                  src={user.avatarUrl}
                  sx={{ width: 40, height: 40 }}
                />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {user.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.level}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {/* <Banner /> */}

            {loading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                <CircularProgress size={20} /> <span>Loading…</span>
              </Box>
            )}
            {!!error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {!loading && !error && (
              <Suspense fallback={<div style={{ padding: 16 }}>Loading tab…</div>}>
                {activeKey === "profile" ? (
                  <ActiveComp profile={profile} onUpdated={setProfile} />
                ) : activeKey === "card" ? (
                  <ActiveComp profile={profile} />
                ) : (
                  <ActiveComp />
                )}
              </Suspense>
            )}
          </Box>
        </Grid>
      </Grid>

      <Drawer
        open={!isMdUp && open}
        onClose={() => setOpen(false)}
        PaperProps={{ className: "drawer" }}
      >
        <Box className="drawerHeader">Menu</Box>
        <SideNav
          activeKey={activeKey}
          onClick={(k) => {
            setActiveKey(k);
            setOpen(false);
          }}
        />
      </Drawer>
    </Box>
  );
}
