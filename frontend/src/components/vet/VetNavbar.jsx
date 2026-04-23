import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/straycare_logo.png";
import { useAuth } from "../../context/AuthContext";
import { User, LogOut } from "lucide-react";
import "../../styles/vet/VetDashboard.css";

function VetNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/'; // Redirect to main site on logout
  };

  return (
    <div className="navbar vet-navbar">
      <div className="nav-left">
        <Link to="/dashboard" onClick={closeMenu}>
          <img src={logo} alt="StrayCare Logo" className="logo" />
        </Link>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <NavLink to="/dashboard" end onClick={closeMenu}>Home</NavLink>
          <NavLink to="/status" onClick={closeMenu} >Status</NavLink>
          <NavLink to="/adopt" onClick={closeMenu}>Adopt</NavLink>
          <NavLink to="/campaign" onClick={closeMenu}>Campaign</NavLink>
          <NavLink to="/rescuers" onClick={closeMenu}>Rescuers</NavLink>
          <NavLink to="/guide" onClick={closeMenu}>Guide</NavLink>
        </div>
      </div>

      <div className="nav-right">
        <div className="desktop-only-auth" style={{ gap: '15px' }}>
          <NavLink to="/profile" className="nav-link-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} />
            <span>Profile</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="logout-btn">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
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

export default VetNavbar;
