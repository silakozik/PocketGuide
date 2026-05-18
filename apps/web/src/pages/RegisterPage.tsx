import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./auth.css";

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("auth-page-active");
    document.body.classList.add("auth-page-active");
    return () => {
      document.documentElement.classList.remove("auth-page-active");
      document.body.classList.remove("auth-page-active");
    };
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/onboarding", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setSubmitting(true);
    try {
      await register({ email, password, userName });
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="auth-viewport" />;
  }

  return (
    <div className="auth-viewport">
      <div className="auth-bg" aria-hidden>
        <span className="auth-blob auth-blob--1" />
        <span className="auth-blob auth-blob--2" />
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-dot" />
          <Link to="/" className="auth-brand-name">
            PocketGuide
          </Link>
        </div>

        <h1 className="auth-title">Kayıt ol</h1>
        <p className="auth-subtitle">
          Ücretsiz hesap oluştur; ilgi alanlarına göre kişisel öneriler al.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="userName">Kullanıcı adı</label>
            <input
              id="userName"
              type="text"
              autoComplete="username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              pattern="[a-zA-Z0-9_]{3,24}"
              title="3–24 karakter; harf, rakam ve alt çizgi"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirmPassword">Şifre (tekrar)</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              submitting || !email || !userName || !password || !confirmPassword
            }
          >
            {submitting ? "Hesap oluşturuluyor…" : "Kayıt ol"}
          </button>
        </form>

        <p className="auth-footer">
          Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
        </p>
      </div>
    </div>
  );
}
