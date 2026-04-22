import React from 'react';

const AdminTable = ({ headers, children }) => {
    return (
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index} className={header.center ? 'center' : ''}>
                                {header.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export default AdminTable;
