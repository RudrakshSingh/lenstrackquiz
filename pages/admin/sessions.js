import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, History } from 'lucide-react';

export default function SessionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user?.organizationId) return;
    
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('organizationId', user.organizationId);

      const response = await fetch(`/api/admin/sessions?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        setSessions(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast('error', data.error?.message || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      showToast('error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId, statusFilter, categoryFilter, showToast]);

  useEffect(() => {
    if (user?.organizationId) {
      fetchSessions();
    }
  }, [user?.organizationId, fetchSessions]);

  const fetchSessionDetail = async (id) => {
    setDetailLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/sessions/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success) {
        setSelectedSession(data.data);
      } else {
        showToast('error', data.error?.message || 'Failed to load session details');
      }
    } catch (error) {
      console.error('Failed to load session details:', error);
      showToast('error', 'Failed to load session details');
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'CONVERTED':
        return 'green';
      case 'COMPLETED':
        return 'blue';
      case 'IN_PROGRESS':
        return 'yellow';
      case 'ABANDONED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'EYEGLASSES':
        return 'blue';
      case 'SUNGLASSES':
        return 'yellow';
      case 'CONTACT_LENSES':
        return 'cyan';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const columns = [
    {
      key: 'customerName',
      header: 'Customer',
      render: (session) => (
        <div>
          <p className="font-medium text-black">
            {session.customerName || 'Anonymous'}
          </p>
          {session.customerPhone && (
            <p className="text-xs text-black">{session.customerPhone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (session) => (
        <Badge color={getCategoryBadgeColor(session.category)} variant="soft">
          {session.category?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'storeName',
      header: 'Store',
      render: (session) => (
        <span className="text-sm text-black">{session.storeName}</span>
      ),
    },
    {
      key: 'userName',
      header: 'Staff',
      render: (session) => (
        <span className="text-sm text-black">{session.userName}</span>
      ),
    },
    {
      key: 'answerCount',
      header: 'Answers',
      render: (session) => (
        <span className="text-sm font-medium text-black">
          {session.answerCount || 0}
        </span>
      ),
    },
    {
      key: 'recommendationCount',
      header: 'Recommendations',
      render: (session) => (
        <span className="text-sm font-medium text-black">
          {session.recommendationCount || 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (session) => (
        <Badge color={getStatusBadgeColor(session.status)} variant="soft">
          {session.status?.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'startedAt',
      header: 'Started',
      render: (session) => (
        <span className="text-sm text-black">
          {formatDate(session.startedAt)}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title="Sessions Management">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-black">Customer Sessions</h1>
            <p className="text-sm text-black mt-1">Track customer interactions and questionnaire responses</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Filter by status"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CONVERTED', label: 'Converted' },
              { value: 'ABANDONED', label: 'Abandoned' },
            ]}
          />
          <Select
            label="Filter by category"
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'EYEGLASSES', label: 'Eyeglasses' },
              { value: 'SUNGLASSES', label: 'Sunglasses' },
              { value: 'CONTACT_LENSES', label: 'Contact Lenses' },
            ]}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <Spinner />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<History size={80} className="text-gray-300" />}
                title="No customer sessions"
                description="Customer questionnaire sessions will appear here"
              />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={sessions}
              loading={loading}
              emptyMessage="No sessions found"
              rowActions={(session) => (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Eye size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchSessionDetail(session.id);
                  }}
                  className="rounded-full"
                >
                  View
                </Button>
              )}
            />
          )}
        </div>

        {/* Session Detail Modal */}
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title="Session Details"
          size="lg"
          footer={
            <Button
              variant="outline"
              onClick={() => setSelectedSession(null)}
              className="rounded-full"
            >
              Close
            </Button>
          }
        >
          {detailLoading ? (
            <div className="text-center py-8">
              <Spinner />
            </div>
          ) : selectedSession ? (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-black mb-3">
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-black">Name:</span>
                    <span className="ml-2 font-medium text-black">
                      {selectedSession.customerName || 'Anonymous'}
                    </span>
                  </div>
                  <div>
                    <span className="text-black">Phone:</span>
                    <span className="ml-2 font-medium text-black">
                      {selectedSession.customerPhone || '-'}
                    </span>
                  </div>
                  {selectedSession.customerEmail && (
                    <div className="col-span-2">
                      <span className="text-black">Email:</span>
                      <span className="ml-2 font-medium text-black">
                        {selectedSession.customerEmail}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-black">Store:</span>
                    <span className="ml-2 font-medium text-black">
                      {selectedSession.store?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-black">Staff:</span>
                    <span className="ml-2 font-medium text-black">
                      {selectedSession.user?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-black">Category:</span>
                    <span className="ml-2">
                      <Badge color={getCategoryBadgeColor(selectedSession.category)} size="sm" variant="soft">
                        {selectedSession.category?.replace('_', ' ')}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="text-black">Status:</span>
                    <span className="ml-2">
                      <Badge color={getStatusBadgeColor(selectedSession.status)} size="sm" variant="soft">
                        {selectedSession.status?.replace('_', ' ')}
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>

              {/* Answers */}
              {selectedSession.answers && selectedSession.answers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-black mb-3">
                    Questionnaire Answers ({selectedSession.answers.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedSession.answers.map((answer, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200"
                      >
                        <p className="font-medium text-black">
                          {answer.question?.textEn || 'Question'}
                        </p>
                        <p className="text-black mt-1">
                          → {answer.option?.textEn || answer.selectedOption || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedSession.recommendations && selectedSession.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-black mb-3">
                    Product Recommendations ({selectedSession.recommendations.length})
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedSession.recommendations.map((rec) => (
                      <div
                        key={rec.rank}
                        className={`p-3 rounded-lg border transition-all ${
                          rec.isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-black">
                                #{rec.rank}
                              </span>
                              <span className="font-medium text-black">
                                {rec.product?.name || 'Product'}
                              </span>
                              {rec.isSelected && (
                                <Badge color="green" size="sm">
                                  SELECTED
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-black mt-1">
                              {rec.product?.brand && `${rec.product.brand} • `}
                              SKU: {rec.product?.sku || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">
                              {rec.matchScore?.toFixed(1) || 0}% Match
                            </div>
                            <div className="text-sm text-black">
                              ₹{rec.product?.basePrice?.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedSession.notes && (
                <div>
                  <h3 className="font-semibold text-black mb-2">Notes</h3>
                  <p className="text-sm text-black p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {selectedSession.notes}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-black mb-2">Timeline</h3>
                <div className="text-sm space-y-1 text-black">
                  <p>Started: {formatDate(selectedSession.startedAt)}</p>
                  {selectedSession.completedAt && (
                    <p>Completed: {formatDate(selectedSession.completedAt)}</p>
                  )}
                  {selectedSession.convertedAt && (
                    <p>Converted: {formatDate(selectedSession.convertedAt)}</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </AdminLayout>
  );
}
