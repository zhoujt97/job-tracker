import { useState } from 'react';
import api from '../../services/api';

function EditApplicationModal({ application, onClose, onSave }) {
  const [form, setForm] = useState({
    company_name: application.company_name || '',
    job_title: application.job_title || '',
    job_description: application.job_description || '',
    deadline: application.deadline || '',
    applied_date: application.applied_date || '',
    priority: application.priority || '',
    status: application.status || '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    try {
      await api.patch(`/applications/${application.id}`, form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Application</h2>
          <button style={styles.close} onClick={onClose}>×</button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Company Name *</label>
            <input style={styles.input} name="company_name" value={form.company_name} onChange={handleChange} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Job Title *</label>
            <input style={styles.input} name="job_title" value={form.job_title} onChange={handleChange} />
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
            <label style={styles.label}>Priority *</label>
            <select style={styles.input} name="priority" value={form.priority} onChange={handleChange}>
              <option value="">Select priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Status *</label>
            <select style={styles.input} name="status" value={form.status} onChange={handleChange}>
              <option value="">Select status</option>
              {['Planned','Applied','Interviewing','Offered','Rejected','Ghosted'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.saveBtn} onClick={handleSubmit}>Save</button>
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
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#fff' },
  saveBtn: { padding: '10px 24px', borderRadius: '6px', border: 'none', backgroundColor: '#1a56db', color: '#fff', cursor: 'pointer' },
};

export default EditApplicationModal;