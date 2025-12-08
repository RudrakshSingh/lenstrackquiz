import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  List,
  Network,
  X,
} from 'lucide-react';

const ProductCategory = {
  EYEGLASSES: 'EYEGLASSES',
  SUNGLASSES: 'SUNGLASSES',
  CONTACT_LENSES: 'CONTACT_LENSES',
  ACCESSORIES: 'ACCESSORIES',
};

export default function QuestionnaireBuilderPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState(ProductCategory.EYEGLASSES);
  const [viewMode, setViewMode] = useState('tree');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    key: '',
    textEn: '',
    category: ProductCategory.EYEGLASSES,
    order: 1,
    isRequired: false,
    allowMultiple: false,
    isActive: true,
    parentQuestionId: null,
    parentAnswerKey: null,
    options: [],
  });
  const [newOption, setNewOption] = useState({ key: '', textEn: '' });

  useEffect(() => {
    if (user?.organizationId) {
      fetchQuestions();
    }
  }, [user, categoryFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const params = new URLSearchParams();
      params.append('category', categoryFilter);
      params.append('organizationId', user.organizationId);

      const response = await fetch(`/api/admin/questions?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
        }
        showToast('error', errorData?.error?.message || 'Failed to load questions');
        return;
      }

      const data = await response.json();

      if (data.success) {
        const questionsList = Array.isArray(data.data) ? data.data : [];
        setAllQuestions(questionsList);

        // Build tree structure
        const buildTree = (parentId) => {
          return questionsList
            .filter((q) => q.parentQuestionId === parentId)
            .map((q) => ({
              ...q,
              childQuestions: buildTree(q.id),
            }));
        };
        const treeQuestions = buildTree(null);
        setQuestions(treeQuestions);
      } else {
        showToast('error', data.error?.message || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      showToast('error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (questionId) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleQuestionSelect = async (question) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/questions/${question.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        const q = data.data;
        setSelectedQuestion(q);
        setFormData({
          key: q.key || '',
          textEn: q.textEn || '',
          category: q.category || ProductCategory.EYEGLASSES,
          order: q.order || 1,
          isRequired: q.isRequired || false,
          allowMultiple: q.allowMultiple || false,
          isActive: q.isActive !== false,
          parentQuestionId: q.parentQuestionId || null,
          parentAnswerKey: q.parentAnswerKey || null,
          options: q.options || [],
        });
        if (viewMode === 'table') {
          setIsModalOpen(true);
        }
      } else {
        setSelectedQuestion(question);
        if (viewMode === 'table') {
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      setSelectedQuestion(question);
      if (viewMode === 'table') {
        setIsModalOpen(true);
      }
    }
  };

  const handleNewQuestion = () => {
    setSelectedQuestion(null);
    setFormData({
      key: '',
      textEn: '',
      category: categoryFilter,
      order: allQuestions.length + 1,
      isRequired: false,
      allowMultiple: false,
      isActive: true,
      parentQuestionId: null,
      parentAnswerKey: null,
      options: [],
    });
    if (viewMode === 'table') {
      setIsModalOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const url = selectedQuestion
        ? `/api/admin/questions/${selectedQuestion.id}`
        : '/api/admin/questions';

      const response = await fetch(url, {
        method: selectedQuestion ? 'PUT' : 'POST',
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
        showToast('success', `Question ${selectedQuestion ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        setSelectedQuestion(null);
        fetchQuestions();
      } else {
        showToast('error', data.error?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showToast('error', 'An error occurred');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        showToast('success', 'Question deleted successfully');
        if (selectedQuestion?.id === questionId) {
          setSelectedQuestion(null);
        }
        fetchQuestions();
      } else {
        showToast('error', data.error?.message || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('error', 'An error occurred while deleting question');
    }
  };

  const handleAddOption = () => {
    if (!newOption.key || !newOption.textEn) {
      showToast('error', 'Please fill option key and text');
      return;
    }
    setFormData({
      ...formData,
      options: [...formData.options, { ...newOption, id: `temp-${Date.now()}` }],
    });
    setNewOption({ key: '', textEn: '' });
  };

  const handleRemoveOption = (index) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const renderQuestionTree = (questionList, level = 0) => {
    return questionList.map((question) => {
      const hasChildren = question.childQuestions && question.childQuestions.length > 0;
      const isExpanded = expandedQuestions.has(question.id);
      const isSelected = selectedQuestion?.id === question.id;

      return (
        <div key={question.id} className="select-none">
          <div
            onClick={() => handleQuestionSelect(question)}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors group ${
              isSelected
                ? 'bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(question.id);
                }}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-zinc-600 dark:text-zinc-400" />
                ) : (
                  <ChevronRight size={16} className="text-zinc-600 dark:text-zinc-400" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <HelpCircle size={16} className="text-zinc-400" />
            <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {question.textEn}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Q{question.order}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(question.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400 transition-opacity"
              title="Delete question"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-4">{renderQuestionTree(question.childQuestions || [], level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Question Key *"
          value={formData.key}
          onChange={(value) => setFormData({ ...formData, key: value.toUpperCase() })}
          placeholder="e.g., Q_USAGE"
          required
        />
        <Input
          label="Order *"
          type="number"
          value={formData.order.toString()}
          onChange={(value) => setFormData({ ...formData, order: parseInt(value) || 1 })}
          required
        />
      </div>

      <Input
        label="Question Text (English) *"
        value={formData.textEn}
        onChange={(value) => setFormData({ ...formData, textEn: value })}
        placeholder="e.g., How will you use your glasses?"
        required
      />

      <Select
        label="Category *"
        value={formData.category}
        onChange={(value) => setFormData({ ...formData, category: value })}
        options={[
          { value: 'EYEGLASSES', label: 'Eyeglasses' },
          { value: 'SUNGLASSES', label: 'Sunglasses' },
          { value: 'CONTACT_LENSES', label: 'Contact Lenses' },
          { value: 'ACCESSORIES', label: 'Accessories' },
        ]}
      />

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isRequired}
            onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Required</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.allowMultiple}
            onChange={(e) => setFormData({ ...formData, allowMultiple: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Allow Multiple</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Active</span>
        </label>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Answer Options
        </label>
        <div className="space-y-2">
          {formData.options.map((option, index) => (
            <div
              key={option.id || index}
              className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded"
            >
              <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-50">
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{option.key}</span> -{' '}
                {option.textEn}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <Input
            placeholder="Option Key (e.g., OPT_A)"
            value={newOption.key}
            onChange={(value) => setNewOption({ ...newOption, key: value.toUpperCase() })}
          />
          <Input
            placeholder="Option Text"
            value={newOption.textEn}
            onChange={(value) => setNewOption({ ...newOption, textEn: value })}
            className="col-span-2"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="mt-2">
          <Plus size={14} className="mr-1" />
          Add Option
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsModalOpen(false);
            setSelectedQuestion(null);
          }}
          className="rounded-full"
        >
          Cancel
        </Button>
        <Button type="submit" loading={submitLoading} className="rounded-full">
          {selectedQuestion ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );

  const columns = [
    {
      key: 'order',
      header: 'Order',
      render: (q) => <span className="font-mono text-sm">#{q.order}</span>,
    },
    {
      key: 'textEn',
      header: 'Question',
      render: (q) => (
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{q.textEn}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">{q.key}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (q) => {
        const getColor = () => {
          if (q.category === 'EYEGLASSES') return 'blue';
          if (q.category === 'SUNGLASSES') return 'yellow';
          if (q.category === 'CONTACT_LENSES') return 'cyan';
          return 'gray';
        };
        return (
          <Badge color={getColor()} size="sm" variant="soft">
            {q.category?.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'optionCount',
      header: 'Options',
      render: (q) => (
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          {q.optionCount ?? q.options?.length ?? 0}
        </span>
      ),
    },
    {
      key: 'isRequired',
      header: 'Required',
      render: (q) => (
        <Badge color={q.isRequired ? 'green' : 'gray'} size="sm" variant="soft">
          {q.isRequired ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (q) => (
        <Badge color={q.isActive ? 'green' : 'red'} size="sm" variant="soft">
          {q.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Questionnaire Builder">
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50 tracking-tight">
              Questions Management
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              {viewMode === 'tree'
                ? 'Build questions with subquestions (Tree View)'
                : 'Manage all questions (Table View)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                <Network size={16} />
                Tree View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                <List size={16} />
                Table View
              </button>
            </div>
            <Button variant="outline" onClick={fetchQuestions} className="rounded-full">
              Refresh
            </Button>
            <Button onClick={handleNewQuestion} className="rounded-full">
              <Plus size={20} className="mr-2" />
              New Question
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
            options={[
              { value: 'EYEGLASSES', label: 'Eyeglasses' },
              { value: 'SUNGLASSES', label: 'Sunglasses' },
              { value: 'CONTACT_LENSES', label: 'Contact Lenses' },
              { value: 'ACCESSORIES', label: 'Accessories' },
            ]}
          />
        </div>

        {viewMode === 'tree' ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Tree View */}
            <div className="lg:col-span-1">
              <Card>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Questions Tree</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (expandedQuestions.size === questions.length) {
                        setExpandedQuestions(new Set());
                      } else {
                        setExpandedQuestions(new Set(questions.map((q) => q.id)));
                      }
                    }}
                  >
                    {expandedQuestions.size === questions.length ? 'Collapse All' : 'Expand All'}
                  </Button>
                </div>
                <div className="p-2 max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <Spinner />
                    </div>
                  ) : questions.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
                      No questions found for {categoryFilter}
                    </div>
                  ) : (
                    renderQuestionTree(questions)
                  )}
                </div>
              </Card>
            </div>

            {/* Right: Question Editor */}
            <div className="lg:col-span-2">
              <Card>
                <div className="p-6">
                  <h3 className="font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                    {selectedQuestion ? 'Edit Question' : 'Create New Question'}
                  </h3>
                  {renderForm()}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div>
            {/* Table View */}
            <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {loading ? (
                <div className="text-center py-12">
                  <Spinner />
                </div>
              ) : allQuestions.length === 0 ? (
                <div className="p-12">
                  <EmptyState
                    icon={<HelpCircle size={48} />}
                    title="No questions found"
                    description={`No questions for ${categoryFilter}`}
                    action={{
                      label: 'Create Question',
                      onClick: handleNewQuestion,
                      icon: <Plus size={20} />,
                    }}
                  />
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={allQuestions}
                  loading={loading}
                  emptyMessage="No questions found for this category"
                  rowActions={(q) => (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestionSelect(q);
                        }}
                        icon={<Edit2 size={14} />}
                        className="rounded-full"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(q.id);
                        }}
                        icon={<Trash2 size={14} />}
                        className="rounded-full"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                />
              )}
            </div>

            {/* Modal for Table View Edit/Create */}
            <Modal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedQuestion(null);
              }}
              title={selectedQuestion ? 'Edit Question' : 'Create New Question'}
              size="lg"
            >
              {renderForm()}
            </Modal>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

