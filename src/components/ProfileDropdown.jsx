import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfileDropdown.css';

function ProfileDropdown({ closeMenu }) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLinkClick = () => {
    setIsOpen(false);
    if (closeMenu) closeMenu();
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    if (closeMenu) closeMenu();
  };

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button className="profile-trigger-btn" onClick={toggleDropdown}>
        <div className="profile-icon">
          <div className="profile-eyes">
            <span className="eye"></span>
            <span className="eye"></span>
          </div>
          <div className="profile-smile"></div>
        </div>
        <ChevronDown size={20} color="#333" className={`dropdown-arrow ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-link">
            <NavLink to="/profile" onClick={handleLinkClick}>
              <User size={20} />
              <span>Profile</span>
            </NavLink>
          </div>
          
          <div className="dropdown-divider"></div>
          
          <div className="dropdown-group">
            <div className="dropdown-label">Switch Profile</div>
            <button className="dropdown-item sub-item active" onClick={() => setIsOpen(false)}>
              User
            </button>
            <button className="dropdown-item sub-item" onClick={() => setIsOpen(false)}>
              Rescuer
            </button>
            <button className="dropdown-item sub-item" onClick={() => setIsOpen(false)}>
              Vet/Clinic
            </button>
          </div>
          <div className="logout-wrapper">
            <button className="dropdown-item profile-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
