import api from '../../services/api';

function DeleteModal({ application, onClose, onDelete }) {
  const handleDelete = async () => {
    try {
      await api.delete(`/applications/${application.id}`);
      onDelete();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Delete Application</h2>
          <button style={styles.close} onClick={onClose}>×</button>
        </div>
        <p style={styles.message}>
          Are you sure you want to delete this application? You won't be able to undo this action.
        </p>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.deleteBtn} onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', borderRadius: '12px', padding: '32px', width: '460px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { margin: 0, fontSize: '20px' },
  close: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' },
  message: { color: '#555', fontSize: '14px', marginBottom: '24px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#fff' },
  deleteBtn: { padding: '10px 24px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer' },
};

export default DeleteModal;