import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useAIAssistant } from "../context/AIAssistantContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { isOpen: aiOpen, toggle: toggleAI } = useAIAssistant();
  const location = useLocation();
  const avatarLetter = user?.userName?.charAt(0).toUpperCase() ?? "?";

  const closeMenu = () => setMenuOpen(false);

  const navItemClass = (path: string) =>
    location.pathname === path ? "nav-link nav-link--active" : "nav-link";

  return (
    <nav>
      <Link to="/" className="logo" onClick={closeMenu}>
        <div className="logo-dot" />
        PocketGuide
      </Link>

      <button
        type="button"
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Menü"
      >
        <span /><span /><span />
      </button>

      <ul className={`nav-links ${menuOpen ? "show" : ""}`}>
        <li>
          <Link to="/" className={navItemClass("/")} onClick={closeMenu}>
            {t("nav.home")}
          </Link>
        </li>
        <li>
          <Link to="/transfer" className={navItemClass("/transfer")} onClick={closeMenu}>
            {t("nav.transfer")}
          </Link>
        </li>
        <li>
          <Link to="/map" className={navItemClass("/map")} onClick={closeMenu}>
            {t("nav.search")}
          </Link>
        </li>
        <li>
          <Link to="/map" className={navItemClass("/map")} onClick={closeMenu}>
            🗺 {t("nav.map")}
          </Link>
        </li>
        <li>
          <button
            type="button"
            className={`nav-link nav-link--assistant ${aiOpen ? "nav-link--active" : ""}`}
            onClick={() => {
              toggleAI();
              closeMenu();
            }}
          >
            ✨ {t("nav.assistant", "AI Asistan")}
          </button>
        </li>
      </ul>

      <div className={`nav-right ${menuOpen ? "show" : ""}`}>
        <LanguageSwitcher />
        <div
          style={{ width: "1px", height: "30px", background: "var(--border)", margin: "0 8px" }}
          className="nav-divider"
        />
        {!loading && !user && (
          <>
            <Link to="/login" className="nav-login" onClick={closeMenu}>
              {t("nav.login", "Giriş yap")}
            </Link>
            <Link to="/register" className="nav-cta" onClick={closeMenu}>
              {t("nav.register", "Kayıt ol")}
            </Link>
          </>
        )}
        {!loading && user && (
          <Link
            to="/profile"
            className="map-profile-btn"
            style={{ marginLeft: "8px" }}
            onClick={closeMenu}
          >
            <div className="profile-avatar">{avatarLetter}</div>
          </Link>
        )}
      </div>

      {menuOpen && <div className="nav-overlay" onClick={closeMenu} />}
    </nav>
  );
}
