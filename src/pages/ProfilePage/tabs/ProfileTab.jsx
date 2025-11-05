import React, { useEffect, useMemo, useState } from "react";
import {
  Paper, Typography, Box, Divider, Button, Grid,
  TextField, MenuItem, Alert, CircularProgress,
} from "@mui/material";

// ✅ 使用你的请求封装
import api, { ApiError } from "../../../utils/api";

const levelName = (lvl) => {
  if (lvl === "1" || lvl === 1) return "Level 1 - Yolŋu Aware";
  if (lvl === "2" || lvl === 2) return "Level 2 - Yolŋu Informed";      
  if (lvl === "3" || lvl === 3) return "Level 3 - Yolŋu Competent";
  if (lvl === "4" || lvl === 4) return "Level 4 - Yolŋu Leader";
  return lvl ?? "-";
};
const fmtDate = (s) => {
  if (!s) return "-";
  const parts = s.split("-").map((p) => parseInt(p, 10));
  const [y, m = 1, d = 1] = parts;
  try {
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: parts.length >= 3 ? "2-digit" : undefined,
    });
  } catch {
    return s;
  }
};

export default function ProfileTab({ profile, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", cardLevel: "",
    streetAddress: "", suburb: "", state: "", postcode: "",
    photoUrl: "", yearOfBirth: "",
  });
  const [initial, setInitial] = useState(form);

  useEffect(() => {
    const p = profile || {};

    
    const next = {
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      email: p.email || "",
      cardLevel: (p.cardLevel ?? "").toString(),
      streetAddress: p.streetAddress || "",
      suburb: p.suburb || "",
      state: p.state || "",
      postcode: p.postcode || "",
      photoUrl: p.photoUrl || "",
      yearOfBirth: p.yearOfBirth ?? p.birthday ?? "",
    };
    setForm(next);
    setInitial(next);
  }, [profile]);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial]
  );

  const handleChange = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));
  const startEdit = () => { setMsg({ type: "", text: "" }); setEditing(true); };
  const cancelEdit = () => { setForm(initial); setEditing(false); setMsg({ type: "", text: "" }); };

  const save = async () => {
    console.log("123123");
    setMsg({ type: "", text: "" });

    if (!form.firstName || !form.lastName) {
      setMsg({ type: "error", text: "First/Last name can not be empty" });
      return;
    }
    if (form.yearOfBirth && (form.yearOfBirth < 1900 || form.yearOfBirth > 2100)) {
      setMsg({ type: "error", text: "Year of Birth should between（1900–2100）" });
      return;
    }

    const token = localStorage.getItem("authTokenAdmin");
    if (!token) {
      setMsg({ type: "error", text: "please login firstly" });
      return;
    }

    setSaving(true);
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        cardLevel: form.cardLevel,
        streetAddress: form.streetAddress,
        suburb: form.suburb,
        state: form.state,
        postcode: form.postcode,
        photoUrl: form.photoUrl,
        yearOfBirth: form.yearOfBirth ? Number(form.yearOfBirth) : 0,
      };
      console.log(body);
      console.log(token);
   
      // ✅ 用封装的 api.put 提交
      const updated = await api.put("/users/me", body, { token });

      // 若后端不返回体，fallback 用提交体
      const merged = updated && typeof updated === "object" ? updated : { ...profile, ...body };

      // 同步本地 & 退出编辑
      const next = {
        firstName: merged.firstName ?? form.firstName,
        lastName: merged.lastName ?? form.lastName,
        email: merged.email ?? form.email,
        cardLevel: (merged.cardLevel ?? form.cardLevel).toString(),
        streetAddress: merged.streetAddress ?? form.streetAddress,
        suburb: merged.suburb ?? form.suburb,
        state: merged.state ?? form.state,
        postcode: merged.postcode ?? form.postcode,
        photoUrl: merged.photoUrl ?? form.photoUrl,
        yearOfBirth: merged.yearOfBirth ?? form.yearOfBirth,
      };
      setInitial(next);
      setForm(next);
      setEditing(false);

      setMsg({ type: "success", text: "successfully saved data." });

      onUpdated && onUpdated(merged);
    } catch (e) {
      console.log(e);
      console.log("------------");
      if (e instanceof ApiError) {
        setMsg({ type: "error", text: `${e.code}: ${e.message}` });
      } else {
        setMsg({ type: "error", text: e.message || "failed to save data;" });
      }
    } finally {
      setSaving(false);
    }
  };

  const p = profile || {};

  return (
    <Paper className="card" variant="outlined">
      <Typography className="h6">Profile Information</Typography>

      {msg.text ? (
        <Box sx={{ mt: 1, mb: 1 }}>
          <Alert severity={msg.type === "error" ? "error" : "success"}>
            {msg.text}
          </Alert>
        </Box>
      ) : null}

      {/* 查看模式 */}
      {!editing && (
        <>
          <div className="kvGrid kvGrid--3">
            <div className="cell"><span className="label">First Name:</span> <b className="val">{p.firstName || "-"}</b></div>
            <div className="cell"><span className="label">Last Name:</span> <b className="val">{p.lastName || "-"}</b></div>
            <div className="cell"><span className="label">Year of Birth:</span> <b className="val">{p.yearOfBirth ?? p.birthday ?? "-"}</b></div>
          </div>

          <div className="kvRow"><span className="label">Card Level:</span> <b className="val">{levelName(p.cardLevel)}</b></div>
          <div className="kvRow"><span className="label">Street Address:</span> <b className="val">{p.streetAddress || "-"}</b></div>

          <div className="kvGrid kvGrid--3">
            <div className="cell"><span className="label">Suburb:</span> <b className="val">{p.suburb || "-"}</b></div>
            <div className="cell"><span className="label">State:</span> <b className="val">{p.state || "-"}</b></div>
            <div className="cell"><span className="label">Postcode:</span> <b className="val">{p.postcode || "-"}</b></div>
          </div>

          <div className="kvGrid kvGrid--3" style={{ marginTop: 8 }}>
            <div className="cell"><span className="label">Email:</span> <b className="val">{p.email || "-"}</b></div>
            <div className="cell"><span className="label">Photo URL:</span> <b className="val">{p.photoUrl || "-"}</b></div>
            <div className="cell" />
          </div>

          <Divider className="mt24 mb12" />
          <Typography className="h6">Training Experience</Typography>
          {(p.experiences && p.experiences.length > 0) ? (
            <Box className="expList">
              {p.experiences.map((exp) => (
                <Box key={exp.id} className="kvGroup">
                  <div className="kvRow"><span className="label">Training Undertaken:</span> <b className="val">{exp.trainingUndertaken || "-"}</b></div>
                  <div className="kvRow"><span className="label">Training Provider:</span> <b className="val">{exp.trainingProvider || "-"}</b></div>
                  <div className="kvRow"><span className="label">Dates of Training:</span> <b className="val">{fmtDate(exp.trainingDate)}</b></div>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ mt: 1 }}>No experience now</Typography>
          )}

          <Box className="btnWrap">
            <Button className="cta" variant="contained" onClick={startEdit}>
              Manage My Profile
            </Button>
          </Box>
        </>
      )}

      {/* 编辑模式 */}
{editing && (
  <>
    <div className="kvGrid kvGrid--3">
      <div className="cell"><span className="label">First Name:</span> <b className="val">{form.firstName || "-"}</b></div>
      <div className="cell"><span className="label">Last Name:</span> <b className="val">{form.lastName || "-"}</b></div>
      <div className="cell"><span className="label">Year of Birth:</span> <b className="val">{form.yearOfBirth || "-"}</b></div>
    </div>

    <div className="kvRow"><span className="label">Card Level:</span> <b className="val">{levelName(form.cardLevel)}</b></div>

    {/* 允许编辑的字段 */}
    <Box className="formRow">
      <TextField 
        label="Street Address" 
        value={form.streetAddress} 
        onChange={handleChange("streetAddress")} 
        fullWidth size="small" 
      />
    </Box>

    <Grid container spacing={3} className="formRow">
      <Grid item xs={12} md={4}>
        <TextField 
          label="Suburb" 
          value={form.suburb} 
          onChange={handleChange("suburb")} 
          fullWidth size="small" 
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField 
          label="State" 
          value={form.state} 
          onChange={handleChange("state")} 
          fullWidth size="small" 
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField 
          label="Postcode" 
          value={form.postcode} 
          onChange={handleChange("postcode")} 
          fullWidth size="small" 
        />
      </Grid>
    </Grid>

    <div className="kvGrid kvGrid--3" style={{ marginTop: 8 }}>
      <div className="cell"><span className="label">Email:</span> <b className="val">{form.email || "-"}</b></div>
      <div className="cell"><span className="label">Photo URL:</span> <b className="val">{form.photoUrl || "-"}</b></div>
      <div className="cell" />
    </div>

    <Divider className="mt24 mb12" />
    <Typography className="h6">Training Experience</Typography>
    {(profile.experiences && profile.experiences.length > 0) ? (
      <Box className="expList">
        {profile.experiences.map((exp) => (
          <Box key={exp.id} className="kvGroup">
            <div className="kvRow"><span className="label">Training Undertaken:</span> <b className="val">{exp.trainingUndertaken || "-"}</b></div>
            <div className="kvRow"><span className="label">Training Provider:</span> <b className="val">{exp.trainingProvider || "-"}</b></div>
            <div className="kvRow"><span className="label">Dates of Training:</span> <b className="val">{fmtDate(exp.trainingDate)}</b></div>
          </Box>
        ))}
      </Box>
    ) : (
      <Typography variant="body2" sx={{ mt: 1 }}>No experience now</Typography>
    )}

    <Box className="btnWrap" sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
      <Button 
        variant="contained" 
        className="cta" 
        onClick={save} 
        disabled={saving || !dirty}
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {saving ? "Saving…" : "Save Changes"}
      </Button>
      <Button variant="outlined" onClick={cancelEdit} disabled={saving}>Cancel</Button>
    </Box>
  </>
)}

    </Paper>
  );
}
