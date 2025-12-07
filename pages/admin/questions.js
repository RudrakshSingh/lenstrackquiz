import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { questionnaireService } from '../../services/questionnaire';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit, Trash2, Search, Globe } from 'lucide-react';

const QuestionCategory = {
  USAGE: 'USAGE',
  PROBLEMS: 'PROBLEMS',
  ENVIRONMENT: 'ENVIRONMENT',
  LIFESTYLE: 'LIFESTYLE',
  BUDGET: 'BUDGET'
};

const QuestionType = {
  SINGLE_SELECT: 'SINGLE_SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  SLIDER: 'SLIDER'
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    category: 'USAGE',
    questionType: 'SINGLE_SELECT',
    displayOrder: 0,
    isActive: true,
    textEn: '',
    textHi: '',
    textHiEn: '',
    answers: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [newAnswer, setNewAnswer] = useState({ textEn: '', textHi: '', textHiEn: '', displayOrder: 0 });
  const { showToast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, [categoryFilter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = { isActive: categoryFilter === 'all' ? undefined : categoryFilter === 'active' };
      const data = await questionnaireService.listQuestions(params);
      setQuestions(data || []);
    } catch (error) {
      showToast('error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setTimeout(() => {
      fetchQuestions();
    }, 300);
  };

  const handleCreate = () => {
    setFormData({
      code: '',
      category: 'USAGE',
      questionType: 'SINGLE_SELECT',
      displayOrder: 0,
      isActive: true,
      textEn: '',
      textHi: '',
      textHiEn: '',
      answers: [],
    });
    setNewAnswer({ textEn: '', textHi: '', textHiEn: '', displayOrder: 0 });
    setFormErrors({});
    setEditingQuestion(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (question) => {
    const text = question.text || {};
    setFormData({
      code: question.code,
      category: question.category || 'USAGE',
      questionType: question.questionType || 'SINGLE_SELECT',
      displayOrder: question.displayOrder || 0,
      isActive: question.isActive !== false,
      textEn: question.textEn || text.en || '',
      textHi: question.textHi || text.hi || '',
      textHiEn: question.textHiEn || text.hiEn || '',
      answers: question.answers || [],
    });
    setNewAnswer({ textEn: '', textHi: '', textHiEn: '', displayOrder: 0 });
    setFormErrors({});
    setEditingQuestion(question);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!formData.code || !formData.textEn) {
      showToast('error', 'Code and English text are required');
      return;
    }

    try {
      const questionData = {
        code: formData.code,
        category: formData.category,
        questionType: formData.questionType,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
        textEn: formData.textEn,
        textHi: formData.textHi || formData.textEn,
        textHiEn: formData.textHiEn || formData.textEn,
      };

      let questionId;
      if (editingQuestion) {
        await questionnaireService.updateQuestion(editingQuestion.id, questionData);
        questionId = editingQuestion.id;
        showToast('success', 'Question updated successfully');
      } else {
        const result = await questionnaireService.createQuestion(questionData);
        questionId = result.data?.id;
        showToast('success', 'Question created successfully');
      }

      // Save answers if any
      if (formData.answers.length > 0) {
        const answers = formData.answers.map((ans, idx) => ({
          text: {
            en: ans.textEn || ans.text?.en || '',
            hi: ans.textHi || ans.text?.hi || ans.textEn || ans.text?.en || '',
            hiEn: ans.textHiEn || ans.text?.hiEn || ans.textEn || ans.text?.en || ''
          },
          displayOrder: ans.displayOrder !== undefined ? ans.displayOrder : idx
        }));
        await questionnaireService.addAnswers(questionId, answers);
      }

      setIsCreateOpen(false);
      fetchQuestions();
    } catch (error) {
      showToast('error', error.message || 'Failed to save question');
    }
  };

  const handleDelete = async () => {
    try {
      await questionnaireService.deleteQuestion(deleteConfirm.id);
      showToast('success', 'Question deleted successfully');
      setDeleteConfirm(null);
      fetchQuestions();
    } catch (error) {
      showToast('error', error.message || 'Failed to delete question');
    }
  };

  const addAnswer = () => {
    if (newAnswer.textEn) {
      setFormData(prev => ({
        ...prev,
        answers: [...prev.answers, {
          ...newAnswer,
          displayOrder: prev.answers.length
        }]
      }));
      setNewAnswer({ textEn: '', textHi: '', textHiEn: '', displayOrder: 0 });
    }
  };

  const removeAnswer = (index) => {
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index)
    }));
  };

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'category', header: 'Category' },
    {
      key: 'text',
      header: 'Question (EN)',
      render: (item) => item.textEn || item.text?.en || 'N/A',
    },
    {
      key: 'questionType',
      header: 'Type',
      render: (item) => item.questionType?.replace(/_/g, ' ') || 'N/A',
    },
    {
      key: 'displayOrder',
      header: 'Order',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          item.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {item.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout title="Question Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Questions</h2>
            <p className="text-sm text-gray-500 mt-1">Manage questionnaire questions with multilingual support</p>
          </div>
          <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>
            Add Question
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={handleSearch}
              icon={<Search className="h-5 w-5" />}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            <option value="all">All Categories</option>
            {Object.entries(QuestionCategory).map(([key, value]) => (
              <option key={key} value={value}>{value}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md">
          <DataTable
            columns={columns}
            data={questions}
            loading={loading}
            emptyMessage="No questions found"
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(item);
                  }}
                  className="text-danger hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={editingQuestion ? 'Edit Question' : 'Create Question'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingQuestion ? 'Update' : 'Create'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Question Code"
                value={formData.code}
                onChange={(value) => setFormData({ ...formData, code: value })}
                required
                placeholder="e.g., Q_SCREEN_HOURS"
                error={formErrors.code}
              />
              <Select
                label="Category"
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                required
                error={formErrors.category}
                options={Object.entries(QuestionCategory).map(([key, value]) => ({
                  value,
                  label: value.replace(/_/g, ' ')
                }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Question Type"
                value={formData.questionType}
                onChange={(value) => setFormData({ ...formData, questionType: value })}
                required
                options={Object.entries(QuestionType).map(([key, value]) => ({
                  value,
                  label: value.replace(/_/g, ' ')
                }))}
              />
              <Input
                label="Display Order"
                type="number"
                value={formData.displayOrder}
                onChange={(value) => setFormData({ ...formData, displayOrder: parseInt(value) || 0 })}
              />
            </div>

            {/* Multilingual Text Fields */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Multilingual Question Text</h3>
              </div>
              <Input
                label="English (Required)"
                value={formData.textEn}
                onChange={(value) => {
                  setFormData({ ...formData, textEn: value });
                  // Auto-fill Hindi and Hinglish if empty
                  if (value && !formData.textHi) {
                    setFormData(prev => ({ ...prev, textEn: value, textHi: prev.textHi || '' }));
                  }
                  if (value && !formData.textHiEn) {
                    setFormData(prev => ({ ...prev, textEn: value, textHiEn: prev.textHiEn || value }));
                  }
                }}
                required
                placeholder="Enter question in English"
                error={formErrors.textEn}
              />
              <Input
                label="Hindi"
                value={formData.textHi}
                onChange={(value) => setFormData({ ...formData, textHi: value })}
                placeholder="Enter question in Hindi (optional)"
                error={formErrors.textHi}
              />
              <Input
                label="Hinglish"
                value={formData.textHiEn}
                onChange={(value) => setFormData({ ...formData, textHiEn: value })}
                placeholder="Enter question in Hinglish (optional)"
                error={formErrors.textHiEn}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active (Show in questionnaire)
              </label>
            </div>
            
            {/* Answer Options Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-3">Answer Options</h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {formData.answers.map((answer, idx) => {
                  const ansText = answer.text || {};
                  return (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-700">
                          {answer.textEn || ansText.en || 'Untitled Answer'}
                        </div>
                        {(answer.textHi || ansText.hi) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {answer.textHi || ansText.hi}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAnswer(idx)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Add New Answer</span>
                </div>
                <Input
                  label="Answer Text (English)"
                  value={newAnswer.textEn}
                  onChange={(value) => {
                    setNewAnswer({ 
                      ...newAnswer, 
                      textEn: value,
                      textHiEn: newAnswer.textHiEn || value
                    });
                  }}
                  placeholder="e.g., Yes"
                />
                <Input
                  label="Answer Text (Hindi)"
                  value={newAnswer.textHi}
                  onChange={(value) => setNewAnswer({ ...newAnswer, textHi: value })}
                  placeholder="e.g., हाँ (optional)"
                />
                <Input
                  label="Answer Text (Hinglish)"
                  value={newAnswer.textHiEn}
                  onChange={(value) => setNewAnswer({ ...newAnswer, textHiEn: value })}
                  placeholder="e.g., Haan (optional)"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAnswer}
                  disabled={!newAnswer.textEn}
                >
                  Add Answer
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Question"
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
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}
