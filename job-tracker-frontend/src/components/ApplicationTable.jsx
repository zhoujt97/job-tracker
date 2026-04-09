import { useState } from 'react';
import EditApplicationModal from './modals/EditApplicationModal';
import DeleteModal from './modals/DeleteModal';

const statusColors = {
  Planned: '#555',
  Applied: '#1a56db',
  Interviewing: '#d97706',
  Offered: '#059669',
  Rejected: '#dc2626',
  Ghosted: '#6b7280',
};

const priorityColors = {
  High: '#dc2626',
  Medium: '#d97706',
  Low: '#6b7280',
};

function ApplicationTable({ applications, onRefresh, onSort, sortBy, order }) {
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const arrow = (field) => sortBy === field ? (order === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {[
              { label: 'Company', field: 'company_name' },
              { label: 'Job Title', field: 'job_title' },
              { label: 'Priority', field: 'priority' },
              { label: 'Deadline', field: 'deadline' },
              { label: 'Applied Date', field: 'applied_date' },
              { label: 'Status', field: 'status' },
            ].map(col => (
              <th
                key={col.field}
                style={styles.th}
                onClick={() => onSort(col.field)}
              >
                {col.label}{arrow(col.field)}
              </th>
            ))}
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {applications.length === 0 ? (
            <tr>
              <td colSpan={7} style={styles.empty}>No applications found</td>
            </tr>
          ) : (
            applications.map(app => (
              <tr key={app.id} style={styles.tr}>
                <td style={styles.td}>{app.company_name}</td>
                <td style={styles.td}>{app.job_title}</td>
                <td style={styles.td}>
                  <span style={{ color: priorityColors[app.priority] }}>
                    {app.priority}
                  </span>
                </td>
                <td style={styles.td}>{app.deadline || '—'}</td>
                <td style={styles.td}>{app.applied_date || '—'}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    color: statusColors[app.status],
                    borderColor: statusColors[app.status],
                  }}>
                    {app.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.menuWrapper}>
                    <button
                      style={styles.menuBtn}
                      onClick={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                    >
                      •••
                    </button>
                    {openMenuId === app.id && (
                      <div style={styles.menu}>
                        <div style={styles.menuItem} onClick={() => {
                          setEditTarget(app);
                          setOpenMenuId(null);
                        }}>
                          Edit
                        </div>
                        <div style={{ ...styles.menuItem, color: '#dc2626' }} onClick={() => {
                          setDeleteTarget(app);
                          setOpenMenuId(null);
                        }}>
                          Delete
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {editTarget && (
        <EditApplicationModal
          application={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={() => { setEditTarget(null); onRefresh(); }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          application={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDelete={() => { setDeleteTarget(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#fff', borderRadius: '10px', overflow: 'visible', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#888', borderBottom: '1px solid #eee', cursor: 'pointer', userSelect: 'none' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '14px 16px', fontSize: '14px' },
  empty: { padding: '40px', textAlign: 'center', color: '#888' },
  badge: { padding: '2px 10px', borderRadius: '20px', border: '1px solid', fontSize: '13px' },
  menuWrapper: { position: 'relative' },
  menuBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#888' },
  menu: { position: 'absolute', right: 0, top: '100%', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '100px' },
  menuItem: { padding: '10px 16px', cursor: 'pointer', fontSize: '14px' },
};

export default ApplicationTable;