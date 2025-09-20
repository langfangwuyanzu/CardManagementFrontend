import React from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

import bg from "../../assets/homePage/home-background.png";
import hero from "../../assets/homePage/home-image.png";
import logo from "../../assets/homePage/yothu-logo.png";

export default function Home() {  
  const navigate = useNavigate();

  return (
    <div
      className="hp-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="hp-top">
        <div className="hp-left-title">
          <div>CARD</div>
          <div>MANAGEMENT</div>
          <div>SYSTEM</div>
        </div>

        <img className="hp-logo" src={logo} alt="Yothu Yindi Foundation" />
      </div>

      <section className="hp-hero" role="main" aria-labelledby="hp-title">
        <div className="hp-drop-wrap" aria-hidden="true">
          <img className="hp-hero-img" src={hero} alt="" />
        </div>

        <h1 id="hp-title">Working with Yolŋu Card</h1>
        <div className="hp-underline" aria-hidden="true"></div>

        <p className="hp-subtitle">
          Update your training experience, apply for different levels of work
          cards, and enjoy working in Yolŋu communities!
        </p>

        <div className="hp-btns">
          <button className="hp-btn hp-btn-primary" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="hp-btn hp-btn-outline" onClick={() => navigate("/register")}>
            Register
          </button>
        </div>
      </section>

      <footer className="hp-footer">
        © 2025 Yothu Yindi Foundation · All Rights Reserved
      </footer>
    </div>
  );
}
