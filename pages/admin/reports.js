import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { reportService } from '../../services/reports';
import { useToast } from '../../contexts/ToastContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [storeFilter, setStoreFilter] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange, storeFilter]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        storeId: storeFilter !== 'all' ? storeFilter : undefined,
      };
      const data = await reportService.getReport(reportType, params);
      setReportData(data);
    } catch (error) {
      showToast('error', 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    showToast('info', 'Export functionality coming soon');
  };

  return (
    <AdminLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
            <p className="text-sm text-gray-500 mt-1">View analytics and performance metrics</p>
          </div>
          <Button onClick={handleExport} icon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Report Type"
              value={reportType}
              onChange={setReportType}
              options={[
                { value: 'overview', label: 'Overview' },
                { value: 'store-wise', label: 'Store-wise' },
                { value: 'staff-wise', label: 'Staff-wise' },
                { value: 'daily', label: 'Daily Trend' },
                { value: 'category', label: 'Category' },
                { value: 'product', label: 'Product' },
                { value: 'conversion', label: 'Conversion' },
              ]}
            />
            <Input
              label="Start Date"
              type="date"
              value={dateRange.start}
              onChange={(value) => setDateRange({ ...dateRange, start: value })}
            />
            <Input
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={(value) => setDateRange({ ...dateRange, end: value })}
            />
            <Select
              label="Store"
              value={storeFilter}
              onChange={setStoreFilter}
              options={[{ value: 'all', label: 'All Stores' }]}
            />
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading report...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {reportType === 'overview' && reportData.dailyTrend && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Daily Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sessions" fill="#3B82F6" />
                      <Bar dataKey="converted" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {reportType === 'daily' && reportData.trend && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">90-Day Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sessions" stroke="#3B82F6" />
                      <Line type="monotone" dataKey="converted" stroke="#10B981" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="text-sm text-gray-500">
                Report data loaded. Additional visualizations coming soon.
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No report data available
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

