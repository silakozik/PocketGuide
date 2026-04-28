import { useRoute } from '../../context/RouteContext';
import styles from './DirectionsPanel.module.css';

export function DirectionsPanel() {
  const { isActive, routeData, activeLegIndex, activeStepIndex, nextStep, prevStep } = useRoute();

  if (!isActive || !routeData) {
    return null;
  }

  const activeLeg = routeData.legs[activeLegIndex];
  const activeStep = activeLeg.steps[activeStepIndex];

  const totalSteps = routeData.legs.reduce((acc, leg) => acc + leg.steps.length, 0);
  let currentStepAbsolute = 0;
  for (let i = 0; i < activeLegIndex; i++) {
    currentStepAbsolute += routeData.legs[i].steps.length;
  }
  currentStepAbsolute += activeStepIndex + 1;

  // ORS step type to icon
  const getStepIcon = (type: number) => {
    switch (type) {
      case 0: return '⬆️'; // Start or proceed
      case 1: return '➡️'; // Turn right
      case 2: return '⬅️'; // Turn left
      case 3: return '↗️'; // Sharp right
      case 4: return '↖️'; // Sharp left
      case 11: return '🔄'; // Roundabout
      case 12: return '🏁'; // Arrive
      default: return '➡️';
    }
  };

  return (
    <div className={styles.panelContainer}>
      <div className={styles.panelHeader}>
        <div className={styles.summary}>
          <span className={styles.duration}>{routeData.total_duration_min} dk</span>
          <span className={styles.distance}>({routeData.total_distance_km.toFixed(1)} km)</span>
        </div>
        <div className={styles.stepProgress}>
          Adım {currentStepAbsolute} / {totalSteps}
        </div>
      </div>

      <div className={styles.activeStepCard}>
        <div className={styles.stepIcon}>{getStepIcon(activeStep.type)}</div>
        <div className={styles.stepDetails}>
          <h3 className={styles.instruction}>{activeStep.instruction}</h3>
          <p className={styles.stepMetrics}>
            Kalan mesafe: <strong>{(activeStep.distance < 1000 ? activeStep.distance + ' m' : (activeStep.distance/1000).toFixed(1) + ' km')}</strong>
          </p>
        </div>
      </div>

      <div className={styles.panelControls}>
        <button 
          className={styles.controlBtn} 
          onClick={prevStep}
          disabled={activeLegIndex === 0 && activeStepIndex === 0}
        >
          Önceki
        </button>
        <button 
          className={styles.controlBtnPrimary} 
          onClick={nextStep}
          disabled={activeLegIndex === routeData.legs.length - 1 && activeStepIndex === routeData.legs[routeData.legs.length - 1].steps.length - 1}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
