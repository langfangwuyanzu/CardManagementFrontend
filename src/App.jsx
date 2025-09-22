import React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/login.jsx";
import RegisterCard from "./pages/register/RegisterCard";
import ProfilePage  from "./pages/ProfilePage/ProfilePage.jsx";
import ProfilePageAdmin from "./pages/ProfilePageAdmin/ProfilePageAdmin.jsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<RegisterCard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profileAdmin" element={<ProfilePageAdmin />} />
        
      </Routes>
    </BrowserRouter>
  );
}

