import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/straycare_logo.png";
import { useAuth } from "../context/AuthContext";
import ProfileDropdown from "./ProfileDropdown";

function Navbar({ openAuthModal }) {
  const { isLoggedIn, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="navbar">
      <div className="nav-left">
        <Link to="/" onClick={closeMenu} style={{ position: 'relative', zIndex: 102 }}>
          <img src={logo} alt="StrayCare Logo" className="logo" />
        </Link>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
          <NavLink to="/adopt" onClick={closeMenu}>Adopt a pet</NavLink>
          <NavLink to="/post" onClick={closeMenu}>Post</NavLink>
          <NavLink to="/track" onClick={closeMenu}>Track</NavLink>
          <NavLink to="/help" onClick={closeMenu}>Support Us</NavLink>
          <NavLink to="/guide" onClick={closeMenu}>Guide</NavLink>
          <NavLink to="/register" onClick={closeMenu}>Register</NavLink>

          <div className="mobile-only-auth">
            {!isLoggedIn ? (
              <button onClick={() => { openAuthModal('signin'); closeMenu(); }} className="sign-up-btn sign-btn" style={{ marginBottom: '10px' }}>
                LOGIN
              </button>
            ) : (
              <ProfileDropdown closeMenu={closeMenu} />
            )}
          </div>
        </div>
      </div>

      <div className="nav-right">
        <NavLink to="/emergency" className="emergency mobile-emergency">
          Emergency
        </NavLink>

        <div className="desktop-only-auth">
          {!isLoggedIn ? (
            <button onClick={() => openAuthModal('signin')} className="sign-up-btn sign-btn">
              LOGIN
            </button>
          ) : (
            <ProfileDropdown />
          )}
        </div>

        <button className="hamburger" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>
    </div>
  );
}

export default Navbar;