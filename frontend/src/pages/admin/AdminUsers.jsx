import { Shield, UserX, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTable from '../../components/admin/AdminTable';
import AdminBadge from '../../components/admin/AdminBadge';
import { getAdminUsers, updateAdminUserStatus, deleteAdminUser } from '../../services/api';

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

    const toggleStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        try {
            await updateAdminUserStatus(id, nextStatus);
            setUsers(users.map(u =>
                u.id === id ? { ...u, status: nextStatus } : u
            ));
        } catch (error) {
            console.error('Failed to update user status:', error);
            alert('Error updating user status: ' + (error.response?.data?.error || error.message));
        }
    };

    const approveUser = async (id) => {
        try {
            await updateAdminUserStatus(id, 'Active');
            setUsers(users.map(u => u.id === id ? { ...u, status: 'Active' } : u));
        } catch (error) {
            console.error('Failed to approve user:', error);
            alert('Error approving user: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this user?")) {
            try {
                await deleteAdminUser(id);
                setUsers(users.filter(u => u.id !== id));
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Error deleting user: " + (error.response?.data?.error || error.message));
            }
        }
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
        <>
        <Helmet>
            <title>Furzo Admin - Users</title>
            <meta name="description" content="Manage Furzo users, NGOs, and partner clinics. Approve, suspend, or remove accounts." />
        </Helmet>
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
                            <div className="admin-text-primary" style={{ fontWeight: 600 }}>{user.name}</div>
                            <div className="admin-text-secondary" style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>{user.email}</div>
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
                                <button onClick={() => handleDeleteUser(user.id)} className="admin-btn-action danger-flex" style={{ background: '#e0645c', color: 'white' }}>
                                    Delete
                                </button>
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
        </>
    );
};

export default AdminUsers;
