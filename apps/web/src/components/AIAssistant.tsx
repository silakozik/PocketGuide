import React, { useState } from 'react';

/**
 * AIAssistant Component
 * 
 * A premium AI-powered recommendation panel for the Map Page.
 * Uses Gemini API to suggest places based on context.
 */
export const AIAssistant: React.FC<{ lat?: number; lng?: number }> = ({ lat, lng }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Default to Elazığ center if not provided
      const latitude = lat || 38.6748;
      const longitude = lng || 39.2225;

      const response = await fetch(`/api/ai/recommendations?lat=${latitude}&lng=${longitude}`);
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to fetch AI recommendations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && !recommendations && !loading) {
      fetchRecommendations();
    }
  };

  return (
    <>
      <button className="ai-fab" onClick={handleToggle} title="AI Asistan">
        <span className="ai-sparkle">✨</span>
      </button>

      <div className={`ai-assistant-panel ${!isOpen ? 'hidden' : ''}`}>
        <div className="ai-header">
          <div className="ai-header-title">
            <span className="ai-sparkle">✨</span>
            <h3>Gezi Asistanı</h3>
          </div>
          <button className="ai-close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className="ai-content">
          {loading ? (
            <div className="ai-loading-wrap">
              <div className="ai-spinner"></div>
              <p>Gemini senin için planlıyor...</p>
            </div>
          ) : Array.isArray(recommendations) ? (
            <div className="ai-recs-list">
              {recommendations.map((rec: any, index: number) => (
                <div key={index} className="ai-rec-card">
                  <div className="ai-rec-header">
                    <span className="ai-rec-name">{rec.name}</span>
                    <span className="ai-rec-category">{rec.category}</span>
                  </div>
                  <p className="ai-rec-reason">{rec.reason}</p>
                  <div className="ai-rec-meta">
                    <span className="ai-meta-item">📍 {rec.walkingDistanceMeters}m</span>
                    <span className="ai-meta-item">🕒 {rec.estimatedVisitMinutes} dk</span>
                  </div>
                  <div className="ai-rec-action">Rotayı Başlat →</div>
                </div>
              ))}

              <button className="ai-btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={fetchRecommendations}>
                Önerileri Yenile
              </button>
            </div>
          ) : (
            <div className="ai-empty-state">
              <span className="ai-empty-icon">📍</span>
              <p>Çevrendeki en iyi deneyimler için hazır mısın?</p>
              <button className="ai-btn-primary" onClick={fetchRecommendations}>
                Bana Öneriler Getir
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
