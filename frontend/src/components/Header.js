import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-content">
        <h1>Inventory Management System</h1>
        {user && (
          <div className="user-section">
            <span className="user-name">Welcome, {user.username}!</span>
            <button onClick={logout} className="btn btn-logout">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
