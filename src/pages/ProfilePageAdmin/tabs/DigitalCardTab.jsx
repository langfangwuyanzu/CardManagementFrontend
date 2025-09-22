// src/pages/ProfilePage/tabs/DigitalCardTab.jsx
import React, { useEffect, useMemo, useState } from "react";

// 整张卡片背景图（你的新路径）
import L1 from "../../../assets/profile/digitalCard/Level1.png";
import L2 from "../../../assets/profile/digitalCard/Level2.png";
import L3 from "../../../assets/profile/digitalCard/Level3.png";
import L4 from "../../../assets/profile/digitalCard/Level4.png";
import ConanImg from "../../../assets/profile/images.jpeg";
const levelImg = { 1: L1, 2: L2, 3: L3, 4: L4 };

// 工具函数
const levelName = (lvl) => {
  if (lvl === "1" || lvl === 1) return "Level 1 – Culturally Aware";
  if (lvl === "2" || lvl === 2) return "Level 2 – Yolŋu Informed";
  if (lvl === "3" || lvl === 3) return "Level 3 – Conversing in Yolŋu Matha";
  if (lvl === "4" || lvl === 4) return "Level 4 – Leading with Yolŋu";
  return lvl ? `Level ${lvl}` : "—";
};
const fmtDate = (s) => {
  if (!s) return "";
  const p = s.split("-").map((x) => parseInt(x, 10));
  const [y, m = 1, d = 1] = p;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: p.length >= 3 ? "2-digit" : undefined,
  });
};
const defaultValidTo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function DigitalCardTab({ profile: profileProp }) {
  const [profile, setProfile] = useState(profileProp || null);

  // 拉取用户（改成你的后端地址即可）
  useEffect(() => {
    if (profileProp) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setProfile(await res.json());
      } catch {}
    })();
  }, [profileProp]);

  const { firstName, lastName, photoUrl, id, cardLevel, validTo } =
    profile || {};
  const displayName =
    firstName || lastName
      ? `${firstName || ""} ${lastName || ""}`.trim()
      : "Gregory Franks";
  const displayId = id ? String(id).padStart(10, "0") : "0000000001";
  const displayLevel = levelName(cardLevel || 1);
  const displayValidTo = validTo ? fmtDate(validTo) : defaultValidTo();
  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    return (
      parts
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join("") || "GF"
    );
  }, [displayName]);

  const lvl = (cardLevel && parseInt(cardLevel, 10)) || 1;
  const bgImg = levelImg[lvl] || L1;

  return (
    <div className="dc-root">
      <style>{css}</style>

      <div className="dc-row two-cols">
        {/* 左：数字卡片（纯 CSS 布局） */}
        <div className="col">
          <div className="card">
            <div className="card-frame">
              {/* 整张背景图 —— 铺满且不变形 */}
              <img src={bgImg} alt="" className="card-bg" />

              {/* 内容层：叠在背景图上 */}
              <div className="card-content">
                <div className="fields">
                  <div className="kv">
                    <span className="k">Name </span>
                    <span className="v">{displayName}</span>
                  </div>
                  <div className="kv">
                    <span className="k">ID </span>
                    <span className="v">{displayId}</span>
                  </div>

                  <div className="pill">{displayLevel}</div>
                  <div className="valid">Valid to {displayValidTo}</div>
                </div>

                {/* 头像（无 MUI） */}
                {/* <div className="avatar-wrap">
                  {photoUrl ? (
                    <img className="avatar" src={photoUrl} alt={displayName} />
                  ) : (
                    <div className="avatar">{initials}</div>
                  )}
                </div> */}

                <div className="avatar-wrap">
                  {photoUrl ? (
                    // <img className="avatar" src={photoUrl} alt={displayName} />
                    <img className="avatar" src={ConanImg} alt="Conan Edogawa" />
                     
                  ) : (
                    <img className="avatar" src={ConanImg} alt="Conan Edogawa" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右：说明面板（简化为原生 HTML + CSS） */}
        <div className="col">
          <div className="panel">
            <div className="panel-title">
              Recognises cultural training for non-Yolŋu people to prepare for
              work in East Arnhem.
            </div>
            <hr className="hr" />
            <div className="bullet">
              <div className="bullet-tt">Level 1 – Culturally Aware</div>
              <div className="bullet-tx">
                Awareness of Aboriginal and Torres Strait Islander beliefs,
                knowledge, and impacts of colonisation.
              </div>
            </div>
            <div className="bullet">
              <div className="bullet-tt">Level 2 – Yolŋu Informed</div>
              <div className="bullet-tx">
                Key understanding of Yolŋu culture, worldview, and effective
                engagement.
              </div>
            </div>
            <div className="bullet">
              <div className="bullet-tt">
                Level 3 – Conversing in Yolŋu Matha
              </div>
              <div className="bullet-tx">
                Basic conversational skills, showing commitment to relationships
                and respect.
              </div>
            </div>
            <div className="bullet">
              <div className="bullet-tt">Level 4 – Leading with Yolŋu</div>
              <div className="bullet-tx">
                Management skills to ensure safe and culturally respectful
                workplaces.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 下方介绍（保留） */}
      <div className="h-xl">Working with Yolŋu Card</div>
      <div className="sub" style={{ marginTop: 6 }}>
        The Working with Yolŋu card recognises cultural training undertaken by
        ‘Balanda’, non-Yolŋu people, to prepare you for working in the East
        Arnhem region.
      </div>
      <p className="p" style={{ marginTop: 6 }}>
        The Working with Yolŋu card recognises{" "}
        <span className="strong">4 levels</span> of competency.
      </p>

      {/* 下方介绍（保留） */}
      

      <div className="level">
        <div className="lv-tt">Level 1 – Culturally Aware</div>
        <div className="lv-tx">
          Awareness training of Aboriginal and Torres Strait Islanders cultural
          beliefs and knowledge systems, acknowledging the ongoing impacts of
          colonisation, and encouraging understanding of diverse cultural views.
        </div>
      </div>

      <div className="level">
        <div className="lv-tt">Level 2 – Yolŋu Informed</div>
        <div className="lv-tx">
          Introduces Yolŋu culture and worldview, provides key understanding of
          the East Arnhem region, and practical skills for effective engagement
          with Yolŋu people and communities.
        </div>
      </div>

      <div className="level">
        <div className="lv-tt">Level 3 – Conversing in Yolŋu Matha</div>
        <div className="lv-tx">
          Recognises basic conversational Yolŋu Matha language training,
          demonstrating a commitment to building relationships with Yolŋu and
          fostering a deeper respect for Yolŋu culture and identity.
        </div>
      </div>

      <div className="level">
        <div className="lv-tt">Level 4 – Leading with Yolŋu</div>
        <div className="lv-tx">
          This level is aimed at managerial staff to implement practical
          management skills and systems that establish and maintain cultural
          safety for Yolŋu staff, or Yolŋu clients of their services.
        </div>
      </div>
    </div>
  );
}

