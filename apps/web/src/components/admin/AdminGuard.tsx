import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:3000';

interface Props {
  children: ReactNode;
}

export default function AdminGuard({ children }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/api/admin/me`, { credentials: 'include' })
      .then((r) => {
        if (r.ok) {
          setAuthed(true);
        } else {
          navigate('/admin/login', { replace: true });
        }
      })
      .catch(() => navigate('/admin/login', { replace: true }));
  }, [navigate]);

  if (authed === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0c111b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7a8ba8',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
        }}
      >
        Kontrol ediliyor…
      </div>
    );
  }

  return <>{children}</>;
}
