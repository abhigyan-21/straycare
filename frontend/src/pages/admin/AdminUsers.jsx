import { Shield, UserX, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import AdminBadge from '../../components/admin/AdminBadge';
import { getAdminUsers } from '../../services/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getAdminUsers();
            setUsers(data);
            setLoading(false);
        };
        fetchUsers();
    }, []);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    if (loading) return <div className="admin-loading">Loading Users...</div>;

    const toggleStatus = (id, currentStatus) => {
        setUsers(users.map(u =>
            u.id === id ? { ...u, status: currentStatus === 'Active' ? 'Suspended' : 'Active' } : u
        ));
    };

    const approveUser = (id) => {
        setUsers(users.map(u => u.id === id ? { ...u, status: 'Active' } : u));
    };

    const filteredUsers = users.filter(user => {
        const matchesTab = activeTab === 'all' || user.role === activeTab;
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             user.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const tableHeaders = [
        { label: 'User / Organization' },
        { label: 'Role' },
        { label: 'Status' },
        { label: 'Actions', center: true }
    ];

    return (
        <div>
            <AdminPageHeader 
                title="Manage Users & Partners" 
                actionLabel="+ Invite Partner / NGO" 
                onAction={() => console.log('Invite clicked')}
            />

            <div className="admin-mb-24 admin-flex-between">
                <div className="admin-tabs">
                    <button 
                        className={`admin-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Members
                    </button>
                    <button 
                        className={`admin-tab ${activeTab === 'user' ? 'active' : ''}`}
                        onClick={() => setActiveTab('user')}
                    >
                        Users
                    </button>
                    <button 
                        className={`admin-tab ${activeTab === 'ngo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ngo')}
                    >
                        NGOs
                    </button>
                    <button 
                        className={`admin-tab ${activeTab === 'partner' ? 'active' : ''}`}
                        onClick={() => setActiveTab('partner')}
                    >
                        Clinics
                    </button>
                </div>

                <div className="admin-search-wrapper">
                    <Search className="admin-search-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        className="admin-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <AdminTable headers={tableHeaders}>
                {filteredUsers.map(user => (
                    <tr key={user.id}>
                        <td>
                            <span className="admin-text-primary">{user.name}</span>
                            <span className="admin-text-secondary">{user.email}</span>
                        </td>
                        <td>
                            <AdminBadge rounded color={user.role === 'user' ? 'light' : 'primary'}>
                                {user.role === 'partner' ? 'Clinic' : user.role.toUpperCase()}
                            </AdminBadge>
                        </td>
                        <td>
                            <AdminBadge 
                                color={user.status === 'Active' ? 'green' : user.status === 'Pending' ? 'light' : 'red'}
                                icon={user.status === 'Active' ? CheckCircle : user.status === 'Pending' ? Clock : UserX}
                            >
                                {user.status}
                            </AdminBadge>
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
                {filteredUsers.length === 0 && (
                    <tr>
                        <td colSpan="4" className="center admin-empty-text">
                            No users found matching your criteria.
                        </td>
                    </tr>
                )}
            </AdminTable>
        </div>
    );
};

export default AdminUsers;
