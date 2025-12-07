import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { api } from '../../lib/api-client';
import { useToast } from '../../contexts/ToastContext';
import { Search, Eye } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { format } from 'date-fns';

const STATUS_COLORS = {
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CONVERTED: 'purple',
  ABANDONED: 'gray',
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedSession, setSelectedSession] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, dateFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (dateFilter.start) {
        params.startDate = dateFilter.start;
      }
      if (dateFilter.end) {
        params.endDate = dateFilter.end;
      }
      if (search) {
        params.search = search;
      }
      const data = await api.get('/questionnaire/sessions', params);
      setSessions(Array.isArray(data) ? data : data?.sessions || []);
    } catch (error) {
      showToast('error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setTimeout(() => {
      fetchSessions();
    }, 300);
  };

  const handleViewDetails = async (session) => {
    try {
      const data = await api.get(`/questionnaire/sessions/${session.id || session._id}`);
      setSelectedSession(data);
    } catch (error) {
      showToast('error', 'Failed to load session details');
    }
  };

  const columns = [
    { key: 'customerName', header: 'Customer' },
    { key: 'storeName', header: 'Store' },
    { key: 'staffName', header: 'Staff' },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge color={STATUS_COLORS[item.status] || 'gray'} variant="soft">
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (item) => format(new Date(item.createdAt), 'MMM d, yyyy h:mm a'),
    },
  ];

  return (
    <AdminLayout title="Sessions">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Customer Sessions</h2>
          <p className="text-sm text-gray-500 mt-1">View and manage customer questionnaire sessions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 space-y-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search sessions..."
              value={search}
              onChange={handleSearch}
              icon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CONVERTED">Converted</option>
              <option value="ABANDONED">Abandoned</option>
            </select>
            <Input
              label="Start Date"
              type="date"
              value={dateFilter.start}
              onChange={(value) => setDateFilter({ ...dateFilter, start: value })}
            />
            <Input
              label="End Date"
              type="date"
              value={dateFilter.end}
              onChange={(value) => setDateFilter({ ...dateFilter, end: value })}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md">
          <DataTable
            columns={columns}
            data={sessions}
            loading={loading}
            emptyMessage="No sessions found"
            rowActions={(item) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(item);
                }}
                className="text-primary hover:text-primary-hover"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
          />
        </div>

        {/* Session Details Modal */}
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title="Session Details"
          size="lg"
        >
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedSession.customerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge color={STATUS_COLORS[selectedSession.status] || 'gray'} variant="soft">
                    {selectedSession.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Store</p>
                  <p className="font-medium">{selectedSession.storeName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Staff</p>
                  <p className="font-medium">{selectedSession.staffName || 'N/A'}</p>
                </div>
              </div>
              {selectedSession.answers && selectedSession.answers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Answers</p>
                  <div className="space-y-2">
                    {selectedSession.answers.map((answer, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded">
                        <p className="font-medium text-sm">{answer.questionKey}</p>
                        <p className="text-sm text-gray-600">{answer.answerValue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSession.recommendations && selectedSession.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recommendations</p>
                  <div className="space-y-2">
                    {selectedSession.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3 bg-primary-light rounded">
                        <p className="font-medium text-sm">{rec.productName}</p>
                        <p className="text-sm text-gray-600">Score: {rec.score}%</p>
                      </div>
                    ))}
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

