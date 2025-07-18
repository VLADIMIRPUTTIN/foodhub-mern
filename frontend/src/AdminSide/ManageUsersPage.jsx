import Swal from 'sweetalert2';
import axios from 'axios';

const baseURL = import.meta.env.MODE === "development"
  ? "http://localhost:5000"
  : ""; // Use relative URL for production

const ManageUsersPage = ({
    users,
    fetchUsers // Pass this from AdminDashboard
}) => {
    // Handler for suspend with time
    const handleSuspend = async (userId) => {
        const { value: minutes } = await Swal.fire({
            title: 'Suspend User',
            input: 'number',
            inputLabel: 'Suspend for how many minutes?',
            inputPlaceholder: 'Enter minutes (e.g. 60)',
            inputAttributes: {
                min: 1,
                step: 1
            },
            showCancelButton: true,
            confirmButtonText: 'Suspend',
            inputValidator: (value) => {
                if (!value || value < 1) return 'Please enter a valid number of minutes';
            }
        });
        if (minutes) {
            try {
                await axios.patch(`${baseURL}/api/users/${userId}/suspend`, { minutes }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                await fetchUsers();
                Swal.fire('Suspended!', `User suspended for ${minutes} minutes.`, 'success');
            } catch {
                Swal.fire('Error', 'Failed to suspend user.', 'error');
            }
        }
    };

    // Handler for ban
    const handleBan = async (userId) => {
        const result = await Swal.fire({
            title: 'Ban User',
            text: "Are you sure you want to ban this user?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Yes, ban user!'
        });
        if (result.isConfirmed) {
            try {
                await axios.patch(`${baseURL}/api/users/${userId}/ban`, { reason: "Banned by admin" }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                await fetchUsers();
                Swal.fire('Banned!', 'User has been banned.', 'success');
            } catch {
                Swal.fire('Error', 'Failed to ban user.', 'error');
            }
        }
    };

    // Handler for delete
    const handleDelete = async (userId) => {
        const result = await Swal.fire({
            title: 'Delete User',
            text: "Are you sure you want to delete this user account?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Yes, delete user!'
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(`${baseURL}/api/users/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                await fetchUsers();
                Swal.fire('Deleted!', 'User account deleted.', 'success');
            } catch {
                Swal.fire('Error', 'Failed to delete user.', 'error');
            }
        }
    };

    // Handler for activate
    const handleActivate = async (userId) => {
        try {
            await axios.patch(`${baseURL}/api/users/${userId}/activate`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            await fetchUsers();
            Swal.fire('Activated!', 'User account is now active.', 'success');
        } catch {
            Swal.fire('Error', 'Failed to activate user.', 'error');
        }
    };

    return (
        <div className="users-management">
            <h2>User Management</h2>
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Join Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td>
                                    <span className={`status ${user.status}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td>{user.joinDate ? new Date(user.joinDate).toLocaleDateString() : ''}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn-activate"
                                            onClick={() => handleActivate(user._id)}
                                            disabled={user.status === 'active'}
                                        >
                                            Activate
                                        </button>
                                        <button
                                            className="btn-suspend"
                                            onClick={() => handleSuspend(user._id)}
                                            disabled={user.status === 'suspended'}
                                        >
                                            Suspend
                                        </button>
                                        <button
                                            className="btn-ban"
                                            onClick={() => handleBan(user._id)}
                                            disabled={user.status === 'banned'}
                                        >
                                            Ban
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(user._id)}
                                        >
                                            Delete
                                        </button>
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

export default ManageUsersPage;