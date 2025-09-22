import { useState, useEffect } from "react";
import "./login.css";
import leftImage from "./Login-left.png";
import { useNavigate } from "react-router-dom";

// 👇 这里直接写死你的本地后端地址
// const API_BASE = "http://localhost:8080";
const API_BASE = ""; // ✅
// ✅ 使用你的请求封装
import api, { ApiError } from "../../utils/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!countdown) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // 👇 Send Code 按钮调用后端
  const onSendCode = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg({ type: "error", text: "Please enter a valid email." });
      return;
    }
    try {
      setSending(true);
      setMsg(null);

      const res = await fetch(`${API_BASE}/api/auth/email/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setCountdown(data?.ttlSeconds || 60);
        setMsg({
          type: "success",
          text: "Verification code sent. Please check your email",
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg({
          type: "error",
          text: err?.message || "Failed to send verification code.",
        });
      }
    } catch (e) {
      setMsg({ type: "error", text: "Network error. Please try again later." });
    } finally {
      setSending(false);
    }
  };

  const onLogin = async (e) => {
    e.preventDefault();
    if (!email || !code) {
      setMsg({
        type: "error",
        text: "Please enter both email and verification code.",
      });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (data.verified) {
        console.log(data,111111111);
        setMsg({ type: "success", text: "success " });
        // 👉 可以把 token 保存到 localStorage / cookie
        localStorage.setItem("authToken", data.token);
        const token = data.token;
        const userData = await api.get("/users/me", { token });
        
        // 跳转到 profile 页面
        if(userData.role == "USER"){
          navigate("/profile");
        }else if(userData.role == "ADMIN"){
          navigate("/profileAdmin");
        }
        
      } else {
        console.log(e);
        setMsg({
          type: "error",
          text: "Invalid or expired verification code.",
        });
      }
    } catch (e) {
      console.log(e);
      console.log(e, JSON.stringify({ email, code }));
      setMsg({ type: "error", text: "Network error. Please try again later." });
    }
  };

  return (
    <div className="yl-login">
      <div
        className="yl-login__left"
        style={{ backgroundImage: `url(${leftImage})` }}
      />
      <div className="yl-login__right">
        <div className="yl-login__card">
          <h1 className="yl-login__title">Welcome Back!</h1>

          {msg && (
            <div className={`yl-login__message yl-login__message--${msg.type}`}>
              {msg.text}
            </div>
          )}

          <form className="yl-login__form" onSubmit={onLogin}>
            <div className="yl-login__row">
              <div className="yl-login__field">
                <label className="yl-login__label">Email</label>
                <input
                  className="yl-login__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="button"
                className="yl-login__send"
                onClick={onSendCode}
                disabled={sending || countdown > 0}
              >
                {countdown > 0
                  ? `${countdown}s`
                  : sending
                  ? "sending..."
                  : "Send Code"}
              </button>
            </div>

            <div className="yl-login__field">
              <label className="yl-login__label">Verify Code</label>
              <input
                className="yl-login__input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="please input your verification code"
              />
            </div>

            <button type="submit" className="yl-login__btn">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}