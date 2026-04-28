import { useRoute } from '../../context/RouteContext';
import styles from './RouteControls.module.css';

export function RouteControls() {
  const { isActive, startRoute, resetRoute, isFetching, draftPOIs } = useRoute();

  const handleStartRoute = () => {
    if (draftPOIs.length >= 2) {
      startRoute();
    } else {
      alert("Rotasyon oluşturmak için en az 2 mekan seçmelisiniz.");
    }
  };

  const handleShareRoute = () => {
    const ids = draftPOIs.map(p => p.id).join(',');
    const shareUrl = `${window.location.origin}${window.location.pathname}?route=${ids}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Rota URL'si kopyalandı!");
  };

  if (!isActive && draftPOIs.length === 0) {
    return null;
  }

  return (
    <div className={styles.controlsWrapper}>
      {!isActive ? (
        <button 
          className={styles.startBtn} 
          onClick={handleStartRoute}
          disabled={draftPOIs.length < 2 || isFetching}
        >
          {isFetching ? 'Hesaplanıyor...' : `Rotayı Başlat (${draftPOIs.length} Nokta)`}
        </button>
      ) : (
        <div className={styles.activeActions}>
          <button className={styles.shareBtn} onClick={handleShareRoute} title="Rotayı Paylaş">
            🔗 Paylaş
          </button>
          <button className={styles.resetBtn} onClick={resetRoute} title="Rotayı Sıfırla">
            ✖️ Çıkış
          </button>
        </div>
      )}
    </div>
  );
}
