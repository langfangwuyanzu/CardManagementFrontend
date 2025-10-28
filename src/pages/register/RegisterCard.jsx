import React, { useState } from "react";
import { useEffect } from "react";
import "./register.css";

const API_BASE = "";

export default function RegisterCard() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    yob: "",
    level: "Level 1 - Culturally Aware",
    street: "",
    suburb: "",
    state: "",
    postcode: "",
    email: "",
    verifyCode: "",
    verificationToken: "",
    photo: undefined,
  });

  const [experiences, setExperiences] = useState([
    { training: "", provider: "", date: "" },
  ]);
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  useEffect(() => {
    if (!countdown) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  
  const handleExpChange = (i, k, v) => {
    const next = [...experiences];
    next[i][k] = v;
    setExperiences(next);
  };

  const sendVerification = async () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      alert("Please enter a valid email.");
      return;
    }
    try {
      const payload = { email: form.email.trim() };
      setSending(true);
      
      const res = await fetch(`${API_BASE}/api/auth/email/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setCountdown(data?.ttlSeconds || 60);
        setMessage("Verification code sent. Please check your email.");
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(err?.message || "Failed to send verification code.");
      }
    } catch (e) {
      setMessage("Network error. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  const checkCode = async () => {
    if (!form.verifyCode) return setMessage("Please input verification code.");
    try {
      const res = await fetch(`${API_BASE}/api/auth/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          code: form.verifyCode.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVerified(true);
        handleChange("verificationToken", data.token ?? "");
        setMessage("Verification successful ✔");
      } else {
        setVerified(false);
        handleChange("verificationToken", "");
        setMessage("The verification code is incorrect or has expired");
      }
    } catch (e) {
      setMessage(`Verification failed: ${e.message}`);
    }
  };

  const addExperience = () =>
    setExperiences((x) => [...x, { training: "", provider: "", date: "" }]);

 const onRegister = async (e) => {
  e.preventDefault();

  // 基本校验
  const email = (form.email || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    alert("Please enter a valid email.");
    return;
  }
  if (!form.verifyCode) {
    alert("Please enter the verification code.");
    return;
  }
  // if (!verified) {
  //   alert("Please verify your email first.");
  //   return;
  // }

  // 工具函数
  const trimOrNull = (v) => {
    const s = (v ?? "").toString().trim();
    return s === "" ? null : s;
  };
  const toYearOrNull = (v) => {
    const s = (v ?? "").toString().trim();
    if (s === "") return null;
    const n = Number(s);
    if (!Number.isInteger(n)) return null;
    // 可选：做个合理区间约束
    const thisYear = new Date().getFullYear();
    if (n < 1900 || n > thisYear) return null;
    return n;
  };
  const isoDateOrNull = (v) => {
    const s = (v ?? "").toString().trim();
    if (!s) return null;
    // 只接受 YYYY-MM-DD，避免 "" 或非 ISO 导致后端 LocalDate 反序列化报错
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  };

  // 组装 payload：为空就 null；后面会统一删除 null/空串键
  const payload = {
    firstName: trimOrNull(form.firstName),
    lastName: trimOrNull(form.lastName),
    yearOfBirth: toYearOrNull(form.yob),                     // ✅ 不再用 0
    cardLevel: trimOrNull(form.level)?.toUpperCase() ?? null, // ✅ 若后端是枚举更稳
    streetAddress: trimOrNull(form.street),
    suburb: trimOrNull(form.suburb),
    state: trimOrNull(form.state),
    postcode: trimOrNull(form.postcode),
    email,
    verifyCode: trimOrNull(form.verifyCode),
    photoUrl: null, // 文件上传请走单独接口；这里先不传
  };

  // experiences：只保留有内容的项；日期只发 ISO；全空的项过滤掉
  const exp = (experiences || [])
    .map((x) => {
      const trainingName = trimOrNull(x.training);
      const trainingProvider = trimOrNull(x.provider);
      const dateOfTraining = isoDateOrNull(x.date);
      if (!trainingName && !trainingProvider && !dateOfTraining) return null;
      const item = {};
      if (trainingName) item.trainingName = trainingName;
      if (trainingProvider) item.trainingProvider = trainingProvider;
      if (dateOfTraining) item.dateOfTraining = dateOfTraining;
      return item;
    })
    .filter(Boolean);
  if (exp.length) payload.experiences = exp;

  // 删除值为 null 或空串的键，避免触发后端 @NotBlank/@NotNull 或 LocalDate 解析异常
  Object.keys(payload).forEach((k) => {
    if (payload[k] === null || payload[k] === "") delete payload[k];
  });

  const url = typeof API_BASE === "string" && API_BASE
    ? `${API_BASE}/api/user/register`
    : "/api/user/register"; // ✅ 兼容走 Vite 代理

  try {
    setSubmitting(true);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 优先按 JSON 解析，失败再退回文本
    let bodyText = "";
    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await res.json().catch(() => null);
    } else {
      bodyText = await res.text().catch(() => "");
    }

    if (!res.ok) {
      // 尽量把后端错误细节展示出来
      const msg = data ? JSON.stringify(data) : (bodyText || "Unknown error");
      alert(`Registration failed (${res.status}): ${msg}`);
      return;
    }

    // 后端你的实现：验证码错/邮箱重复会返回 200 + { registered:false, message:... }
    const ok = data && data.registered;
    if (ok) {
      alert("Registration successful!");
      if (data.token) localStorage.setItem("authToken", data.token);
      // TODO: 跳转
      // window.location.href = "/home";
    } else {
      alert((data && data.message) || "Registration failed.");
    }
  } catch (err) {
    console.error(err);
    alert("Network error. Please try again later.");
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div className="cr-wrap">
      <header className="cr-header">
        <h1>Card Registration</h1>
      </header>

      <form className="cr-grid" onSubmit={onRegister}>
        {/* 左侧 */}
        <section className="cr-panel">
          <h2>Profile Information</h2>

          <div className="cr-row">
            <label>
              First Name<span>*</span>
            </label>
            <input
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              required
            />
          </div>

          <div className="cr-row">
            <label>
              Last Name<span>*</span>
            </label>
            <input
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              required
            />
          </div>

          <div className="cr-row">
            <label>
              Year of Birth<span>*</span>
            </label>
            <input
              value={form.yob}
              onChange={(e) => handleChange("yob", e.target.value)}
              placeholder="yyyy"
              required
            />
          </div>

          <div className="cr-row">
            <label>
              Card Level Being Applied<span>*</span>
            </label>
            <select
              value={form.level}
              onChange={(e) => handleChange("level", e.target.value)}
              required
            >
              <option>Level 1 - Culturally Aware</option>
              <option>Level 2 - Practitioner</option>
              <option>Level 3 - Specialist</option>
              <option>Level 4 - Manager</option>
            </select>
          </div>

          <div className="cr-row">
            <label>
              Street Address<span>*</span>
            </label>
            <input
              value={form.street}
              onChange={(e) => handleChange("street", e.target.value)}
              required
            />
          </div>

          <div className="cr-row cr-three">
            <div className="cr-cell">
              <label>
                Suburb<span>*</span>
              </label>
              <input
                value={form.suburb}
                onChange={(e) => handleChange("suburb", e.target.value)}
                required
              />
            </div>
            <div className="cr-cell">
              <label>
                State<span>*</span>
              </label>
              <input
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                required
              />
            </div>
            <div className="cr-cell">
              <label>
                Postcode<span>*</span>
              </label>
              <input
                value={form.postcode}
                onChange={(e) => handleChange("postcode", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="cr-row cr-two">
            <div className="cr-cell">
              <label>
                Email<span>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className="cr-cell cr-btn-cell">
              <label>&nbsp;</label>
              <button
                type="button"
                className="cr-btn"
                disabled={sending || countdown > 0}
                onClick={sendVerification}
              >
                {countdown > 0
                  ? `${countdown}s`
                  : sending
                  ? "sending..."
                  : "Send Code"}
              </button>
            </div>
          </div>

          <div className="cr-row">
            <label>
              Verify Code<span>*</span>
            </label>
            <input
              value={form.verifyCode}
              onChange={(e) => handleChange("verifyCode", e.target.value)}
              required
            />
            {/* <button
              type="button"
              className="cr-btn cr-ghost cr-small"
              onClick={checkCode}
            >
              Check
            </button> */}
            {verified && <span className="cr-ok">✔</span>}
          </div>

          <div className="cr-row">
            <label>
              Photo<span>*</span>
            </label>
            <div className="cr-upload">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleChange("photo", e.target.files?.[0])}
                required
              />
              <div className="cr-upload-hint" aria-hidden>
                📷
              </div>
            </div>
          </div>
        </section>

        {/* 右侧 */}
        <section className="cr-panel">
          <h2>Training Experience</h2>

          {experiences.map((exp, index) => (
            <div key={index}>
              <div className="cr-row">
                <label>
                  Training Undertaken{index === 0 && <span>*</span>}
                </label>
                <input
                  value={exp.training}
                  onChange={(e) => handleExpChange(index, "training", e.target.value)}
                  required={index === 0}
                />
              </div>

              <div className="cr-row">
                <label>
                  Training Provider{index === 0 && <span>*</span>}
                </label>
                <input
                  value={exp.provider}
                  onChange={(e) => handleExpChange(index, "provider", e.target.value)}
                  required={index === 0}
                />
              </div>

              <div className="cr-row">
                <label>
                  Dates of Training{index === 0 && <span>*</span>}
                </label>
                <input
                  placeholder="mm/yyyy"
                  value={exp.date}
                  onChange={(e) => handleExpChange(index, "date", e.target.value)}
                  required={index === 0}
                />
              </div>
              
              {index > 0 && (
                <button 
                  type="button" 
                  className="cr-remove-btn"
                  onClick={() => setExperiences(experiences.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <div className="cr-row">
            <button type="button" className="cr-add-btn" onClick={addExperience}>
              Add More Experience +
            </button>
          </div>

          <div className="cr-submit-row">
            <button className="cr-submit" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Register"}
            </button>
          </div>
        </section>
      </form>

      {message && <p className="cr-tip">{message}</p>}
    </div>
  );
}