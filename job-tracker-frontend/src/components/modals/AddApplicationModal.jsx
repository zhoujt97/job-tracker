import { useState } from 'react';
import api from '../../services/api';

const STATUS_OPTIONS = ['Planned', 'Applied', 'Interviewing', 'Offered', 'Rejected', 'Ghosted'];

function AddApplicationModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    company_name: '', job_title: '', job_description: '',
    source: '', deadline: '', applied_date: '', priority: '', status_sequence: [''],
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const updateSequenceStep = (index, value) => {
    const next = [...form.status_sequence];
    next[index] = value;
    setForm({ ...form, status_sequence: next });
  };
  const addSequenceStep = () => setForm({ ...form, status_sequence: [...form.status_sequence, ''] });
  const removeSequenceStep = (index) => {
    const next = form.status_sequence.filter((_, i) => i !== index);
    setForm({ ...form, status_sequence: next.length ? next : [''] });
  };

  const handleSubmit = async () => {
    setError('');
    try {
      if (!form.company_name.trim() || !form.job_title.trim() || !form.priority.trim()) {
        setError('Company name, job title, and priority are required');
        return;
      }

      const cleanedSequence = form.status_sequence.filter(Boolean);
      if (cleanedSequence.length === 0) {
        setError('Please add at least one status in sequence');
        return;
      }

      await api.post('/applications', {
        ...form,
        status: cleanedSequence[cleanedSequence.length - 1],
        status_sequence: cleanedSequence,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Add Application</h2>
          <button style={styles.close} onClick={onClose}>×</button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Company Name *</label>
            <input style={styles.input} name="company_name" placeholder="Enter company name" value={form.company_name} onChange={handleChange} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Job Title *</label>
            <input style={styles.input} name="job_title" placeholder="Enter job title" value={form.job_title} onChange={handleChange} />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Job Description</label>
          <textarea style={styles.textarea} name="job_description" value={form.job_description} onChange={handleChange} />
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Deadline</label>
            <input style={styles.input} type="date" name="deadline" value={form.deadline} onChange={handleChange} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Applied Date</label>
            <input style={styles.input} type="date" name="applied_date" value={form.applied_date} onChange={handleChange} />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Source</label>
            <select style={styles.input} name="source" value={form.source} onChange={handleChange}>
              <option value="">Select source</option>
              {['LinkedIn', 'Indeed', 'Referral', 'Company Site', 'Handshake', 'Recruiter', 'Other'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Priority *</label>
            <select style={styles.input} name="priority" value={form.priority} onChange={handleChange}>
              <option value="">Select priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Status Sequence *</label>
          {form.status_sequence.map((step, index) => (
            <div key={`status-step-${index}`} style={styles.sequenceRow}>
              <span style={styles.sequenceIndex}>{index + 1}</span>
              <select
                style={styles.input}
                value={step}
                onChange={(e) => updateSequenceStep(index, e.target.value)}
              >
                <option value="">Select status</option>
                {STATUS_OPTIONS.map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                style={styles.sequenceRemove}
                onClick={() => removeSequenceStep(index)}
                disabled={form.status_sequence.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" style={styles.sequenceAdd} onClick={addSequenceStep}>
            + Add Stage
          </button>
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.addBtn} onClick={handleSubmit}>Add</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '32px', width: '560px', maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { margin: 0, fontSize: '20px' },
  close: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' },
  error: { color: 'red', fontSize: '14px', marginBottom: '12px' },
  row: { display: 'flex', gap: '16px' },
  field: { flex: 1, marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '14px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', height: '100px', resize: 'vertical' },
  sequenceRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  sequenceIndex: { width: '18px', fontSize: '13px', color: '#6b7280' },
  sequenceAdd: { marginTop: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', cursor: 'pointer' },
  sequenceRemove: { border: '1px solid #d1d5db', backgroundColor: '#fff', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', cursor: 'pointer' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#fff' },
  addBtn: { padding: '10px 24px', borderRadius: '6px', border: 'none', backgroundColor: '#1a56db', color: '#fff', cursor: 'pointer' },
};

export default AddApplicationModal;
