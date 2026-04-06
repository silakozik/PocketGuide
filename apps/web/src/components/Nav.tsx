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
        <li><a href="#transit" onClick={() => setMenuOpen(false)}>Ulaşım</a></li>
        <li><a href="#how" onClick={() => setMenuOpen(false)}>Nasıl Çalışır</a></li>
        <li><a href="#pricing" onClick={() => setMenuOpen(false)}>Fiyatlar</a></li>
      </ul>
      <div className={`nav-right ${menuOpen ? "show" : ""}`}>
        <a href="#" className="nav-login">Giriş Yap</a>
        <Link to="/map" className="nav-outline" onClick={() => setMenuOpen(false)}>
          <span className="nav-outline-icon">🗺</span> Haritayı Keşfet
        </Link>
        <a href="#cta" className="nav-cta" onClick={() => setMenuOpen(false)}>
          Ücretsiz Başla →
        </a>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}
    </nav>
  );
}
