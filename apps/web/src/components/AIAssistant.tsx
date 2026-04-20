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
          ) : recommendations?.recommendations ? (
            <div className="ai-recs-list">
              {recommendations.recommendations.map((rec: any, index: number) => (
                <div key={index} className="ai-rec-card">
                  <div className="ai-rec-header">
                    <span className="ai-rec-name">{rec.name || rec.placeName}</span>
                  </div>
                  <p className="ai-rec-reason">{rec.reason || rec.description}</p>
                  <div className="ai-rec-action">Rotaya Ekle →</div>
                </div>
              ))}

              {recommendations.tips && recommendations.tips.length > 0 && (
                <div className="ai-tips">
                  <h4>💡 Akıllı İpuçları</h4>
                  <ul>
                    {recommendations.tips.map((tip: string, i: number) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button className="ai-btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={fetchRecommendations}>
                Önerileri Güncelle
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
