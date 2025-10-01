import React, { useState, useEffect } from "react";
import { Paper, Typography, Box, Divider, Button, Grid, Avatar } from "@mui/material";
import api from "../../../utils/api";

const levelName = (lvl) => {
    if (lvl === "1" || lvl === 1) return "Level 1 - Yolŋu Aware";
    if (lvl === "2" || lvl === 2) return "Level 2 - Yolŋu Informed";
    if (lvl === "3" || lvl === 3) return "Level 3 - Yolŋu Competent";
    if (lvl === "4" || lvl === 4) return "Level 4 - Yolŋu Leader";
    return lvl ?? "-";
};

const fmtDate = (s) => {
    if (!s) return "-";
    try {
        return new Date(s).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    } catch {
        return s;
    }
};

export default function RenewalTab() {
    const [profile, setProfile] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        api.get("/users/me", { token }).then(setProfile).catch(console.error);
    }, []);

    // 提交成功后显示成功页
    if (success) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "calc(100vh - 64px)", // 去掉顶部 Banner 的高度
                    backgroundColor: "#fff",       // 统一背景，避免色差
                }}
            >
                <img
                    src="src/assets/renew_sucess.png"
                    alt="Success"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain", // 保持等比例缩放，不裁剪
                    }}
                />
            </Box>
        );
    }

    if (!profile) return <p>Loading profile…</p>;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Profile Information
            </Typography>

            <Grid container spacing={2}>
                {/* 左边信息 */}
                <Grid item xs={12} md={9}>
                    <Box className="kvGrid kvGrid--3" sx={{ mb: 1 }}>
                        <span><b>First Name:</b> {profile.firstName || "-"}</span>
                        <span><b>Last Name:</b> {profile.lastName || "-"}</span>
                        <span><b>Year of Birth:</b> {profile.yearOfBirth || "-"}</span>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                        <b>Card Level:</b> {levelName(profile.cardLevel)}
                    </Box>
                    <Box sx={{ mb: 1 }}>
                        <b>Street Address:</b> {profile.streetAddress || "-"}
                    </Box>
                    <Box className="kvGrid kvGrid--3" sx={{ mb: 1 }}>
                        <span><b>Suburb:</b> {profile.suburb || "-"}</span>
                        <span><b>State:</b> {profile.state || "-"}</span>
                        <span><b>Postcode:</b> {profile.postcode || "-"}</span>
                    </Box>
                </Grid>

                {/* 右边头像 */}
                <Grid item xs={12} md={3} sx={{ textAlign: "right" }}>
                    <Avatar
                        src={profile.photoUrl}
                        alt={profile.firstName}
                        sx={{ width: 120, height: 120, mx: "auto" }}
                    />
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6">Training Experience</Typography>
            {profile.experiences && profile.experiences.length > 0 ? (
                <Box sx={{ mt: 1 }}>
                    {profile.experiences.map((exp) => (
                        <Box key={exp.id} sx={{ mb: 1 }}>
                            <div><b>Training Undertaken:</b> {exp.trainingUndertaken}</div>
                            <div><b>Training Provider:</b> {exp.trainingProvider}</div>
                            <div><b>Dates of Training:</b> {fmtDate(exp.trainingDate)}</div>
                        </Box>
                    ))}
                </Box>
            ) : (
                <Typography variant="body2" sx={{ mt: 1 }}>
                    No experience now
                </Typography>
            )}

            <Box sx={{ mt: 3, textAlign: "center" }}>
                <Button
                    variant="contained"
                    sx={{
                        px: 4,
                        py: 1.2,
                        background: "linear-gradient(to right, #f9a825, #ff9800)",
                    }}
                    onClick={async () => {
                        try {
                            const token = localStorage.getItem("authToken");
                            const userId = localStorage.getItem("userId");
                            await api.post(`/renewal/${userId}`, {}, { token });
                            setSuccess(true); // 成功后切换页面
                        } catch (err) {
                            console.error(err);
                            alert("Renewal failed, please try again.");
                        }
                    }}
                >
                    Confirm My Profile & Renewal
                </Button>
            </Box>
        </Paper>
    );
}
