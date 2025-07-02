import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '▦' },
    { path: '/upload', label: 'Upload Data', icon: '↑' },
    { path: '/photos', label: 'Photos', icon: '◉' },
    { path: '/analytics', label: 'Analytics', icon: '∩' },
    { path: '/progress', label: 'Progress', icon: '→' },
    { path: '/goals', label: 'Goals', icon: '★' },
    { path: '/reports', label: 'Reports', icon: '≡' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="brand-link">
            <span className="brand-icon">T</span>
            <span className="brand-text">Trackify</span>
          </Link>
        </div>

        <div className="navbar-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="settings-button" title="Settings">
            •••
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;