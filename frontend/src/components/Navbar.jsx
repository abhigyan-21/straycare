import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/straycare_logo.png";
import { useAuthStore } from '../store/authStore';
import ProfileDropdown from "./ProfileDropdown";
import { Home, Heart, PlusSquare, MapPin, HandHeart, BookOpen, UserPlus, User } from 'lucide-react';

function Navbar({ openAuthModal }) {
  const { isLoggedIn, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const authDropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (authDropdownRef.current && !authDropdownRef.current.contains(event.target)) {
        setIsAuthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="navbar">
        <div className="nav-left">
          <Link to="/" onClick={closeMenu} style={{ position: 'relative', zIndex: 102 }}>
            <img src={logo} alt="StrayCare Logo" className="logo" />
          </Link>

          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <NavLink to="/" end onClick={closeMenu}>
              <Home size={18} />
              <span>Home</span>
            </NavLink>
            <NavLink to="/adopt" onClick={closeMenu}>
              <Heart size={18} />
              <span>Adopt a pet</span>
            </NavLink>
            <NavLink to="/post" onClick={closeMenu}>
              <PlusSquare size={18} />
              <span>Post</span>
            </NavLink>
            <NavLink to="/track" onClick={closeMenu}>
              <MapPin size={18} />
              <span>Track</span>
            </NavLink>
            <NavLink to="/help" onClick={closeMenu}>
              <HandHeart size={18} />
              <span>Support Us</span>
            </NavLink>
            <NavLink to="/guide" onClick={closeMenu}>
              <BookOpen size={18} />
              <span>Guide</span>
            </NavLink>
            <NavLink to="/register" onClick={closeMenu}>
              <UserPlus size={18} />
              <span>Register</span>
            </NavLink>

            <div className="mobile-only-auth">
              {!isLoggedIn ? (
                <button onClick={() => { openAuthModal('signin'); closeMenu(); }} className="sign-btn" style={{ marginBottom: '10px' }}>
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

          <div className="header-auth" ref={authDropdownRef}>
            {!isLoggedIn ? (
              <div className="auth-dropdown-container">
                <button onClick={() => setIsAuthDropdownOpen(!isAuthDropdownOpen)} className="auth-trigger-btn">
                  <User size={18} />
                  <span className="auth-btn-text">Account</span>
                </button>
                {isAuthDropdownOpen && (
                  <div className="auth-dropdown-menu">
                    <button onClick={() => { openAuthModal('signin'); setIsAuthDropdownOpen(false); }} className="auth-dropdown-item">
                      Login
                    </button>
                    <button onClick={() => { openAuthModal('signup'); setIsAuthDropdownOpen(false); }} className="auth-dropdown-item">
                      Register
                    </button>
                  </div>
                )}
              </div>
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

      {/* Floating Pill Bottom Navigation Bar for Mobile */}
      <div className="mobile-bottom-nav">
        <NavLink to="/" end onClick={closeMenu} className="mobile-nav-item">
          <Home size={20} />
          <span className="mobile-nav-label">Home</span>
        </NavLink>
        <NavLink to="/adopt" onClick={closeMenu} className="mobile-nav-item">
          <Heart size={20} />
          <span className="mobile-nav-label">Adopt</span>
        </NavLink>
        <NavLink to="/post" onClick={closeMenu} className="mobile-nav-item">
          <PlusSquare size={20} />
          <span className="mobile-nav-label">Post</span>
        </NavLink>
        <NavLink to="/track" onClick={closeMenu} className="mobile-nav-item">
          <MapPin size={20} />
          <span className="mobile-nav-label">Track</span>
        </NavLink>
        <NavLink to="/help" onClick={closeMenu} className="mobile-nav-item">
          <HandHeart size={20} />
          <span className="mobile-nav-label">Support</span>
        </NavLink>
        <NavLink to="/guide" onClick={closeMenu} className="mobile-nav-item">
          <BookOpen size={20} />
          <span className="mobile-nav-label">Guide</span>
        </NavLink>
      </div>
    </>
  );
}

export default Navbar;