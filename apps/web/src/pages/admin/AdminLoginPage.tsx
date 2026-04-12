import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin.css';

const API = 'http://localhost:3000';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        navigate('/admin/cities', { replace: true });
      } else {
        const data = await res.json();
        setError(data.message || 'Geçersiz şifre');
      }
    } catch {
      setError('Sunucuya bağlanılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-root">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-logo">🔐 PocketGuide</div>
        <p className="admin-login-sub">Admin paneline erişmek için şifrenizi girin</p>

        <input
          className="admin-input"
          type="password"
          placeholder="Admin şifresi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />

        <button
          className="admin-login-btn"
          type="submit"
          disabled={loading || !password}
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>

        {error && <div className="admin-login-error">{error}</div>}
      </form>
    </div>
  );
}
