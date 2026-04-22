import React from 'react';

const AdminBadge = ({ children, color, rounded = false, icon: Icon }) => {
    const colorClass = color ? color : 'primary';
    const roundedClass = rounded ? 'rounded' : '';
    
    return (
        <span className={`admin-badge ${roundedClass} ${colorClass}`}>
            {Icon && <Icon size={16} />}
            {children}
        </span>
    );
};

export default AdminBadge;
