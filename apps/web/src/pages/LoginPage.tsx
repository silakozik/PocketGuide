import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./auth.css";

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      navigate(redirect, { replace: true });
    }
  }, [authLoading, user, navigate, redirect]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
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

        <h1 className="auth-title">Giriş yap</h1>
        <p className="auth-subtitle">Hesabına giriş yap ve rotalarını kaydet.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting || !email || !password}
          >
            {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </form>

        <p className="auth-footer">
          Hesabın yok mu? <Link to="/register">Kayıt ol</Link>
        </p>
      </div>
    </div>
  );
}
