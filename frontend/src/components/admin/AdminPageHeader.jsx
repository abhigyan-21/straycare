import React from 'react';

const AdminPageHeader = ({ title, actionLabel, onAction }) => {
    return (
        <div className="admin-page-header">
            <h2 className="admin-page-title">{title}</h2>
            {actionLabel && (
                <button className="admin-btn-primary" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default AdminPageHeader;
