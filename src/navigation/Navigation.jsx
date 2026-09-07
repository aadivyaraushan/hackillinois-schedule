import React, { useState } from "react";
import logo from "./logo.svg";
export default function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <header className="masthead">
      <a href="https://2021.hackillinois.org/" aria-label="HackIllinois home">
        <img className="logo" src={logo} alt="HackIllinois" />
      </a>
      <button
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="site-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close" : "Menu"}
      </button>
      <nav
        id="site-navigation"
        aria-label="Main navigation"
        className={open ? "navigation open" : "navigation"}
      >
        <a href="https://2021.hackillinois.org/">Home</a>
        <a href="https://2021.hackillinois.org/mentors">Mentors</a>
        <a href="https://2021.hackillinois.org/prizes">Prizes</a>
        <a href="#schedule" aria-current="page" onClick={() => setOpen(false)}>
          Schedule
        </a>
      </nav>
    </header>
  );
}
