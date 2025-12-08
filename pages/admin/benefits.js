import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function BenefitsPage() {
  const { showToast } = useToast();
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    pointWeight: 1.0,
    maxScore: 3.0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/benefits', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        const benefitsList = data.data?.benefits || [];
        // Sort: B01-B12 first, then others
        const b01to12 = benefitsList.filter(b => /^B\d{2}$/.test(b.code) && parseInt(b.code.substring(1)) >= 1 && parseInt(b.code.substring(1)) <= 12);
        const others = benefitsList.filter(b => !/^B\d{2}$/.test(b.code) || parseInt(b.code.substring(1)) > 12);
        setBenefits([...b01to12.sort((a, b) => parseInt(a.code.substring(1)) - parseInt(b.code.substring(1))), ...others]);
      } else {
        showToast('error', data.error?.message || 'Failed to load benefits');
      }
    } catch (error) {
      console.error('Failed to load benefits:', error);
      showToast('error', 'Failed to load benefits');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      pointWeight: 1.0,
      maxScore: 3.0,
      isActive: true,
    });
    setEditingBenefit(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (benefit) => {
    setFormData({
      code: benefit.code,
      name: benefit.name,
      description: benefit.description || '',
      pointWeight: benefit.pointWeight || 1.0,
      maxScore: benefit.maxScore || 3.0,
      isActive: benefit.isActive !== undefined ? benefit.isActive : true,
    });
    setEditingBenefit(benefit);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const url = editingBenefit 
        ? `/api/admin/benefits/${editingBenefit.id}`
        : '/api/admin/benefits';
      const method = editingBenefit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', editingBenefit ? 'Benefit updated successfully' : 'Benefit created successfully');
        setIsCreateOpen(false);
        fetchBenefits();
      } else {
        showToast('error', data.error?.message || 'Operation failed');
      }
    } catch (error) {
      showToast('error', error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/benefits/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Benefit deleted successfully');
        setDeleteConfirm(null);
        fetchBenefits();
      } else {
        showToast('error', data.error?.message || 'Failed to delete benefit');
      }
    } catch (error) {
      showToast('error', error.message || 'Failed to delete benefit');
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Benefit Code',
      render: (benefit) => (
        <span className="font-mono text-sm text-black font-semibold">{benefit.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Benefit Name',
      render: (benefit) => (
        <p className="font-medium text-black">{benefit.name}</p>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (benefit) => (
        <span className="text-sm text-black">{benefit.description || '-'}</span>
      ),
    },
    {
      key: 'maxScore',
      header: 'Max Score',
      render: (benefit) => (
        <span className="text-sm text-black">{benefit.maxScore || 3.0}</span>
      ),
    },
    {
      key: 'questionMappings',
      header: 'Question Mappings',
      render: (benefit) => (
        <span className="text-sm text-black">{benefit.questionMappings || 0}</span>
      ),
    },
    {
      key: 'productMappings',
      header: 'Product Mappings',
      render: (benefit) => (
        <span className="text-sm text-black">{benefit.productMappings || 0}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (benefit) => (
        <Badge color={benefit.isActive ? 'green' : 'red'}>
          {benefit.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Benefits">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-black">Benefits (B01-B12)</h1>
            <p className="text-sm text-black mt-1">Manage benefits used for lens matching and questionnaire mapping</p>
          </div>
          <Button icon={<Plus size={18} />} onClick={handleCreate} className="w-full sm:w-auto shrink-0">
            Add Benefit
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {benefits.length === 0 && !loading ? (
            <EmptyState
              icon={<TrendingUp size={80} className="text-gray-400" />}
              title="No benefits found"
              description="Create benefits to map questionnaire answers and lens products"
              action={{
                label: 'Add Benefit',
                onClick: handleCreate,
              }}
            />
          ) : (
            <DataTable
              columns={columns}
              data={benefits}
              loading={loading}
              rowActions={(benefit) => (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Edit2 size={14} />}
                    onClick={() => handleEdit(benefit)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 size={14} />}
                    onClick={() => setDeleteConfirm(benefit)}
                    disabled={(benefit.questionMappings || 0) > 0 || (benefit.productMappings || 0) > 0}
                  >
                    Delete
                  </Button>
                </div>
              )}
            />
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={editingBenefit ? 'Edit Benefit' : 'Create Benefit'}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-full">
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={submitting} className="rounded-full">
                {editingBenefit ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Benefit Code"
              placeholder="B01, B02, ... B13+"
              value={formData.code}
              onChange={(value) => setFormData({ ...formData, code: value.toUpperCase() })}
              required
              disabled={!!editingBenefit}
              hint={editingBenefit ? "Benefit code cannot be changed after creation" : "Benefit code (e.g., B01, B02, B13)"}
            />

            <Input
              label="Benefit Name"
              placeholder="Digital Screen Protection"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />

            <Input
              label="Description"
              placeholder="Protects eyes from digital screen blue light"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              multiline
              rows={2}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Point Weight"
                type="number"
                step="0.1"
                value={formData.pointWeight?.toString() || '1.0'}
                onChange={(value) => setFormData({ ...formData, pointWeight: parseFloat(value) || 1.0 })}
                hint="Global importance weight"
              />
              <Input
                label="Max Score"
                type="number"
                step="0.1"
                value={formData.maxScore?.toString() || '3.0'}
                onChange={(value) => setFormData({ ...formData, maxScore: parseFloat(value) || 3.0 })}
                hint="Maximum score (usually 3.0)"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-zinc-700">
                Active
              </label>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Benefit"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-full">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} className="rounded-full">
                Delete
              </Button>
            </>
          }
        >
          <p className="text-zinc-600">
            Are you sure you want to delete <strong className="text-zinc-900">{deleteConfirm?.name}</strong>?
            {((deleteConfirm?.questionMappings || 0) > 0 || (deleteConfirm?.productMappings || 0) > 0) && (
              <span className="block mt-2 text-red-600">
                This benefit is used by {deleteConfirm?.questionMappings || 0} question(s) and {deleteConfirm?.productMappings || 0} product(s). Deletion will fail.
              </span>
            )}
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}

