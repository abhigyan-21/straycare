import { Shield, UserX, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';

const mockUsers = [
    { id: 1, name: 'Helping Paws NGO', email: 'contact@helpingpaws.org', role: 'ngo', status: 'Active', joined: '2025-10-12' },
    { id: 2, name: 'City Vet Clinic', email: 'dr.smith@cityvet.com', role: 'partner', status: 'Active', joined: '2025-12-05' },
    { id: 3, name: 'Rescue Rangers', email: 'info@rrangers.org', role: 'ngo', status: 'Pending', joined: '2026-03-08' },
];

const AdminUsers = () => {
    const [users, setUsers] = useState(mockUsers);

    const toggleStatus = (id, currentStatus) => {
        setUsers(users.map(u =>
            u.id === id ? { ...u, status: currentStatus === 'Active' ? 'Suspended' : 'Active' } : u
        ));
    };

    const approveUser = (id) => {
        setUsers(users.map(u => u.id === id ? { ...u, status: 'Active' } : u));
    };

    return (
        <div>
            <div className="admin-page-header">
                <h2 className="admin-page-title">Manage Users & Roles</h2>
                <button className="admin-btn-primary">
                    + Invite Partner / NGO
                </button>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User / Organization</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th className="center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <span className="admin-text-primary">{user.name}</span>
                                    <span className="admin-text-secondary">{user.email}</span>
                                </td>
                                <td>
                                    <span className="admin-badge rounded primary">
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`admin-badge ${user.status === 'Active' ? 'green' : user.status === 'Pending' ? 'light' : 'red'}`}>
                                        {user.status === 'Active' ? <CheckCircle size={16} /> : user.status === 'Pending' ? <Clock size={16} /> : <UserX size={16} />}
                                        {user.status}
                                    </span>
                                </td>
                                <td className="center">
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        {user.status === 'Pending' && (
                                            <button onClick={() => approveUser(user.id)} className="admin-btn-action primary-flex">
                                                Approve
                                            </button>
                                        )}
                                        {user.status !== 'Pending' && (
                                            <button onClick={() => toggleStatus(user.id, user.status)} className={`admin-btn-action ${user.status === 'Active' ? 'danger-flex' : 'primary-flex'}`}>
                                                {user.status === 'Active' ? 'Suspend' : 'Reactivate'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
