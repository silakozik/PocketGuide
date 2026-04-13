import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <nav>
      <a href="/" className="logo">
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
        <li><Link to="/" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link></li>
        <li><Link to="/transfer" onClick={() => setMenuOpen(false)}>{t('nav.transfer')}</Link></li>
        <li><a href="#how" onClick={() => setMenuOpen(false)}>{t('common.search')}</a></li>
      </ul>
      <div className={`nav-right ${menuOpen ? "show" : ""}`}>
        <LanguageSwitcher />
        <div style={{ width: "1px", height: "30px", background: "var(--border)", margin: "0 8px" }} className="nav-divider" />
        
        <Link to="/map" className="nav-outline" onClick={() => setMenuOpen(false)}>
          🗺 {t('nav.map')}
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
