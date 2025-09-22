// src/utils/api.js

// --- Base URL ---
// 优先用 Vite 环境变量（.env 里配置 VITE_API_BASE）
// 其次用相对 /api（开发期由 vite 代理到后端 http://localhost:8080）
// 生产环境直接把 VITE_API_BASE 设置为你的 Azure 地址，如：
// VITE_API_BASE=https://yolngu-backend.azurewebsites.net
// const API_BASE =
//   (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
//   "/api";
// const API_BASE = "http://localhost:8080";
const API_BASE = "/api";

// --- 超时控制 ---
function withTimeout(promise, ms = 15000, msg = "Request timeout") {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(msg)), ms);
    promise
      .then((res) => {
        clearTimeout(id);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

// --- 统一请求封装 ---
async function request(path, { method = "GET", data, headers = {}, token, timeout = 15000 } = {}) {
  const url = `${API_BASE}${path}`;

  const h = {
    Accept: "application/json",
    ...headers,
  };

  // 自动挂 JWT（如果有）
  if (token) h.Authorization = `Bearer ${token}`;

  const init = { method, headers: h, credentials: "include" };

  if (data !== undefined) {
    // 如果是 FormData，直接发送；否则 JSON
    if (data instanceof FormData) {
      init.body = data;
      // 让浏览器自动设置 multipart 边界，不要手动设置 Content-Type
    } else {
      h["Content-Type"] = "application/json";
      init.body = JSON.stringify(data);
    }
  }

  let resp;
  try {
    resp = await withTimeout(fetch(url, init), timeout);
  } catch (e) {
    // 网络/超时
    throw new ApiError("NETWORK_ERROR", e.message, { url, method });
  }

  // 解析 body（可能为空）
  let payload = null;
  const text = await resp.text();
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (e) {
    // 非 JSON 响应
    payload = text;
  }

  if (!resp.ok) {
    // 统一错误对象
    const code = payload?.code || resp.status;
    const message = payload?.message || payload?.error || resp.statusText || "Request failed";
    throw new ApiError(code, message, { url, method, payload });
  }

  return payload;
}

// --- 语义化方法 ---
const get = (path, opts = {}) => request(path, { ...opts, method: "GET" });
const post = (path, data, opts = {}) => request(path, { ...opts, method: "POST", data });
const put = (path, data, opts = {}) => request(path, { ...opts, method: "PUT", data });
const del = (path, opts = {}) => request(path, { ...opts, method: "DELETE" });

// --- 业务级 API ---
export const AuthApi = {
  // 发送邮箱验证码
  sendCode(email) {
    return post("/auth/email/send-code", { email: String(email).trim() });
  },
  // 校验验证码
  verify(email, code) {
    return post("/auth/email/verify", { email: String(email).trim(), code: String(code).trim() });
  },
};

export const RegisterApi = {
  // 提交注册（示例：JSON 直传；如果带照片可改为 FormData 版本，见下面注释）
  submit(payload) {
    return post("/register", payload);
  },

  // 如果需要上传照片（FormData 示例）
  // submitWithPhoto({ profile, experiences, verificationToken, file }) {
  //   const fd = new FormData();
  //   fd.append("profile", new Blob([JSON.stringify(profile)], { type: "application/json" }));
  //   fd.append("experiences", new Blob([JSON.stringify(experiences)], { type: "application/json" }));
  //   fd.append("verificationToken", verificationToken);
  //   if (file) fd.append("photo", file);
  //   return post("/register", fd); // request() 会自动识别 FormData
  // },
};

// --- 自定义错误类 ---
export class ApiError extends Error {
  constructor(code, message, extra) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.extra = extra;
  }
}

// --- 默认导出一些常用工具（可选） ---
const api = { request, get, post, put, del, AuthApi, RegisterApi };
export default api;
