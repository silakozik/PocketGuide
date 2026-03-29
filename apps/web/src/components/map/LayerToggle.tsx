import styles from './LayerToggle.module.css';

export interface LayerState {
  pins: boolean;
  route: boolean;
  heatmap: boolean;
}

interface LayerToggleProps {
  layers: LayerState;
  onChange: (key: keyof LayerState, value: boolean) => void;
}

export function LayerToggle({ layers, onChange }: LayerToggleProps) {
  const layerConfigs = [
    { key: 'pins' as const, label: 'Pinler', color: '#1D9E75' },
    { key: 'route' as const, label: 'Rota', color: '#185FA5' },
    { key: 'heatmap' as const, label: 'Isı Haritası', color: '#D85A30' },
  ];

  return (
    <div className={styles.layerPanel}>
      <h4 className={styles.title}>Görünümler</h4>
      <div className={styles.layerList}>
        {layerConfigs.map((config) => (
          <div key={config.key} className={styles.layerRow}>
            <div className={styles.layerInfo}>
              <span 
                className={styles.layerDot} 
                style={{ backgroundColor: config.color }} 
              />
              <span className={styles.layerLabel}>{config.label}</span>
            </div>
            
            <label className={styles.toggleSwitch}>
              <input 
                type="checkbox" 
                checked={layers[config.key]} 
                onChange={(e) => onChange(config.key, e.target.checked)} 
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
