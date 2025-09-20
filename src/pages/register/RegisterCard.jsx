import React, { useState } from "react";
import { useEffect } from "react";
import "./register.css"; // 一定要确保这行存在
const API_BASE = "http://localhost:8080";

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
    console.log(form);

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      // setMessage( "Please enter a valid email." );
      alert("Please enter a valid email.");
      return;
    }
    try {
      const payload = { email: form.email.trim() };

      console.log(payload);

      const res = await fetch(`${API_BASE}/api/auth/email/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(res);
      setMessage("Pleasing wait.");

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setCountdown(data?.ttlSeconds || 60);
        // setMessage({ type: "success", text: "Verification code sent. Please check your email" });
        setMessage(
          "Please enter a valid Verification code sent. Please check your email."
        );
      } else {
        const err = await res.json().catch(() => ({}));
        // setMessage({ type: "error", text: err?.message || "Failed to send verification code." });
        setMessage("Failed to send verification code.");
      }
    } catch (e) {
      // setMessage({ type: "error", text: "Network error. Please try again later." });
    } finally {
      // setSending(false);
    }
  };

  const checkCode = async () => {
    if (!form.verifyCode) return setMessage("Please input verfication code.");
    try {
      const res = await fetch(`${API_BASE}/api/auth/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          code: form.verifyCode.trim(),
        }),
      });

      console.log(res);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (res.ok) {
        setVerified(true);
        handleChange("verificationToken", data.token ?? "");
        setMessage("success ✔");
      } else {
        setVerified(false);
        handleChange("verificationToken", "");
        setMessage("The verification code is incorrect or has expired");
      }
    } catch (e) {
      console.log(e);
      setMessage(`验证失败：${e}`);
    }
  };

  const addExperience = () =>
    setExperiences((x) => [...x, { training: "", provider: "", date: "" }]);

  // 顶部：直连后端 8080
  const API_BASE = "http://localhost:8080";

  // 点击 Register 时调用
  const onRegister = async (e) => {
    e.preventDefault();

    // 1) 基本校验（可按需扩展）
    if (!/^\S+@\S+\.\S+$/.test(form.email || "")) {
      alert("Please enter a valid email.");
      return;
    }
    form.code =  form.verifyCode;
    if (!form.code) {
      alert("Please enter the verification code.");
      return;
    }

    // 2) 组装 payload（与后端 DTO 完全一致）
    const payload = {
      firstName: (form.firstName || "").trim(),
      lastName: (form.lastName || "").trim(),
      yearOfBirth: Number(form.yearOfBirth) || 0,
      cardLevel: (form.cardLevel || "").trim(),
      streetAddress: (form.streetAddress || "").trim(),
      suburb: (form.suburb || "").trim(),
      state: (form.state || "").trim(),
      postcode: (form.postcode || "").trim(),
      email: (form.email || "").trim(),
      verifyCode: (form.code || "").trim(), // ← 你输入的验证码
      photoUrl: form.photoUrl || "",
      experiences: (form.experiences || []).map((x) => ({
        trainingName: (x.trainingName || "").trim(),
        trainingProvider: (x.trainingProvider || "").trim(),
        // 保证是 YYYY-MM-DD（如果你用 <input type="date" /> 直接就是这个格式）
        dateOfTraining:
          typeof x.dateOfTraining === "string"
            ? x.dateOfTraining
            : x.dateOfTraining?.toISOString?.().slice(0, 10),
      })),
    };

    try {
      // 3) 调注册接口
      const res = await fetch(`${API_BASE}/api/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        alert(`Server error (${res.status}): ${text || "Unknown error"}`);
        return;
      }

      const data = await res.json();

      // 4) 按返回结构处理
      if (data.registered) {
        alert("Registration successful!");
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }
        // 可选：跳转
        // window.location.href = "/home";
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again later.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.verificationToken)
      return setMessage("Please complete email verification first");
    setSubmitting(true);
    try {
      // TODO: /api/register 就绪后打开
      // await fetch("/api/register", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ... }) });
      setMessage("已提交（demo），后端接口就绪后将真正保存。");
    } catch (e) {
      setMessage(`提交失败：${e}`);
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
            />
          </div>

          <div className="cr-row">
            <label>
              Last Name<span>*</span>
            </label>
            <input
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
            />
          </div>

          {/* 新的：同一行内联，所有控件统一 38px 高度 */}
          <div className="cr-row cr-inline">
            <label className="cr-lb-short">
              Year of Birth<span>*</span>
            </label>
            <input
              className="cr-inp-short"
              value={form.yob}
              onChange={(e) => handleChange("yob", e.target.value)}
              placeholder="yyyy"
            />

            <label className="cr-lb-level">
              Card Level Being Applied<span>*</span>
            </label>
            <select
              className="cr-sel-level"
              value={form.level}
              onChange={(e) => handleChange("level", e.target.value)}
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
              />
            </div>
            <div className="cr-cell">
              <label>
                State<span>*</span>
              </label>
              <input
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
              />
            </div>
            <div className="cr-cell">
              <label>
                Postcode<span>*</span>
              </label>
              <input
                value={form.postcode}
                onChange={(e) => handleChange("postcode", e.target.value)}
              />
            </div>
          </div>

          <div className="cr-row cr-two">
            <div className="cr-cell">
              <label>
                Email<span>*</span>
              </label>
              <input
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
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
            />
            <button
              type="button"
              className="cr-btn cr-ghost cr-small"
              onClick={checkCode}
            >
              Check
            </button>
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
              />
              <div className="cr-upload-hint" aria-hidden>
                📈
              </div>
            </div>
          </div>
        </section>

        {/* 右侧 */}
        <section className="cr-panel">
          <h2>Training Experience</h2>

          <div className="cr-row">
            <label>
              Training Undertaken<span>*</span>
            </label>
            <input
              value={experiences[0].training}
              onChange={(e) => handleExpChange(0, "training", e.target.value)}
            />
          </div>

          <div className="cr-row">
            <label>
              Training Provider<span>*</span>
            </label>
            <input
              value={experiences[0].provider}
              onChange={(e) => handleExpChange(0, "provider", e.target.value)}
            />
          </div>

          <div className="cr-row cr-two">
            <div className="cr-cell">
              <label>
                Dates of Training<span>*</span>
              </label>
              <input
                placeholder="mm/yyyy"
                value={experiences[0].date}
                onChange={(e) => handleExpChange(0, "date", e.target.value)}
              />
            </div>
            <div className="cr-cell cr-link-cell">
              <button type="button" className="cr-link" onClick={addExperience}>
                Add More Experience+
              </button>
            </div>
          </div>

          <div className="cr-submit-row">
            <button className="cr-submit" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </section>
      </form>

      {message && <p className="cr-tip">{message}</p>}
    </div>
  );
}
