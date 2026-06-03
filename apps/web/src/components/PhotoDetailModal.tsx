import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPhotoComments,
  getPhotoDetail,
  likePhoto,
  addPhotoComment,
  type PhotoComment,
  type PhotoDetail,
} from '../lib/photosApi';

export type PhotoDetailInitial = Partial<PhotoDetail> & {
  id: string;
  imageUrl: string;
  isPublic?: boolean;
};

type Props = {
  photoId: string;
  initialPhoto?: PhotoDetailInitial;
  onClose: () => void;
  onLikeChange?: (photoId: string, likeCount: number) => void;
};

function formatPhotoDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return '';
  }
}

function formatCommentTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Az önce';
    if (diffMin < 60) return `${diffMin} dk`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} sa`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} g`;
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export function PhotoDetailModal({
  photoId,
  initialPhoto,
  onClose,
  onLikeChange,
}: Props) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<PhotoDetail | null>(
    initialPhoto
      ? {
          id: initialPhoto.id,
          imageUrl: initialPhoto.imageUrl,
          caption: initialPhoto.caption ?? null,
          cityName: initialPhoto.cityName ?? null,
          locationName: initialPhoto.locationName ?? null,
          createdAt: initialPhoto.createdAt ?? new Date().toISOString(),
          userId: initialPhoto.userId ?? '',
          userName: initialPhoto.userName ?? 'Kullanıcı',
          likeCount: initialPhoto.likeCount ?? 0,
        }
      : null,
  );
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (initialPhoto?.isPublic === false) return;
    let cancelled = false;
    (async () => {
      try {
        const [detailRes, commentsRes] = await Promise.all([
          getPhotoDetail(photoId).catch(() => null),
          getPhotoComments(photoId).catch(() => ({ data: [] as PhotoComment[] })),
        ]);
        if (cancelled) return;
        if (detailRes?.data) setPhoto(detailRes.data);
        setComments(commentsRes.data ?? []);
      } catch {
        if (!cancelled) setError('Fotoğraf yüklenemedi');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoId, initialPhoto?.isPublic]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleLike = async () => {
    if (!user) {
      setError('Beğenmek için giriş yapmalısın');
      return;
    }
    if (liked) return;
    try {
      const res = await likePhoto(photoId);
      setLiked(true);
      setPhoto((prev) =>
        prev ? { ...prev, likeCount: res.likeCount } : prev,
      );
      onLikeChange?.(photoId, res.likeCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beğeni eklenemedi');
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    if (!user) {
      setError('Yorum yapmak için giriş yapmalısın');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await addPhotoComment(photoId, text);
      setComments((prev) => [...prev, res.data]);
      setCommentText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yorum eklenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  if (!photo) {
    return (
      <div className="photo-detail-overlay" onClick={onClose}>
        <div className="photo-detail-modal photo-detail-modal--loading" onClick={(e) => e.stopPropagation()}>
          <div className="photo-detail-spinner" />
        </div>
      </div>
    );
  }

  const locationLabel = [photo.cityName, photo.locationName]
    .filter(Boolean)
    .join(' · ');
  const displayLikes = photo.likeCount + (liked ? 0 : 0);

  return (
    <div className="photo-detail-overlay" onClick={onClose}>
      <div className="photo-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="photo-detail-close"
          onClick={onClose}
          aria-label="Kapat"
        >
          ×
        </button>

        <div className="photo-detail-image">
          <img src={photo.imageUrl} alt={photo.caption ?? 'Seyahat fotoğrafı'} />
        </div>

        <div className="photo-detail-panel">
          <header className="photo-detail-header">
            <div className="photo-detail-avatar">
              {(photo.userName?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="photo-detail-header-info">
              <span className="photo-detail-username">{photo.userName}</span>
              {locationLabel && (
                <span className="photo-detail-location">{locationLabel}</span>
              )}
            </div>
          </header>

          <div className="photo-detail-comments">
            {photo.caption && (
              <div className="photo-detail-comment">
                <span className="photo-detail-comment-user">{photo.userName}</span>
                <span className="photo-detail-comment-body">{photo.caption}</span>
              </div>
            )}
            {comments.map((c) => (
              <div key={c.id} className="photo-detail-comment">
                <span className="photo-detail-comment-user">{c.userName}</span>
                <span className="photo-detail-comment-body">{c.body}</span>
                <span className="photo-detail-comment-time">
                  {formatCommentTime(c.createdAt)}
                </span>
              </div>
            ))}
            {comments.length === 0 && !photo.caption && (
              <p className="photo-detail-empty">Henüz yorum yok.</p>
            )}
            <div ref={commentsEndRef} />
          </div>

          <footer className="photo-detail-footer">
            <div className="photo-detail-actions">
              <button
                type="button"
                className={`photo-detail-action ${liked ? 'liked' : ''}`}
                onClick={handleLike}
                aria-label="Beğen"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <button type="button" className="photo-detail-action" aria-label="Yorum yap">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>

            <div className="photo-detail-meta">
              {displayLikes > 0 && (
                <p className="photo-detail-likes">
                  {displayLikes.toLocaleString('tr-TR')} beğenme
                </p>
              )}
              <time className="photo-detail-date">{formatPhotoDate(photo.createdAt)}</time>
            </div>

            {error && <p className="photo-detail-error">{error}</p>}

            {initialPhoto?.isPublic !== false ? (
              <form className="photo-detail-comment-form" onSubmit={handleCommentSubmit}>
                <input
                  type="text"
                  placeholder={user ? 'Yorum ekle...' : 'Yorum yapmak için giriş yap'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!user || submitting}
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!user || submitting || !commentText.trim()}
                >
                  Paylaş
                </button>
              </form>
            ) : (
              <p className="photo-detail-private-note">🔒 Gizli fotoğraf — yorumlar kapalı</p>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
