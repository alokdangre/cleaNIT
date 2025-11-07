import React from "react";

function Header() {
  return (
    <header>
      <div className="nav container">
        <div className="brand">
          <a href="#" className="logo" aria-hidden>🧹</a>
          <div>
            <div className="tag">CleanSpot · NIT Rourkela</div>
            <div className="helper">Report → Clean → Verify</div>
          </div>
        </div>
        <div className="flex">
          <a href="#student-login" className="btn">Student Login</a>
          <a href="#student-signup" className="btn">Student Signup</a>
          <a href="#admin-login" className="btn primary">Admin Login</a>
          <a href="#admin-signup" className="btn primary">Admin Signup</a>
        </div>
      </div>
    </header>
  );
}

export default Header;
