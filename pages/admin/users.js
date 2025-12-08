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
import { Plus, Edit, Trash2, Search, Users as UsersIcon } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

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
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-black">Team Members</h1>
            <p className="text-sm text-black mt-1">Manage your staff accounts and permissions</p>
          </div>
          {getAvailableRoles().length > 0 && (
            <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto shrink-0">
              Add Team Member
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 animate-fade-in animate-delay-100">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={search}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base shrink-0 sm:w-auto w-full"
          >
            <option value="all">Filter by role</option>
            {ROLE_OPTIONS.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-900 animate-pulse-slow"></div>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<UsersIcon size={80} className="text-gray-300" />}
                title="No team members"
                description="Add your first team member to get started"
                action={{
                  label: 'Add Team Member',
                  onClick: handleCreate,
                }}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              loading={false}
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
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={editingUser ? 'Edit Team Member' : 'Add Team Member'}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} type="submit">
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
                error={formErrors.name}
              />
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                required
                error={formErrors.email}
                disabled={!!editingUser}
              />
            </div>
            <Input
              label={editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
              type="password"
              value={formData.password}
              onChange={(value) => setFormData({ ...formData, password: value })}
              required={!editingUser}
              error={formErrors.password}
              hint={!editingUser ? "Minimum 8 characters, 1 uppercase, 1 number" : undefined}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Role *"
                value={formData.role}
                onChange={(value) => setFormData({ ...formData, role: value })}
                options={getAvailableRoles()}
                required
                error={formErrors.role}
              />
              <Select
                label="Store"
                value={formData.storeId}
                onChange={(value) => setFormData({ ...formData, storeId: value })}
                options={[{ value: '', label: 'No Store (Admin)' }, ...stores.map(s => ({ value: s._id, label: s.name }))]}
                error={formErrors.storeId}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <p className="text-black">
            Are you sure you want to delete <strong className="text-black">{deleteConfirm?.name}</strong>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}

