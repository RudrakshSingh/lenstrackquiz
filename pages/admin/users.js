import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { userService } from '../../services/users';
import { storeService } from '../../services/stores';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Badge from '../../components/ui/Badge';

const ROLE_COLORS = {
  SUPER_ADMIN: 'purple',
  ADMIN: 'blue',
  STORE_MANAGER: 'green',
  SALES_EXECUTIVE: 'gray',
};

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STORE_MANAGER', label: 'Store Manager' },
  { value: 'SALES_EXECUTIVE', label: 'Sales Executive' },
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: '',
    storeId: '',
    employeeId: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    fetchStores();
    fetchUsers();
  }, [roleFilter, storeFilter]);

  const fetchStores = async () => {
    try {
      const data = await storeService.list({ isActive: true });
      setStores(data);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (storeFilter !== 'all') {
        params.storeId = storeFilter;
      }
      if (search) {
        params.search = search;
      }
      const data = await userService.list(params);
      setUsers(data.users || data || []);
    } catch (error) {
      showToast('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setTimeout(() => {
      fetchUsers();
    }, 300);
  };

  const getAvailableRoles = () => {
    if (!currentUser) return [];
    const userRole = currentUser.role;
    
    if (userRole === 'SUPER_ADMIN') {
      return ROLE_OPTIONS;
    } else if (userRole === 'ADMIN') {
      return ROLE_OPTIONS.filter(r => r.value !== 'SUPER_ADMIN');
    } else if (userRole === 'STORE_MANAGER') {
      return ROLE_OPTIONS.filter(r => r.value === 'SALES_EXECUTIVE');
    }
    return [];
  };

  const handleCreate = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: '',
      storeId: currentUser?.storeId || '',
      employeeId: '',
      phone: '',
    });
    setFormErrors({});
    setEditingUser(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (user) => {
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      storeId: user.storeId || '',
      employeeId: user.employeeId || '',
      phone: user.phone || '',
    });
    setFormErrors({});
    setEditingUser(user);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!editingUser && !formData.password) {
      setFormErrors({ password: 'Password is required' });
      return;
    }

    try {
      const submitData = { ...formData };
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }
      if (!submitData.storeId) {
        delete submitData.storeId;
      }

      if (editingUser) {
        await userService.update(editingUser.id || editingUser._id, submitData);
        showToast('success', 'User updated successfully');
      } else {
        await userService.create(submitData);
        showToast('success', 'User created successfully');
      }
      setIsCreateOpen(false);
      fetchUsers();
    } catch (error) {
      if (error.code === 'RESOURCE_CONFLICT') {
        setFormErrors({ email: 'A user with this email already exists' });
      } else if (error.code === 'VALIDATION_ERROR' && error.details) {
        setFormErrors(error.details);
      } else {
        showToast('error', error.message || 'Failed to save user');
      }
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm._id === currentUser._id) {
      showToast('error', 'You cannot delete your own account');
      setDeleteConfirm(null);
      return;
    }

    try {
      await userService.delete(deleteConfirm.id || deleteConfirm._id);
      showToast('success', 'User deleted successfully');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (error) {
      showToast('error', error.message || 'Failed to delete user');
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'employeeId', header: 'Employee ID' },
    {
      key: 'role',
      header: 'Role',
      render: (item) => (
        <Badge color={ROLE_COLORS[item.role] || 'gray'} variant="soft">
          {ROLE_OPTIONS.find(r => r.value === item.role)?.label || item.role}
        </Badge>
      ),
    },
    { key: 'storeName', header: 'Store' },
    { key: 'phone', header: 'Phone' },
  ];

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Users</h2>
            <p className="text-sm text-gray-500 mt-1">Manage staff and administrators</p>
          </div>
          {getAvailableRoles().length > 0 && (
            <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>
              Add User
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={search}
              onChange={handleSearch}
              icon={<Search className="h-5 w-5" />}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="all">All Roles</option>
            {ROLE_OPTIONS.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="all">All Stores</option>
            {stores.map(store => (
              <option key={store._id} value={store._id}>{store.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md">
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            emptyMessage="No users found"
            rowActions={(item) => (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  className="text-primary hover:text-primary-hover"
                >
                  <Edit className="h-4 w-4" />
                </button>
                {item.id !== currentUser?._id && item.id !== currentUser?.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(item);
                    }}
                    className="text-danger hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={editingUser ? 'Edit User' : 'Create User'}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              required
              error={formErrors.email}
              disabled={!!editingUser}
            />
            <Input
              label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
              type="password"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              required={!editingUser}
              error={formErrors.password}
            />
            <Input
              label="Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
              error={formErrors.name}
            />
            <Select
              label="Role"
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
              options={getAvailableRoles()}
              required
              error={formErrors.role}
            />
            {(formData.role === 'STORE_MANAGER' || formData.role === 'SALES_EXECUTIVE') && (
              <Select
                label="Store"
                value={formData.storeId}
                onChange={(value) => setFormData({ ...formData, storeId: value })}
                options={stores.map(s => ({ value: s._id, label: s.name }))}
                required
                error={formErrors.storeId}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Employee ID"
                value={formData.employeeId}
                onChange={(value) => setFormData({ ...formData, employeeId: value })}
                error={formErrors.employeeId}
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                error={formErrors.phone}
              />
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete User"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}

