import { useEffect, useRef } from 'react';
import { useNetworkStatus } from '@pocketguide/hooks';
import { POI } from '../../types/poi';
import { PIN_COLORS, PIN_ICONS } from '../../constants/mapConfig';
import { useRoute } from '../../context/RouteContext';
import { useSyncManagerContext } from '../../context/SyncManagerContext';
import { getOrCreateLocalUserId } from '../../lib/clientIdentity';
import styles from './POICard.module.css';

export interface POICardProps {
  poi: POI | null;
  clusterPois?: POI[] | null;
  onClose: () => void;
  onSelectPOI?: (poi: POI) => void;
}

export function POICard({ poi, clusterPois, onClose, onSelectPOI }: POICardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { draftPOIs, addToRouteDraft, removeFromRouteDraft } = useRoute();
  const { isOnline } = useNetworkStatus();
  const sync = useSyncManagerContext();
  
  const isInDraft = poi ? draftPOIs.some(p => p.id === poi.id) : false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (poi || (clusterPois && clusterPois.length > 0)) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [poi, clusterPois, onClose]);

  if (!poi && (!clusterPois || clusterPois.length === 0)) return null;

  if (clusterPois && clusterPois.length > 0) {
    return (
      <div className={`${styles.card} ${styles.visible}`} ref={cardRef}>
        <div className={styles.listHeader}>
          <h3 className={styles.title}>{clusterPois.length} Nokta Bulundu</h3>
          <button className={styles.closeBtnList} onClick={onClose}>×</button>
        </div>
        <div className={styles.listBody}>
          {clusterPois.map(p => (
            <div key={p.id} className={styles.listItem} onClick={() => onSelectPOI?.(p)}>
              <span className={styles.listIcon} style={{backgroundColor: PIN_COLORS[p.category]}}>{PIN_ICONS[p.category]}</span>
              <div className={styles.listText}>
                <div className={styles.listTitle}>{p.name}</div>
                <div className={styles.listMeta}>{p.distance ? `${p.distance} km` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Single POI exact properties...
  if (!poi) return null;
  const color = PIN_COLORS[poi.category];
  const icon = PIN_ICONS[poi.category];

  return (
    <div className={`${styles.card} ${styles.visible}`} ref={cardRef}>
      <div className={styles.header} style={{ backgroundColor: color }}>
        <div className={styles.headerIcon}>{icon}</div>
        <div className={styles.headerInfo}>
          <h3 className={styles.title}>{poi.name}</h3>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${poi.isOpen ? styles.open : styles.closed}`}>
              {poi.isOpen ? 'Açık' : 'Kapalı'}
            </span>
            {poi.rating && (
              <span className={styles.badgeRating}>
                ★ {poi.rating.toFixed(1)}
              </span>
            )}
            {poi.distance !== undefined && (
              <span className={styles.badgeDistance}>
                📍 {poi.distance.toFixed(1)} km
              </span>
            )}
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.body}>
        {poi.description && <p className={styles.description}>{poi.description}</p>}
        
        <div className={styles.actions}>
          {isInDraft ? (
            <button 
              className={`${styles.actionBtn} ${styles.secondaryBtn}`}
              onClick={() => removeFromRouteDraft(poi.id)}
            >
              Rotadan Çıkar
            </button>
          ) : (
            <button 
              className={`${styles.actionBtn} ${styles.primaryBtn}`}
              onClick={() => addToRouteDraft(poi)}
            >
              Rotaya Ekle ({draftPOIs.length} Seçili)
            </button>
          )}
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.secondaryBtn}`}
            title={
              !isOnline
                ? 'Çevrimdışı: favori sıraya alındı, bağlantı gelince senkron olur.'
                : 'Favori sunucuya senkron kuyruğuna eklendi'
            }
            onClick={() => {
              if (!poi) return;
              const uid = getOrCreateLocalUserId();
              void (async () => {
                await sync.enqueuePendingChange({
                  id: `fav-add-${uid}-${poi.id}`,
                  action: 'favorite.add',
                  endpoint: '/pois/favorites',
                  payload: { resource: 'pois', userId: uid, placeId: poi.id },
                  createdAt: new Date().toISOString(),
                });
                if (isOnline) void sync.syncPendingChanges();
              })();
            }}
          >
            Favoriye ekle
          </button>
        </div>
      </div>
    </div>
  );
}
