import React from "react";

function Header({ auth, onLogout }) {
  const isLoggedIn = Boolean(auth?.token);
  const role = auth?.user?.role;
  const dashboardHref = role === "employee" ? "/admin" : role === "student" ? "/student" : "/";

  return (
    <header className="site-header">
      <div className="nav container">
        <div className="brand">
          <a href="/" className="logo" aria-label="CleanSpot home">🧹</a>
          <div>
            <div className="tag">CleanSpot</div>
            <div className="helper">Keep NIT Rourkela spotless</div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="/#about">About</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/#complaints">Complaints</a>
        </nav>

        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <a className="btn ghost" href={dashboardHref}>Dashboard</a>
              <button type="button" className="btn" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <a className="btn primary" href="/auth">Log in / Sign up</a>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
