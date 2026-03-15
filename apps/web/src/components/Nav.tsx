export function Nav() {
  return (
    <nav>
      <a href="#" className="logo">
        <div className="logo-dot" />
        PocketGuide
      </a>
      <ul className="nav-links">
        <li><a href="#features">Özellikler</a></li>
        <li><a href="#transit">Ulaşım</a></li>
        <li><a href="#how">Nasıl Çalışır</a></li>
        <li><a href="#pricing">Fiyatlar</a></li>
      </ul>
      <div className="nav-right">
        <a href="#" className="nav-login">Giriş Yap</a>
        <a href="#cta" className="nav-cta">Ücretsiz Başla →</a>
      </div>
    </nav>
  );
}
