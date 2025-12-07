// pages/admin/question-entry.js
// Admin form for adding/editing quiz questions

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/admin.module.css';

export default function QuestionEntry() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    groupId: '',
    groupName: '',
    visionTypes: [],
    text: { en: '', hi: '', hinglish: '' },
    questionType: 'multiple_choice',
    options: [],
    defaultNext: '',
    order: 0,
    isRequired: true,
    is_active: true
  });

  const [newOption, setNewOption] = useState({
    id: '',
    label: { en: '', hi: '', hinglish: '' },
    severity: 0,
    tags: [],
    branchesTo: '',
    value: ''
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (id) {
      loadQuestion(id);
    } else {
      // Generate default ID
      setFormData(prev => ({
        ...prev,
        id: `Q_${Date.now()}`
      }));
    }
  }, [id]);

  const loadQuestion = async (questionId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        headers: {
          'Authorization': `Bearer admin123`
        }
      });
      const data = await res.json();
      if (data.success) {
        setFormData(data.question);
      } else {
        setError(data.error || 'Failed to load question');
      }
    } catch (err) {
      setError('Failed to load question data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTextChange = (lang, value) => {
    setFormData(prev => ({
      ...prev,
      text: { ...prev.text, [lang]: value }
    }));
  };

  const handleVisionTypeToggle = (visionType) => {
    setFormData(prev => {
      const current = prev.visionTypes || [];
      const updated = current.includes(visionType)
        ? current.filter(vt => vt !== visionType)
        : [...current, visionType];
      return { ...prev, visionTypes: updated };
    });
  };

  const addOption = () => {
    if (!newOption.id || !newOption.label.en) {
      alert('Please fill in option ID and English label');
      return;
    }
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), { ...newOption }]
    }));
    setNewOption({
      id: '',
      label: { en: '', hi: '', hinglish: '' },
      severity: 0,
      tags: [],
      branchesTo: '',
      value: ''
    });
  };

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addTagToOption = (optionIndex) => {
    if (!newTag.trim()) return;
    setFormData(prev => {
      const options = [...prev.options];
      if (!options[optionIndex].tags) options[optionIndex].tags = [];
      options[optionIndex].tags.push(newTag.trim());
      return { ...prev, options };
    });
    setNewTag('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const url = id ? `/api/admin/questions/${id}` : '/api/admin/questions';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer admin123`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        if (!id) {
          setTimeout(() => {
            router.push('/admin/questions');
          }, 1500);
        }
      } else {
        setError(data.error || 'Failed to save question');
      }
    } catch (err) {
      setError('Failed to save question: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loading}>Loading...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{id ? 'Edit Question' : 'Add New Question'}</h1>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/admin/questions')}
        >
          ← Back to Questions
        </button>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className={styles.successBox}>
          <strong>Success!</strong> Question {id ? 'updated' : 'created'} successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Question ID <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className={styles.input}
                required
                placeholder="e.g., Q_SCREEN_HOURS"
                disabled={!!id}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Group ID
              </label>
              <input
                type="text"
                name="groupId"
                value={formData.groupId}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., G_LIFESTYLE"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Order
              </label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                className={styles.input}
                min="0"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Question Text (Multi-language) <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.text.en}
              onChange={(e) => handleTextChange('en', e.target.value)}
              className={styles.input}
              required
              placeholder="English text"
              style={{ marginBottom: '0.5rem' }}
            />
            <input
              type="text"
              value={formData.text.hi}
              onChange={(e) => handleTextChange('hi', e.target.value)}
              className={styles.input}
              placeholder="Hindi text (optional)"
              style={{ marginBottom: '0.5rem' }}
            />
            <input
              type="text"
              value={formData.text.hinglish}
              onChange={(e) => handleTextChange('hinglish', e.target.value)}
              className={styles.input}
              placeholder="Hinglish text (optional)"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Vision Types (Select all that apply)
            </label>
            <div className={styles.checkboxGroup}>
              {['SV_DISTANCE', 'SV_NEAR', 'SV_BIFOCAL_PAIR', 'PROGRESSIVE', 'BIFOCAL', 'ZERO_POWER'].map(vt => (
                <label key={vt} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.visionTypes.includes(vt)}
                    onChange={() => handleVisionTypeToggle(vt)}
                  />
                  <span>{vt.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Options */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Options</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Add New Option</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="text"
                value={newOption.id}
                onChange={(e) => setNewOption({ ...newOption, id: e.target.value })}
                className={styles.input}
                placeholder="Option ID (e.g., OPT_SCREEN_<2)"
              />
              <input
                type="text"
                value={newOption.label.en}
                onChange={(e) => setNewOption({ ...newOption, label: { ...newOption.label, en: e.target.value } })}
                className={styles.input}
                placeholder="English label"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="number"
                value={newOption.severity}
                onChange={(e) => setNewOption({ ...newOption, severity: parseInt(e.target.value) || 0 })}
                className={styles.input}
                placeholder="Severity (0-5)"
                min="0"
                max="5"
              />
              <input
                type="text"
                value={newOption.branchesTo}
                onChange={(e) => setNewOption({ ...newOption, branchesTo: e.target.value })}
                className={styles.input}
                placeholder="Branches to (Question ID)"
              />
              <input
                type="text"
                value={newOption.value}
                onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                className={styles.input}
                placeholder="Value"
              />
            </div>
            <button
              type="button"
              onClick={addOption}
              className={styles.addButton}
            >
              Add Option
            </button>
          </div>

          {formData.options.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Current Options</h3>
              {formData.options.map((option, index) => (
                <div key={index} style={{ 
                  padding: '1rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{option.id}</strong> - {option.label.en}
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        Severity: {option.severity} | 
                        Tags: {option.tags?.join(', ') || 'None'} |
                        Branches to: {option.branchesTo || 'None'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className={styles.deleteButton}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Additional Options */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Additional Options</h2>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Default Next Question ID
            </label>
            <input
              type="text"
              name="defaultNext"
              value={formData.defaultNext}
              onChange={handleChange}
              className={styles.input}
              placeholder="Question ID to go to if no branch"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isRequired"
                checked={formData.isRequired}
                onChange={handleChange}
              />
              <span>Required Question</span>
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span>Active (Show in quiz)</span>
            </label>
          </div>
        </section>

        {/* Submit Button */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={saving}
          >
            {saving ? 'Saving...' : (id ? 'Update Question' : 'Create Question')}
          </button>
        </div>
      </form>
    </div>
  );
}

