import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { questionnaireService } from '../../services/questionnaire';
import { benefitService } from '../../services/benefits';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit, Trash2, Search, Globe, ChevronDown, ChevronUp, ChevronRight, HelpCircle, GripVertical, Network, List } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

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
  const [treeQuestions, setTreeQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'table'
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [draggedQuestion, setDraggedQuestion] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [benefits, setBenefits] = useState([]);
  const [expandedBenefitMappings, setExpandedBenefitMappings] = useState(new Set());
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
  const [newAnswer, setNewAnswer] = useState({ 
    textEn: '', 
    textHi: '', 
    textHiEn: '', 
    displayOrder: 0,
    benefitMapping: {},
    triggersSubQuestion: false,
    subQuestionId: null
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchQuestions();
    fetchBenefits();
  }, [categoryFilter]);

  const fetchBenefits = async () => {
    try {
      const benefitsList = await benefitService.list();
      setBenefits(benefitsList || []);
    } catch (error) {
      console.error('Failed to load benefits:', error);
      // Fallback to default benefits if API fails
      setBenefits([
        { code: 'B01', name: 'Screen Protection' },
        { code: 'B02', name: 'Driving Comfort' },
        { code: 'B03', name: 'Blue Light Filter' },
        { code: 'B04', name: 'UV Protection' },
        { code: 'B05', name: 'Anti-Glare' },
        { code: 'B06', name: 'Scratch Resistance' },
        { code: 'B07', name: 'Lightweight' },
        { code: 'B08', name: 'Durability' },
        { code: 'B09', name: 'Style' },
        { code: 'B10', name: 'Comfort' },
        { code: 'B11', name: 'Vision Clarity' },
        { code: 'B12', name: 'Eye Strain Reduction' },
      ]);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = { isActive: categoryFilter === 'all' ? undefined : categoryFilter === 'active' };
      const data = await questionnaireService.listQuestions(params);
      console.log('Fetched questions data:', data);
      const questionsList = Array.isArray(data) ? data : (data?.questions || []);
      console.log('Questions list:', questionsList);
      setQuestions(questionsList);
      
      // Build tree structure based on sub-question relationships
      buildQuestionTree(questionsList);
    } catch (error) {
      console.error('Error fetching questions:', error);
      showToast('error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const buildQuestionTree = (questionsList) => {
    console.log('Building question tree from:', questionsList);
    
    if (!questionsList || questionsList.length === 0) {
      console.log('No questions to build tree');
      setTreeQuestions([]);
      return;
    }
    
    // Create a map of question ID -> question for quick lookup
    const questionMap = new Map();
    questionsList.forEach(q => {
      questionMap.set(q.id, q);
    });
    
    // Get all questions that are referenced as sub-questions
    const subQuestionIds = new Set();
    questionsList.forEach(question => {
      if (question.answers && Array.isArray(question.answers)) {
        question.answers.forEach(answer => {
          if (answer.triggersSubQuestion && answer.subQuestionId) {
            subQuestionIds.add(answer.subQuestionId);
            console.log(`Question ${answer.subQuestionId} is a sub-question triggered by answer in question ${question.id}`);
          }
        });
      }
    });
    
    console.log('Sub-question IDs:', Array.from(subQuestionIds));
    
    // Main questions are those not referenced as sub-questions
    const mainQuestions = questionsList
      .filter(q => !subQuestionIds.has(q.id))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    console.log('Main questions:', mainQuestions.map(q => ({ id: q.id, code: q.code, textEn: q.textEn })));
    
    // Build tree recursively
    const buildTree = (parentQuestionId) => {
      const children = [];
      
      // Find the parent question
      const parentQuestion = questionMap.get(parentQuestionId);
      if (!parentQuestion || !parentQuestion.answers || !Array.isArray(parentQuestion.answers)) {
        return children;
      }
      
      // Find all answers in the parent question that trigger sub-questions
      parentQuestion.answers.forEach(answer => {
        if (answer.triggersSubQuestion && answer.subQuestionId) {
          const subQuestion = questionMap.get(answer.subQuestionId);
          if (subQuestion) {
            // Recursively build sub-tree for this sub-question
            children.push({
              ...subQuestion,
              subQuestions: buildTree(subQuestion.id)
            });
          } else {
            console.warn(`Sub-question ${answer.subQuestionId} not found in questions list`);
          }
        }
      });
      
      return children;
    };
    
    const tree = mainQuestions.map(q => ({
      ...q,
      subQuestions: buildTree(q.id)
    }));
    
    console.log('Final tree:', tree.map(q => ({ 
      id: q.id, 
      code: q.code, 
      subQuestionsCount: q.subQuestions?.length || 0 
    })));
    setTreeQuestions(tree);
  };

  const handleSearch = (value) => {
    setSearch(value);
  };

  const toggleExpand = (questionId) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e, question) => {
    setDraggedQuestion(question);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', question.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Add visual feedback
    if (e.currentTarget) {
      e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
    }
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget) {
      e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    }
  };

  const handleDrop = async (e, targetQuestion) => {
    e.preventDefault();
    if (!draggedQuestion || draggedQuestion.id === targetQuestion.id) {
      setDraggedQuestion(null);
      return;
    }

    // Only allow reordering of main questions (not sub-questions)
    const isMainQuestion = !treeQuestions.some(q => 
      q.subQuestions?.some(sq => sq.id === draggedQuestion.id)
    );
    const isTargetMain = !treeQuestions.some(q => 
      q.subQuestions?.some(sq => sq.id === targetQuestion.id)
    );

    if (!isMainQuestion || !isTargetMain) {
      showToast('error', 'Only main questions can be reordered');
      setDraggedQuestion(null);
      return;
    }

    // Reorder questions
    const mainQuestions = treeQuestions.filter(q => 
      !treeQuestions.some(parent => 
        parent.subQuestions?.some(sq => sq.id === q.id)
      )
    );
    
    const draggedIndex = mainQuestions.findIndex(q => q.id === draggedQuestion.id);
    const targetIndex = mainQuestions.findIndex(q => q.id === targetQuestion.id);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedQuestion(null);
      return;
    }

    // Reorder array
    const reordered = [...mainQuestions];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update displayOrder for all questions
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
      const updatePromises = reordered.map((q, index) => 
        fetch(`/api/admin/questionnaire/questions/${q.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ displayOrder: index })
        }).then(res => res.json())
      );

      const results = await Promise.all(updatePromises);
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        throw new Error('Some questions failed to update');
      }
      showToast('success', 'Question order updated successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Failed to update question order:', error);
      showToast('error', 'Failed to update question order');
    }

    setDraggedQuestion(null);
  };

  const handleDragEnd = () => {
    setDraggedQuestion(null);
  };

  // Render question tree
  const renderQuestionTree = (questionList, level = 0) => {
    return questionList.map((question) => {
      const hasSubQuestions = question.subQuestions && question.subQuestions.length > 0;
      const isExpanded = expandedQuestions.has(question.id);
      const isDragging = draggedQuestion?.id === question.id;
      const isMainQuestion = level === 0;

      return (
        <div
          key={question.id}
          draggable={isMainQuestion}
          onDragStart={(e) => isMainQuestion && handleDragStart(e, question)}
          onDragOver={(e) => {
            if (isMainQuestion) {
              handleDragOver(e);
            }
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            if (isMainQuestion) {
              handleDrop(e, question);
              handleDragLeave(e);
            }
          }}
          onDragEnd={(e) => {
            handleDragEnd();
            handleDragLeave(e);
          }}
          className={`select-none transition-all ${isDragging ? 'opacity-50' : ''} ${isMainQuestion ? 'cursor-move' : ''}`}
        >
          <div
            className={`flex items-center gap-2 p-2 rounded transition-colors group ${
              editingQuestion?.id === question.id
                ? 'bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            style={{ paddingLeft: `${level * 24 + 8}px` }}
          >
            {isMainQuestion && (
              <GripVertical 
                size={16} 
                className="text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" 
              />
            )}
            {hasSubQuestions ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(question.id);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <HelpCircle size={16} className="text-gray-400" />
            <span 
              className="flex-1 text-sm font-medium text-black dark:text-white cursor-pointer"
              onClick={() => handleEdit(question)}
            >
              {question.textEn || question.text?.en || 'Untitled Question'}
            </span>
            <Badge color="blue" size="sm" className="text-xs">
              {question.code || `Q${question.displayOrder || 0}`}
            </Badge>
            {hasSubQuestions && (
              <Badge color="green" size="sm" className="text-xs">
                {question.subQuestions.length} sub
              </Badge>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(question);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-600 dark:text-blue-400 transition-opacity"
              title="Edit question"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(question);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400 transition-opacity"
              title="Delete question"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {hasSubQuestions && isExpanded && (
            <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700">
              {renderQuestionTree(question.subQuestions, level + 1)}
            </div>
          )}
        </div>
      );
    });
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
    setNewAnswer({ textEn: '', textHi: '', textHiEn: '', displayOrder: 0, benefitMapping: {}, triggersSubQuestion: false, subQuestionId: null });
    setFormErrors({});
    setEditingQuestion(null);
    setExpandedBenefitMappings(new Set());
    setIsCreateOpen(true);
  };

  const handleEdit = (question) => {
    const text = question.text || {};
    
    // Answers already include benefitMapping from API
    const answersWithBenefits = (question.answers || []).map(ans => ({
      ...ans,
      benefitMapping: ans.benefitMapping || {},
      triggersSubQuestion: ans.triggersSubQuestion || false,
      subQuestionId: ans.subQuestionId || null
    }));
    
    setFormData({
      code: question.code,
      category: question.category || 'USAGE',
      questionType: question.questionType || 'SINGLE_SELECT',
      displayOrder: question.displayOrder || 0,
      isActive: question.isActive !== false,
      textEn: question.textEn || text.en || '',
      textHi: question.textHi || text.hi || '',
      textHiEn: question.textHiEn || text.hiEn || '',
      answers: answersWithBenefits,
    });
    setNewAnswer({ textEn: '', textHi: '', textHiEn: '', displayOrder: 0, benefitMapping: {}, triggersSubQuestion: false, subQuestionId: null });
    setFormErrors({});
    setEditingQuestion(question);
    setExpandedBenefitMappings(new Set());
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
        const answers = formData.answers.map((ans, idx) => {
          // Convert benefitMapping object to benefits array format
          const benefitsArray = [];
          if (ans.benefitMapping) {
            Object.entries(ans.benefitMapping).forEach(([benefitCode, points]) => {
              const pointsValue = parseFloat(points) || 0;
              if (pointsValue > 0) {
                benefitsArray.push({
                  benefitCode,
                  points: pointsValue
                });
              }
            });
          }
          
          return {
            text: {
              en: ans.textEn || ans.text?.en || '',
              hi: ans.textHi || ans.text?.hi || ans.textEn || ans.text?.en || '',
              hiEn: ans.textHiEn || ans.text?.hiEn || ans.textEn || ans.text?.en || ''
            },
            displayOrder: ans.displayOrder !== undefined ? ans.displayOrder : idx,
            benefits: benefitsArray,
            triggersSubQuestion: ans.triggersSubQuestion || false,
            subQuestionId: ans.subQuestionId || null
          };
        });
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
          displayOrder: prev.answers.length,
          benefitMapping: newAnswer.benefitMapping || {},
          triggersSubQuestion: newAnswer.triggersSubQuestion || false,
          subQuestionId: newAnswer.subQuestionId || null
        }]
      }));
      setNewAnswer({ textEn: '', textHi: '', textHiEn: '', displayOrder: 0, benefitMapping: {}, triggersSubQuestion: false, subQuestionId: null });
    }
  };

  const updateAnswerBenefit = (answerIndex, benefitCode, value) => {
    const numValue = parseFloat(value) || 0;
    // Clamp value between 0 and 3
    const clampedValue = Math.max(0, Math.min(3, numValue));
    
    setFormData(prev => {
      const updated = [...prev.answers];
      updated[answerIndex] = {
        ...updated[answerIndex],
        benefitMapping: {
          ...(updated[answerIndex].benefitMapping || {}),
          [benefitCode]: clampedValue
        }
      };
      return { ...prev, answers: updated };
    });
  };

  const toggleBenefitMapping = (answerIndex) => {
    const key = `answer-${answerIndex}`;
    setExpandedBenefitMappings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const removeAnswer = (index) => {
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index)
    }));
  };

  // Get available questions for sub-question dropdown (exclude current question)
  const getAvailableQuestionsForSubQuestion = () => {
    const currentQuestionId = editingQuestion?.id;
    return questions
      .filter(q => q.id !== currentQuestionId && q.isActive !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map(q => ({
        value: q.id,
        label: `${q.code || 'Q'} - ${q.textEn || q.text?.en || 'Untitled'}`
      }));
  };

  // Check for circular references
  const checkCircularReference = (answerIndex, subQuestionId) => {
    if (!subQuestionId || !editingQuestion) return false;
    
    // If the sub-question is the current question itself, it's a self-link
    if (subQuestionId === editingQuestion.id) {
      return true;
    }

    // Check if setting this sub-question would create a cycle
    // Build a graph of existing relationships
    const visited = new Set();
    const checkCycle = (questionId, path = []) => {
      if (path.includes(questionId)) {
        return true; // Cycle detected
      }
      if (visited.has(questionId)) {
        return false; // Already checked, no cycle from here
      }
      visited.add(questionId);

      // Find all answers that point to this question as a sub-question
      const question = questions.find(q => q.id === questionId);
      if (!question || !question.answers) return false;

      for (const answer of question.answers) {
        if (answer.triggersSubQuestion && answer.subQuestionId) {
          // If this answer would point to the current question, check for cycle
          if (answer.subQuestionId === editingQuestion.id) {
            if (checkCycle(answer.subQuestionId, [...path, questionId])) {
              return true;
            }
          }
        }
      }

      // Check if the new relationship would create a cycle
      if (questionId === subQuestionId) {
        // We're trying to set subQuestionId to questionId
        // Check if questionId (or any of its sub-questions) eventually points back to editingQuestion
        const targetQuestion = questions.find(q => q.id === subQuestionId);
        if (targetQuestion && targetQuestion.answers) {
          for (const answer of targetQuestion.answers) {
            if (answer.triggersSubQuestion && answer.subQuestionId === editingQuestion.id) {
              return true; // Cycle: editingQuestion -> subQuestionId -> editingQuestion
            }
          }
        }
      }

      return false;
    };

    return checkCycle(subQuestionId, [editingQuestion.id]);
  };

  const updateAnswerSubQuestion = (answerIndex, triggersSubQuestion, subQuestionId) => {
    // Validate circular reference
    if (triggersSubQuestion && subQuestionId) {
      if (checkCircularReference(answerIndex, subQuestionId)) {
        showToast('error', 'Cannot create circular reference. This would create a loop in the question flow.');
        return;
      }
    }

    setFormData(prev => {
      const updated = [...prev.answers];
      updated[answerIndex] = {
        ...updated[answerIndex],
        triggersSubQuestion: triggersSubQuestion || false,
        subQuestionId: triggersSubQuestion ? (subQuestionId || null) : null
      };
      return { ...prev, answers: updated };
    });
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
        <Badge color={item.isActive !== false ? 'green' : 'red'}>
          {item.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout title="Question Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-black dark:text-zinc-50 tracking-tight">Questions</h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 mt-1">Manage questionnaire questions with multilingual support</p>
          </div>
          <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />} className="rounded-full">
            Add Question
          </Button>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 flex gap-4 mb-6">
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
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Object.entries(QuestionCategory).map(([key, value]) => (
              <option key={key} value={value}>{value}</option>
            ))}
          </select>
          <div className="flex gap-2 border border-zinc-300 dark:border-zinc-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Network size={16} className="inline mr-1" />
              Tree
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <List size={16} className="inline mr-1" />
              Table
            </button>
          </div>
        </div>

        {/* Tree View */}
        {viewMode === 'tree' && (
          <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-black dark:text-white">Question Tree</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Drag main questions to reorder. Click to expand/collapse sub-questions.
              </p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner />
                </div>
              ) : treeQuestions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-black dark:text-white mb-2">No questions found</p>
                  <p className="text-sm text-gray-500 mb-4">Create your first question to get started</p>
                  <Button
                    onClick={handleCreate}
                    className="mt-4 rounded-full"
                    icon={<Plus size={16} />}
                  >
                    Add First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {renderQuestionTree(treeQuestions)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <DataTable
              columns={columns}
              data={questions.filter(q => {
                if (!search) return true;
                const searchLower = search.toLowerCase();
                return (
                  (q.textEn && q.textEn.toLowerCase().includes(searchLower)) ||
                  (q.code && q.code.toLowerCase().includes(searchLower)) ||
                  (q.category && q.category.toLowerCase().includes(searchLower))
                );
              })}
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
        )}

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
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-700 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
                Active (Show in questionnaire)
              </label>
            </div>
            
            {/* Answer Options Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-3">Answer Options</h3>
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {formData.answers.map((answer, idx) => {
                  const ansText = answer.text || {};
                  const isExpanded = expandedBenefitMappings.has(`answer-${idx}`);
                  const benefitMapping = answer.benefitMapping || {};
                  
                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg bg-white">
                      <div className="flex items-start gap-2 p-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-black">
                            {answer.textEn || ansText.en || 'Untitled Answer'}
                          </div>
                          {(answer.textHi || ansText.hi) && (
                            <div className="text-xs text-black mt-1">
                              {answer.textHi || ansText.hi}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAnswer(idx)}
                          className="text-red-600 hover:text-red-800 text-sm px-2"
                        >
                          Remove
                        </button>
                      </div>
                      
                      {/* Sub-Question Logic */}
                      <div className="border-t border-gray-200 p-3 bg-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="checkbox"
                            id={`triggersSubQuestion-${idx}`}
                            checked={answer.triggersSubQuestion || false}
                            onChange={(e) => {
                              updateAnswerSubQuestion(idx, e.target.checked, answer.subQuestionId);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`triggersSubQuestion-${idx}`} className="text-sm font-medium text-black">
                            Triggers Sub-question?
                          </label>
                        </div>
                        {answer.triggersSubQuestion && (
                          <div className="mt-2">
                            <Select
                              label="Select follow-up question"
                              value={answer.subQuestionId || ''}
                              onChange={(value) => {
                                updateAnswerSubQuestion(idx, true, value);
                              }}
                              options={[
                                { value: '', label: 'Select a question...' },
                                ...getAvailableQuestionsForSubQuestion()
                              ]}
                              error={answer.subQuestionId === editingQuestion?.id ? 'Cannot select the same question as sub-question' : null}
                            />
                            {answer.subQuestionId && (
                              <p className="text-xs text-gray-500 mt-1">
                                This answer will trigger the selected question as a follow-up.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Benefit Mapping Accordion */}
                      <div className="border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => toggleBenefitMapping(idx)}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-black">
                            Benefit Mapping
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-black" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-black" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="grid grid-cols-3 gap-4">
                              {benefits.map((benefit) => (
                                <div key={benefit.code} className="space-y-1">
                                  <label className="block text-xs font-medium text-black">
                                    {benefit.code} — {benefit.name}
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max={benefit.maxScore || 3.0}
                                    value={benefitMapping[benefit.code] || 0}
                                    onChange={(e) =>
                                      updateAnswerBenefit(idx, benefit.code, e.target.value)
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                                    placeholder="0"
                                  />
                                </div>
                              ))}
                            </div>
                            {benefits.length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No benefits available. Please add benefits first.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
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
            
            {/* Benefits Reference */}
            {benefits.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-black mb-2">Available Benefits</h3>
                <div className="grid grid-cols-3 gap-2 text-xs text-black bg-gray-50 p-3 rounded">
                  {benefits.map((benefit) => (
                    <div key={benefit.code}>
                      <span className="font-medium">{benefit.code}:</span> {benefit.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          <p className="text-black">
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </AdminLayout>
  );
}
