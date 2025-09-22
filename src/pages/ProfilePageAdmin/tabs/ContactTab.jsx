import React, { useState } from "react";
import {
  Box, Grid, Paper, Typography, IconButton, ButtonBase, Stack,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChatView from "./UserChat";

export default function ContactTab({ email = "admin@workingcard.com.au" }) {
  const [chatting, setChatting] = useState(false);

  if (chatting) {
    
    return <ChatView onBack={() => setChatting(false)} />;
  }

  return (
    <Box>
      <Typography className="h6" sx={{ mb: 2 }}>
        Contact Us
      </Typography>

      <Grid container spacing={3}>
        {/* Email 卡片 */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" className="card" sx={{ p: 3, height: 150, display: "flex", alignItems: "center" }}>
            <ButtonBase
              onClick={() =>
  window.open(
    `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`,
    "_blank"
  )
}
              sx={{ width: "100%", textAlign: "left", borderRadius: 2 }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%" }}>
                <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "grey.100",
                           display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MailOutlineIcon fontSize="large" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>Email</Typography>
                  <Typography variant="body1">{email}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>Reply within 2 business days</Typography>
                </Box>
              </Stack>
            </ButtonBase>
          </Paper>
        </Grid>

        {/* Reach Admin Online 卡片 */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" className="card" sx={{ p: 3, height: 150, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "grey.100",
                         display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ChatBubbleOutlineIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5 }}>Reach Admin Online</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Business Days</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Monday - Friday, 9AM - 4PM</Typography>
              </Box>
            </Stack>
            <IconButton
              aria-label="Go"
              onClick={() => setChatting(true)}
              sx={{
                bgcolor: "#f6c34b",
                "&:hover": { bgcolor: "#f0b728" },
                color: "#000",
                width: 44, height: 44,
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
