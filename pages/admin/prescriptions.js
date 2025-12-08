import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Eye, FileText } from 'lucide-react';

export default function PrescriptionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    odSphere: undefined,
    odCylinder: undefined,
    odAxis: undefined,
    odAdd: undefined,
    osSphere: undefined,
    osCylinder: undefined,
    osAxis: undefined,
    osAdd: undefined,
    pdDistance: undefined,
    pdNear: undefined,
    pdSingle: undefined,
    prescriptionType: '',
    doctorName: '',
    doctorLicense: '',
    prescriptionDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.organizationId) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/prescriptions', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setPrescriptions(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast('error', data.error?.message || 'Failed to load prescriptions');
      }
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
      showToast('error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch('/api/admin/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          organizationId: user.organizationId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        showToast('success', 'Prescription created successfully');
        setIsCreateOpen(false);
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          odSphere: undefined,
          odCylinder: undefined,
          odAxis: undefined,
          odAdd: undefined,
          osSphere: undefined,
          osCylinder: undefined,
          osAxis: undefined,
          osAdd: undefined,
          pdDistance: undefined,
          pdNear: undefined,
          pdSingle: undefined,
          prescriptionType: '',
          doctorName: '',
          doctorLicense: '',
          prescriptionDate: '',
        });
        fetchPrescriptions();
      } else {
        showToast('error', data.error?.message || 'Failed to create prescription');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showToast('error', 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'customerName',
      header: 'Customer',
      render: (prescription) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-50">
            {prescription.customerName || 'N/A'}
          </div>
          {prescription.customerPhone && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {prescription.customerPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'odSphere',
      header: 'Right Eye (OD)',
      render: (prescription) => (
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          {prescription.odSphere !== null && prescription.odSphere !== undefined ? (
            <div className="space-y-1">
              <div>S: {prescription.odSphere}</div>
              {prescription.odCylinder !== null && prescription.odCylinder !== undefined && (
                <div>C: {prescription.odCylinder}</div>
              )}
              {prescription.odAxis !== null && prescription.odAxis !== undefined && (
                <div>A: {prescription.odAxis}°</div>
              )}
              {prescription.odAdd !== null && prescription.odAdd !== undefined && (
                <div>Add: {prescription.odAdd}</div>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500">Not specified</span>
          )}
        </div>
      ),
    },
    {
      key: 'osSphere',
      header: 'Left Eye (OS)',
      render: (prescription) => (
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          {prescription.osSphere !== null && prescription.osSphere !== undefined ? (
            <div className="space-y-1">
              <div>S: {prescription.osSphere}</div>
              {prescription.osCylinder !== null && prescription.osCylinder !== undefined && (
                <div>C: {prescription.osCylinder}</div>
              )}
              {prescription.osAxis !== null && prescription.osAxis !== undefined && (
                <div>A: {prescription.osAxis}°</div>
              )}
              {prescription.osAdd !== null && prescription.osAdd !== undefined && (
                <div>Add: {prescription.osAdd}</div>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500">Not specified</span>
          )}
        </div>
      ),
    },
    {
      key: 'pdDistance',
      header: 'PD',
      render: (prescription) => (
        <div className="text-sm text-zinc-700 dark:text-zinc-300">
          {prescription.pdDistance ? (
            <div className="space-y-1">
              <div>D: {prescription.pdDistance}mm</div>
              {prescription.pdNear && <div>N: {prescription.pdNear}mm</div>}
            </div>
          ) : (
            'N/A'
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (prescription) => (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {new Date(prescription.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Prescriptions Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50 tracking-tight">
              Prescriptions (RX)
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Manage customer optical prescriptions
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={18} />}
            className="rounded-full"
          >
            Add Prescription
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<FileText size={48} />}
                title="No Prescriptions"
                description="Start by adding a new prescription"
                action={{
                  label: 'Add Prescription',
                  onClick: () => setIsCreateOpen(true),
                  icon: <Plus size={20} />,
                }}
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={prescriptions}
              loading={loading}
              emptyMessage="No prescriptions found"
              rowActions={(prescription) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingPrescription(prescription);
                  }}
                  icon={<Eye size={14} />}
                  className="rounded-full"
                >
                  View
                </Button>
              )}
            />
          )}
        </div>

        {/* Create Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Add Prescription"
          size="lg"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                className="rounded-full"
              >
                Save Prescription
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Customer Name"
                  value={formData.customerName}
                  onChange={(value) => setFormData({ ...formData, customerName: value })}
                  placeholder="John Doe"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(value) => setFormData({ ...formData, customerPhone: value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Right Eye (OD) */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                Right Eye (OD - Oculus Dexter)
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <Input
                  label="Sphere (S)"
                  type="number"
                  step="0.25"
                  value={formData.odSphere?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, odSphere: value ? parseFloat(value) : undefined })
                  }
                  placeholder="e.g., -2.50"
                />
                <Input
                  label="Cylinder (C)"
                  type="number"
                  step="0.25"
                  value={formData.odCylinder?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, odCylinder: value ? parseFloat(value) : undefined })
                  }
                  placeholder="e.g., -0.75"
                />
                <Input
                  label="Axis"
                  type="number"
                  min="0"
                  max="180"
                  value={formData.odAxis?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, odAxis: value ? parseInt(value) : undefined })
                  }
                  placeholder="0-180"
                />
                <Input
                  label="Add"
                  type="number"
                  step="0.25"
                  value={formData.odAdd?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, odAdd: value ? parseFloat(value) : undefined })
                  }
                  placeholder="e.g., +2.00"
                />
              </div>
            </div>

            {/* Left Eye (OS) */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                Left Eye (OS - Oculus Sinister)
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <Input
                  label="Sphere (S)"
                  type="number"
                  step="0.25"
                  value={formData.osSphere?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, osSphere: value ? parseFloat(value) : undefined })
                  }
                  placeholder="e.g., -2.50"
                />
                <Input
                  label="Cylinder (C)"
                  type="number"
                  step="0.25"
                  value={formData.osCylinder?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, osCylinder: value ? parseFloat(value) : undefined })
                  }
                  placeholder="e.g., -0.75"
                />
                <Input
                  label="Axis"
                  type="number"
                  min="0"
                  max="180"
                  value={formData.osAxis?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, osAxis: value ? parseInt(value) : undefined })
                  }
                  placeholder="0-180"
                />
                <Input
                  label="Add"
                  type="number"
                  step="0.25"
                  value={formData.osAdd?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, osAdd: value ? parseFloat(value) : undefined })
                  }
                  placeholder="e.g., +2.00"
                />
              </div>
            </div>

            {/* PD */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                Pupillary Distance (PD)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Distance PD (mm)"
                  type="number"
                  step="0.5"
                  value={formData.pdDistance?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, pdDistance: value ? parseFloat(value) : undefined })
                  }
                  placeholder="e.g., 64"
                />
                <Input
                  label="Near PD (mm)"
                  type="number"
                  step="0.5"
                  value={formData.pdNear?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, pdNear: value ? parseFloat(value) : undefined })
                  }
                  placeholder="e.g., 62"
                />
                <Input
                  label="Single PD (mm)"
                  type="number"
                  step="0.5"
                  value={formData.pdSingle?.toString() || ''}
                  onChange={(value) =>
                    setFormData({ ...formData, pdSingle: value ? parseFloat(value) : undefined })
                  }
                  placeholder="If same for both"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                Additional Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input
                  label="Prescription Date"
                  type="date"
                  value={formData.prescriptionDate}
                  onChange={(value) => setFormData({ ...formData, prescriptionDate: value })}
                />
                <Input
                  label="Doctor License"
                  value={formData.doctorLicense}
                  onChange={(value) => setFormData({ ...formData, doctorLicense: value })}
                  placeholder="Optional"
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={!!viewingPrescription}
          onClose={() => setViewingPrescription(null)}
          title="Prescription Details"
          size="lg"
          footer={
            <Button
              variant="outline"
              onClick={() => setViewingPrescription(null)}
              className="rounded-full"
            >
              Close
            </Button>
          }
        >
          {viewingPrescription && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-50">Customer</h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  {viewingPrescription.customerName || 'N/A'}
                </p>
                {viewingPrescription.customerPhone && (
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {viewingPrescription.customerPhone}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-50">
                    Right Eye (OD)
                  </h3>
                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    <p>Sphere: {viewingPrescription.odSphere ?? 'N/A'}</p>
                    <p>Cylinder: {viewingPrescription.odCylinder ?? 'N/A'}</p>
                    <p>
                      Axis:{' '}
                      {viewingPrescription.odAxis
                        ? `${viewingPrescription.odAxis}°`
                        : 'N/A'}
                    </p>
                    <p>Add: {viewingPrescription.odAdd ?? 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-50">
                    Left Eye (OS)
                  </h3>
                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    <p>Sphere: {viewingPrescription.osSphere ?? 'N/A'}</p>
                    <p>Cylinder: {viewingPrescription.osCylinder ?? 'N/A'}</p>
                    <p>
                      Axis:{' '}
                      {viewingPrescription.osAxis
                        ? `${viewingPrescription.osAxis}°`
                        : 'N/A'}
                    </p>
                    <p>Add: {viewingPrescription.osAdd ?? 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-50">
                  Pupillary Distance
                </h3>
                <div className="text-sm space-y-1 text-zinc-700 dark:text-zinc-300">
                  <p>
                    Distance:{' '}
                    {viewingPrescription.pdDistance
                      ? `${viewingPrescription.pdDistance}mm`
                      : 'N/A'}
                  </p>
                  <p>
                    Near:{' '}
                    {viewingPrescription.pdNear ? `${viewingPrescription.pdNear}mm` : 'N/A'}
                  </p>
                </div>
              </div>

              {(viewingPrescription.prescriptionType ||
                viewingPrescription.doctorName ||
                viewingPrescription.prescriptionDate) && (
                <div>
                  <h3 className="font-semibold mb-2 text-zinc-900 dark:text-zinc-50">
                    Additional Information
                  </h3>
                  <div className="text-sm space-y-1 text-zinc-700 dark:text-zinc-300">
                    {viewingPrescription.prescriptionType && (
                      <p>Type: {viewingPrescription.prescriptionType}</p>
                    )}
                    {viewingPrescription.doctorName && (
                      <p>Doctor: {viewingPrescription.doctorName}</p>
                    )}
                    {viewingPrescription.prescriptionDate && (
                      <p>
                        Date:{' '}
                        {new Date(viewingPrescription.prescriptionDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

