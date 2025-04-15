import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">飲み会精算アプリ</Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/">ホーム</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/members">メンバー管理</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/parties">飲み会一覧</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;