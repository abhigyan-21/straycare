import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const RescueContext = createContext();

export const RescueProvider = ({ children }) => {
    // Initialize state from localStorage if available
    const [activeRescue, setActiveRescue] = useState(() => {
        const saved = localStorage.getItem('activeRescue');
        return saved ? JSON.parse(saved) : {
            isActive: false,
            reportId: null,
            mode: null, // 'user' or 'rescuer'
            eta: null
        };
    });

    // Persist to localStorage whenever activeRescue changes
    useEffect(() => {
        localStorage.setItem('activeRescue', JSON.stringify(activeRescue));
    }, [activeRescue]);

    const startRescue = useCallback((reportId, mode, initialEta) => {
        setActiveRescue({
            isActive: true,
            reportId,
            mode,
            eta: initialEta || 0
        });
    }, []);

    const updateRescueEta = useCallback((newEta) => {
        setActiveRescue(prev => ({
            ...prev,
            eta: newEta
        }));
    }, []);

    const endRescue = useCallback(() => {
        setActiveRescue({
            isActive: false,
            reportId: null,
            mode: null,
            eta: null
        });
        localStorage.removeItem('activeRescue');
    }, []);

    return (
        <RescueContext.Provider value={{ activeRescue, startRescue, updateRescueEta, endRescue }}>
            {children}
        </RescueContext.Provider>
    );
};

export const useRescue = () => {
    const context = useContext(RescueContext);
    if (!context) {
        throw new Error('useRescue must be used within a RescueProvider');
    }
    return context;
};
