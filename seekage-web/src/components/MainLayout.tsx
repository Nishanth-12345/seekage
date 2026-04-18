import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function MainLayout() {
  const { user } = useAuth();
  const isAdmin = user?.portal === 'seekage' && user?.role === 'admin';

  return (
    <div className="layout">
      <div className="layout-main">
        <Outlet />
      </div>
      <nav className="tab-bar">
        {user?.portal === 'seekage' ? (
          <NavLink to="/seekage" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="tab-icon">📚</span><span>Seekage</span>
          </NavLink>
        ) : (
          <NavLink to="/school" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="tab-icon">🏫</span><span>School</span>
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin/parent-passwords" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="tab-icon">🔑</span><span>Parent PW</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
}
