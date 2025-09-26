import React, { useEffect, useState } from "react";
import DigitalCardOnly from "./DigitalCardOnly"; // ✅ 用精简版卡片
import api from "../../../utils/api";

export default function UpgradeTab() {
    const [user, setUser] = useState(null);
    const [level, setLevel] = useState("");
    const [training, setTraining] = useState("");
    const [provider, setProvider] = useState("");
    const [date, setDate] = useState("");
    const [file, setFile] = useState(null);   // ✅ 新增 state

    // 拉取用户信息
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        (async () => {
            try {
                const res = await fetch("/api/users/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) setUser(await res.json());
            } catch (err) {
                console.error("Failed to fetch user", err);
            }
        })();
    }, []);

    // 提交升级请求
    const handleSubmit = async () => {
        try {
            const formData = new FormData();
            formData.append(
                "request",
                new Blob(
                    [
                        JSON.stringify({
                            newLevel: level,
                            trainingUndertaken: training,
                            trainingProvider: provider,
                            trainingDate: date,
                        }),
                    ],
                    { type: "application/json" }
                )
            );
            console.log({level, training, provider, date})
            if (file) {
                formData.append("file", file);  // ✅ 把文件传过去
            }

            await api.post(`/upgrade/upload/${user.id}`, formData);

            alert("Upgrade submitted!");
        } catch (err) {
            console.error("Upgrade failed:", err);
            alert("Upgrade failed");
        }
    };

    return (

        <div className="upgrade-root">
            <style>{css}</style>
            {/* 上半部分：卡片 + 用户信息 */}
            <div className="top-section">
                <div className="left-col">
                    <DigitalCardOnly profile={user} />
                </div>
                <div className="right-col">
                    <div className="user-info">
                        <div><strong>Name:</strong> {user?.firstName} {user?.lastName}</div>
                        <div><strong>ID:</strong> {user?.id}</div>
                        <div><strong>Current Level:</strong> {user?.cardLevel}</div>

                        <div className="form-group">
                            <label>Please select the level you want to upgrade</label>
                            <select value={level} onChange={(e) => setLevel(e.target.value)}>
                                <option value="">-- Select Level --</option>
                                <option value="1">Level 1 – Culturally Aware</option>
                                <option value="2">Level 2 – Yolŋu Informed</option>
                                <option value="3">Level 3 – Conversing in Yolŋu Matha</option>
                                <option value="4">Level 4 – Leading with Yolŋu</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* 下半部分：表单 */}
            <div className="bottom-section">
                <h3>Training Experience</h3>
                <div className="form-row">
                    <input
                        placeholder="Training Undertaken"
                        value={training}
                        onChange={(e) => setTraining(e.target.value)}
                        required
                    />
                    <input
                        placeholder="Training Provider"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        required
                    />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                {/* 上传文件 */}
                <div className="form-row upload-row">
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                </div>

                <button onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
}
const css = `
.upgrade-root {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: Arial, sans-serif;
}

.top-section {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

/* 卡片保持原样 */
.left-col {
  flex: 0 0 auto;
  min-width: 560px;
}

/* 右侧信息区 */
.right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 40px;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border: 1px dashed #ccc;
  border-radius: 6px;
}

.user-info div {
  height: 40px;
  border-radius: 4px;
  margin-bottom: 8px;
}



.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #666;
}

select {
  width: 100%;
  padding: 8px;
  border: 1px dashed #bbb;
  background: #fafafa;
}

/* 表单区 */
.bottom-section {
  border-top: 2px dashed #ccc;
  padding-top: 20px;
}

.bottom-section h3 {
  margin-bottom: 16px;
  color: #444;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.form-row input,
.form-row select {
  flex: 1;
  height: 36px;
  border: 1px dashed #bbb;
  background: #f4f4f4;
  border-radius: 4px;
}

/* 上传文件区 */
.upload-row input[type="file"] {
  border: 1px dashed #bbb;
  padding: 6px;
  background: #fafafa;
  font-size: 0.9rem;
}

/* 提交按钮原型风格 */
button {
  background: #ddd;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  font-weight: normal;
  color: #555;
  cursor: pointer;
}
button:hover {
  background: #ccc;
`;