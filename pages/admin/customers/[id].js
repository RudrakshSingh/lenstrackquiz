import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/layout/AdminLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowLeft, Save, Eye } from 'lucide-react';

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    email: '',
    // Prescription fields
    rightSph: '',
    rightCyl: '',
    rightAxis: '',
    leftSph: '',
    leftCyl: '',
    leftAxis: '',
    add: '',
    pd: '',
    // Additional prescription fields
    prescriptionType: '',
    doctorName: '',
    prescriptionDate: '',
  });

  useEffect(() => {
    if (id && user?.organizationId) {
      fetchCustomer();
    }
  }, [id, user]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/customers/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        const customerData = data.data;
        setCustomer(customerData);
        setFormData({
          name: customerData.name || '',
          number: customerData.number || '',
          email: customerData.email || '',
          // Prescription from power object
          rightSph: customerData.power?.right?.sph?.toString() || '',
          rightCyl: customerData.power?.right?.cyl?.toString() || '',
          rightAxis: customerData.power?.right?.axis?.toString() || '',
          leftSph: customerData.power?.left?.sph?.toString() || '',
          leftCyl: customerData.power?.left?.cyl?.toString() || '',
          leftAxis: customerData.power?.left?.axis?.toString() || '',
          add: customerData.add?.toString() || '',
          pd: customerData.pd?.toString() || '',
          prescriptionType: customerData.prescriptionType || '',
          doctorName: customerData.doctorName || '',
          prescriptionDate: customerData.prescriptionDate || '',
        });
      } else {
        showToast('error', data.error?.message || 'Failed to load customer');
        router.push('/admin/customers');
      }
    } catch (error) {
      console.error('Failed to load customer:', error);
      showToast('error', 'Failed to load customer');
      router.push('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          number: formData.number,
          email: formData.email,
          power: {
            right: {
              sph: formData.rightSph ? parseFloat(formData.rightSph) : null,
              cyl: formData.rightCyl ? parseFloat(formData.rightCyl) : null,
              axis: formData.rightAxis ? parseFloat(formData.rightAxis) : null,
            },
            left: {
              sph: formData.leftSph ? parseFloat(formData.leftSph) : null,
              cyl: formData.leftCyl ? parseFloat(formData.leftCyl) : null,
              axis: formData.leftAxis ? parseFloat(formData.leftAxis) : null,
            },
          },
          add: formData.add ? parseFloat(formData.add) : null,
          pd: formData.pd ? parseFloat(formData.pd) : null,
          prescriptionType: formData.prescriptionType || null,
          doctorName: formData.doctorName || null,
          prescriptionDate: formData.prescriptionDate || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Customer updated successfully');
        fetchCustomer();
      } else {
        showToast('error', data.error?.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast('error', 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Spinner />
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-red-600">Customer not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/customers')}
              icon={<ArrowLeft size={18} />}
              className="rounded-full mb-4"
            >
              Back
            </Button>
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
              Customer Details
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              View and edit customer information and prescription
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Name *"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                required
              />
              <Input
                label="Phone *"
                type="tel"
                value={formData.number}
                onChange={(value) => setFormData({ ...formData, number: value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
              />
            </div>
          </Card>

          {/* Prescription Section */}
          <Card>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Prescription (RX)
            </h3>

            {/* Right Eye (OD) */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Right Eye (OD - Oculus Dexter)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Sphere (S)"
                  type="number"
                  step="0.25"
                  value={formData.rightSph}
                  onChange={(value) => setFormData({ ...formData, rightSph: value })}
                  placeholder="e.g., -2.50"
                />
                <Input
                  label="Cylinder (C)"
                  type="number"
                  step="0.25"
                  value={formData.rightCyl}
                  onChange={(value) => setFormData({ ...formData, rightCyl: value })}
                  placeholder="e.g., -0.75"
                />
                <Input
                  label="Axis"
                  type="number"
                  min="0"
                  max="180"
                  value={formData.rightAxis}
                  onChange={(value) => setFormData({ ...formData, rightAxis: value })}
                  placeholder="0-180"
                />
              </div>
            </div>

            {/* Left Eye (OS) */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Left Eye (OS - Oculus Sinister)
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Sphere (S)"
                  type="number"
                  step="0.25"
                  value={formData.leftSph}
                  onChange={(value) => setFormData({ ...formData, leftSph: value })}
                  placeholder="e.g., -2.50"
                />
                <Input
                  label="Cylinder (C)"
                  type="number"
                  step="0.25"
                  value={formData.leftCyl}
                  onChange={(value) => setFormData({ ...formData, leftCyl: value })}
                  placeholder="e.g., -0.75"
                />
                <Input
                  label="Axis"
                  type="number"
                  min="0"
                  max="180"
                  value={formData.leftAxis}
                  onChange={(value) => setFormData({ ...formData, leftAxis: value })}
                  placeholder="0-180"
                />
              </div>
            </div>

            {/* ADD and PD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Input
                label="ADD"
                type="number"
                step="0.25"
                value={formData.add}
                onChange={(value) => setFormData({ ...formData, add: value })}
                placeholder="e.g., +2.00"
              />
              <Input
                label="PD (Pupillary Distance) mm"
                type="number"
                step="0.5"
                value={formData.pd}
                onChange={(value) => setFormData({ ...formData, pd: value })}
                placeholder="e.g., 64"
              />
            </div>

            {/* Additional Prescription Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Prescription Type"
                value={formData.prescriptionType}
                onChange={(value) => setFormData({ ...formData, prescriptionType: value })}
                placeholder="e.g., Progressive, Bifocal"
              />
              <Input
                label="Doctor Name"
                value={formData.doctorName}
                onChange={(value) => setFormData({ ...formData, doctorName: value })}
                placeholder="Dr. Smith"
              />
              <Input
                label="Prescription Date"
                type="date"
                value={formData.prescriptionDate}
                onChange={(value) => setFormData({ ...formData, prescriptionDate: value })}
              />
            </div>
          </Card>

          {/* Customer Data (Read-only) */}
          {customer && (
            <Card>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Store
                  </label>
                  <p className="text-zinc-900 dark:text-zinc-50 mt-1">
                    {customer.storeName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Salesperson
                  </label>
                  <p className="text-zinc-900 dark:text-zinc-50 mt-1">
                    {customer.salespersonName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Frame Type
                  </label>
                  <p className="mt-1">
                    {customer.frameType ? (
                      <Badge color="blue" variant="soft">
                        {customer.frameType.replace('_', ' ')}
                      </Badge>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Created At
                  </label>
                  <p className="text-zinc-900 dark:text-zinc-50 mt-1">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/customers')}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              icon={<Save size={18} />}
              className="rounded-full"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}