/* ===== 纯 CSS（不会引入任何 MUI 规则） ===== */
const css = `
.dc-root {
  padding: 8px 10px 24px;
  --brand-amber: #f59e0b;
  --brand-amber-dark: #92400e;
  --accent-green: #059669;
  --accent-green-ink: #047857;
  --text-900: #111827;
  --text-800: #1f2937;
  --text-700: #374151;
  --text-600: #4b5563;
  --muted: #6b7280;
  color: var(--text-800);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji";
}
.h-xl { font-size: 1.65rem; font-weight: 900; color: var(--brand-amber); }
.sub  { font-size: 1.08rem; font-weight: 800; color: var(--text-700); }
.p    { color: var(--text-600); line-height: 1.7; }
.strong { color: var(--text-900); font-weight: 900; }
.k { color: var(--muted); font-weight: 600; }
.v { color: var(--text-800); font-weight: 800; }

.dc-row.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 10px 0 24px;
}
.col { display: flex; }

@media (max-width: 900px){
  .dc-row.two-cols { grid-template-columns: 1fr; }
  .h-xl { font-size: 1.45rem; }
}

/* ===== 左侧：整张卡片背景（铺满） ===== */
.card {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0,0,0,.06);
  background: #fff;
}
.card-frame {
  position: relative;
  width: 100%;
  /* 用 padding-top 撑高，兼容所有浏览器（1/1.586 ≈ 0.63） */
  padding-top: 63%;
  border-radius: 14px;
  overflow: hidden;
  background: none !important;
}
.card-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;        /* 关键：整张图片铺满且不变形 */
  object-position: center;  /* 若想露出左侧 LOGO：left center */
  z-index: 0;
  pointer-events: none;
  user-select: none;
}
.card-content {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr auto;
 
  padding: 20px 22px 22px 22px;
}
/* 根据你的底图，把字段起始下移到白色区域 */

.kv { line-height: 1.35; margin-bottom: 8px; }

.pill {
  display: inline-block;
  margin-top: 6px;
  background: #fef3c7;
  color: var(--brand-amber-dark);
  border: 1px solid #fde68a;
  padding: 6px 10px;
  border-radius: 10px;
  font-weight: 900;
  font-size: .92rem;
}
.valid {
  margin-top: 6px;
  font-style: italic;
  color: #065f46;
  background: #ecfdf5;
  border: 1px dashed #a7f3d0;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 700;
}

.avatar-wrap {
  display: flex;
  align-items: flex-start;   /* 顶部对齐 */
  justify-content: flex-end; /* 靠右 */
}

.avatar {
  width: 88px;
  height: 100px;            /* 可以稍微比宽高大一点，类似证件照 */
  border-radius: 6px;       /* 轻微圆角，或 0 表示直角 */
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,.15);
  object-fit: cover;        /* 保证人脸不变形，裁切填充 */
}


/* ===== 右侧面板（纯 CSS） ===== */
.panel {
  flex: 1;
  border-radius: 16px;
  border: 1px solid #d1fae5;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(16,185,129,.08);
  padding: 14px 16px;
}
.panel-title { color: var(--accent-green-ink); font-weight: 900; }
.hr { border: none; border-top: 1px dashed #e5e7eb; margin: 10px 0; }
.bullet { margin: 8px 0; }
.bullet-tt { color: var(--accent-green-ink); font-weight: 900; }
.bullet-tx { color: var(--text-700); }

/* ==== 中部对齐：让文字和头像在卡片可用区域垂直居中 ==== */
.card-content{
  /* 这两个数值根据你的底图来：上方蓝/红横幅大约 120px，高度条约 70~80px */
  --safe-top: 120px;      /* 顶部彩色横幅的高度 */
  --safe-bottom: 80px;    /* 底部条的高度 */

  position: absolute;
  inset: 0;

  display: grid;
  grid-template-columns: 1fr auto; /* 左：文字 右：头像 */
  align-items: center;             /* ⬅️ 关键：垂直居中 */
  justify-items: stretch;
  gap: 16px;

  padding: var(--safe-top) 22px var(--safe-bottom) 22px; /* 安全区内边距 */
}

/* 文字列：不要再用 margin-top 顶位置 */
.fields{
  align-self: center;             /* ⬅️ 在安全区内居中 */
  margin: 0;                      /* ⬅️ 删除之前的 margin-top:84px */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 头像：矩形，靠右并在中间高度 */
.avatar-wrap{
  align-self: center;             /* 垂直居中 */
  justify-self: end;              /* 靠右 */
}

.avatar{
  width: 130px;                   /* 你可以微调：120~140 都可 */
  height: 150px;
  border-radius: 6px;             /* 直角就改 0 */
  object-fit: cover;              /* 保证不变形 */
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,.15);
}


`
;
