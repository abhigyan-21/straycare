import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import '../styles/vet/VetStatus.css';

function StatusDropdown({ value, onChange, options }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className="custom-dropdown-container" ref={dropdownRef}>
            <div 
                className={`custom-dropdown-trigger ${selectedOption.class}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="selected-label">{selectedOption.label}</span>
                <ChevronDown className={`dropdown-arrow ${isOpen ? 'open' : ''}`} size={16} />
            </div>

            {isOpen && (
                <ul className="custom-dropdown-menu">
                    {options.map((opt) => (
                        <li 
                            key={opt.value}
                            className={`custom-dropdown-item ${opt.value === value ? 'active' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default StatusDropdown;
