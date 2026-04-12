import { useState } from "react";
import { Link } from "react-router-dom";

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav>
      <a href="#" className="logo">
        <div className="logo-dot" />
        PocketGuide
      </a>

      {/* Hamburger toggle — mobile only */}
      <button
        type="button"
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Menü"
      >
        <span /><span /><span />
      </button>

      {/* Links — desktop visible, mobile toggle */}
      <ul className={`nav-links ${menuOpen ? "show" : ""}`}>
        <li><a href="#features" onClick={() => setMenuOpen(false)}>Özellikler</a></li>
        <li><Link to="/transfer" onClick={() => setMenuOpen(false)}>Ulaşım</Link></li>

        <li><a href="#how" onClick={() => setMenuOpen(false)}>Nasıl Çalışır</a></li>
        <li><a href="#pricing" onClick={() => setMenuOpen(false)}>Fiyatlar</a></li>
      </ul>
      <div className={`nav-right ${menuOpen ? "show" : ""}`}>
        <a href="#auth" className="nav-login" onClick={() => setMenuOpen(false)}>
          Giriş Yap / Kayıt Ol
        </a>
        <div style={{ width: "1px", height: "30px", background: "var(--border)", margin: "0 8px" }} className="nav-divider" />
        <Link to="/map" className="nav-outline" onClick={() => setMenuOpen(false)}>
          🗺 Harita
        </Link>
        <Link to="/profile" className="map-profile-btn" style={{ marginLeft: '8px' }} onClick={() => setMenuOpen(false)}>
          <div className="profile-avatar">S</div>
        </Link>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}
    </nav>
  );
}
