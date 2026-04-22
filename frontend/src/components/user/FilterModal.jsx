import React, { useState } from 'react';

const FilterModal = ({ isOpen, onClose, onApply, currentFilters }) => {
    const [filters, setFilters] = useState(currentFilters || {
        type: '',
        breed: '',
        color: '',
        ageGroup: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        onApply(filters);
    };

    const handleClear = () => {
        const cleared = { type: '', breed: '', color: '', ageGroup: '' };
        setFilters(cleared);
        onApply(cleared);
    };

    return (
        <div className="modal-overlay">
            <div className="filter-modal">
                <div className="modal-header">
                    <h3>Filter Pets</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Pet Type</label>
                        <select name="type" value={filters.type} onChange={handleChange}>
                            <option value="">All Types</option>
                            <option value="Dog">Dog</option>
                            <option value="Cat">Cat</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Breed</label>
                        <input
                            type="text"
                            name="breed"
                            placeholder="e.g. Golden Retriever"
                            value={filters.breed}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Color</label>
                        <input
                            type="text"
                            name="color"
                            placeholder="e.g. Black"
                            value={filters.color}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Age Group</label>
                        <select name="ageGroup" value={filters.ageGroup} onChange={handleChange}>
                            <option value="">Any Age Group</option>
                            <option value="Puppy">Puppy</option>
                            <option value="Kitten">Kitten</option>
                            <option value="Young">Young</option>
                            <option value="Adult">Adult</option>
                            <option value="Senior">Senior</option>
                        </select>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-clear" onClick={handleClear}>Clear</button>
                    <button className="btn-apply" onClick={handleApply}>Apply Filters</button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;
