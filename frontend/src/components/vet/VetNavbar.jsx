import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/straycare_logo.webp";
import { useAuthStore } from '../../store/authStore';
import { User, LogOut, Home, ClipboardList, Heart, Megaphone, Users, BookOpen } from "lucide-react";
import "../../styles/vet/VetDashboard.css";

function VetNavbar() {
  const { logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/'; // Redirect to main site on logout
  };

  const handleNavLinkClick = () => {
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className="navbar vet-navbar">
        <div className="nav-left">
          <Link to="/vet/dashboard" onClick={handleNavLinkClick} style={{ position: 'relative', zIndex: 102 }}>
            <img src={logo} alt="StrayCare Logo" className="logo" />
          </Link>

          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <NavLink to="/vet/dashboard" end onClick={handleNavLinkClick} data-tooltip="Home">
              <Home size={18} />
              <span>Home</span>
            </NavLink>
            <NavLink to="/vet/status" onClick={handleNavLinkClick} data-tooltip="Status">
              <ClipboardList size={18} />
              <span>Status</span>
            </NavLink>
            <NavLink to="/vet/adopt" onClick={handleNavLinkClick} data-tooltip="Adopt">
              <Heart size={18} />
              <span>Adopt</span>
            </NavLink>
            <NavLink to="/vet/campaign" onClick={handleNavLinkClick} data-tooltip="Campaign">
              <Megaphone size={18} />
              <span>Campaign</span>
            </NavLink>
            <NavLink to="/vet/rescuers" onClick={handleNavLinkClick} data-tooltip="Rescuers">
              <Users size={18} />
              <span>Rescuers</span>
            </NavLink>
            <NavLink to="/vet/guide" onClick={handleNavLinkClick} data-tooltip="Guide">
              <BookOpen size={18} />
              <span>Guide</span>
            </NavLink>
          </div>
        </div>

        <div className="nav-right">
          <div className="vet-auth-group">
            <NavLink to="/vet/profile" className="nav-link-btn vet-nav-btn">
              <User size={18} className="vet-nav-icon" />
              <span className="vet-nav-text">Profile</span>
            </NavLink>

            <button onClick={handleLogout} className="logout-btn vet-nav-btn">
              <LogOut size={16} className="vet-nav-icon" />
              <span className="vet-nav-text">Logout</span>
            </button>
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
        <NavLink to="/vet/dashboard" end onClick={closeMenu} className="mobile-nav-item">
          <Home size={20} />
          <span className="mobile-nav-label">Home</span>
        </NavLink>
        <NavLink to="/vet/status" onClick={closeMenu} className="mobile-nav-item">
          <ClipboardList size={20} />
          <span className="mobile-nav-label">Status</span>
        </NavLink>
        <NavLink to="/vet/adopt" onClick={closeMenu} className="mobile-nav-item">
          <Heart size={20} />
          <span className="mobile-nav-label">Adopt</span>
        </NavLink>
        <NavLink to="/vet/campaign" onClick={closeMenu} className="mobile-nav-item">
          <Megaphone size={20} />
          <span className="mobile-nav-label">Campaign</span>
        </NavLink>
        <NavLink to="/vet/rescuers" onClick={closeMenu} className="mobile-nav-item">
          <Users size={20} />
          <span className="mobile-nav-label">Rescuers</span>
        </NavLink>
        <NavLink to="/vet/guide" onClick={closeMenu} className="mobile-nav-item">
          <BookOpen size={20} />
          <span className="mobile-nav-label">Guide</span>
        </NavLink>
      </div>
    </>
  );
}

export default VetNavbar;
