import React from 'react';
import { Sparkles, AlertCircle, ShieldAlert, Heart } from 'lucide-react';

const AIVisionInsights = ({ aiData }) => {
    if (!aiData) return null;

    if (aiData.status === 'PENDING') {
        return (
            <div className="ai-insights-pending" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontSize: '0.9rem', marginTop: '8px', padding: '8px 12px', backgroundColor: '#eef2ff', borderRadius: '6px' }}>
                <Sparkles size={16} />
                <span>AI is analyzing this report...</span>
            </div>
        );
    }

    if (aiData.status === 'FAILED') {
        return (
            <div className="ai-insights-failed" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.9rem', marginTop: '8px', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px' }}>
                <AlertCircle size={16} />
                <span>AI analysis failed.</span>
            </div>
        );
    }

    // It's the parsed JSON object
    const urgency = aiData['overall urgency based on visible evidence'] || aiData.urgency || '';
    const isHighUrgency = urgency.toLowerCase().includes('high') || urgency.toLowerCase().includes('immediate') || urgency.toLowerCase().includes('critical');
    
    // Check if it's potentially just for adoption (e.g., healthy stray)
    const visibleInjury = aiData['visible injury'] || '';
    const isHealthy = visibleInjury.toLowerCase().includes('none') || visibleInjury.toLowerCase().includes('no ') || visibleInjury.toLowerCase() === 'unknown';
    const isJustForAdoption = isHealthy && urgency.toLowerCase().includes('low');

    return (
        <div className="ai-insights-container" style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#475569', fontWeight: '600', fontSize: '0.95rem' }}>
                <Sparkles size={16} color="#6366f1" />
                AI Insights
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {urgency && (
                    <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                        backgroundColor: isHighUrgency ? '#fee2e2' : '#fef9c3',
                        color: isHighUrgency ? '#b91c1c' : '#a16207'
                    }}>
                        {isHighUrgency ? <ShieldAlert size={14} /> : <AlertCircle size={14} />}
                        {urgency.toUpperCase()}
                    </span>
                )}
                {isJustForAdoption && (
                    <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                        backgroundColor: '#dcfce7', color: '#15803d'
                    }}>
                        <Heart size={14} />
                        FOR ADOPTION
                    </span>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', fontSize: '0.9rem', color: '#334155' }}>
                {Object.entries(aiData).map(([key, value]) => {
                    // Skip status (if it somehow made it here), and skip empty/unknowns
                    if (key === 'status' || !value || value.toString().toLowerCase() === 'unknown' || value.toString().toLowerCase() === 'none') return null;
                    if (key === 'overall urgency based on visible evidence' || key === 'urgency') return null; // Already shown as badge

                    // Capitalize key
                    const formattedKey = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                    return (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '600', marginBottom: '2px' }}>
                                {formattedKey}
                            </span>
                            <span style={{ fontWeight: '500' }}>{value.toString()}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AIVisionInsights;
