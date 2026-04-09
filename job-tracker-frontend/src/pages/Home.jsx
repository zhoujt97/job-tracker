import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ApplicationTable from '../components/ApplicationTable';
import AddApplicationModal from '../components/modals/AddApplicationModal';
import api from '../services/api';

function Home() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications', {
        params: { page, limit: 10, search, status, sortBy, order },
      });
      setApplications(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, search, status, sortBy, order]);

  const statusCounts = {
    Planned: applications.filter(a => a.status === 'Planned').length,
    Applied: applications.filter(a => a.status === 'Applied').length,
    Interviewing: applications.filter(a => a.status === 'Interviewing').length,
    Rejected: applications.filter(a => a.status === 'Rejected').length,
    Ghosted: applications.filter(a => a.status === 'Ghosted').length,
    Offered: applications.filter(a => a.status === 'Offered').length,
  };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Welcome back, {user?.username}!</h1>
            <p style={styles.subtitle}>Here's your job hunting overview and recent activities.</p>
          </div>
          <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
            + Add Application
          </button>
        </div>

        <div style={styles.statsGrid}>
          {Object.entries(statusCounts).map(([label, count]) => (
            <div key={label} style={styles.statCard}>
              <p style={styles.statLabel}>{label}</p>
              <p style={styles.statCount}>{count}</p>
            </div>
          ))}
        </div>

        <div style={styles.filters}>
          <input
            style={styles.search}
            placeholder="Search by company or job title"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            style={styles.select}
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            {['Planned','Applied','Interviewing','Offered','Rejected','Ghosted'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <ApplicationTable
          applications={applications}
          onRefresh={fetchApplications}
          onSort={(field) => {
            if (sortBy === field) setOrder(order === 'asc' ? 'desc' : 'asc');
            else { setSortBy(field); setOrder('asc'); }
          }}
          sortBy={sortBy}
          order={order}
        />

        <div style={styles.pagination}>
          <button
            style={styles.pageBtn}
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            &lt;
          </button>
          <span style={styles.pageInfo}>Page {page} of {totalPages} — {total} total</span>
          <button
            style={styles.pageBtn}
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            &gt;
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddApplicationModal
          onClose={() => setShowAddModal(false)}
          onSave={() => { setShowAddModal(false); fetchApplications(); }}
        />
      )}
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' },
  main: { marginLeft: '220px', padding: '32px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { margin: '0 0 4px', fontSize: '26px' },
  subtitle: { margin: 0, color: '#888', fontSize: '14px' },
  addBtn: {
    backgroundColor: '#1a56db',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  statLabel: { margin: '0 0 8px', color: '#888', fontSize: '14px' },
  statCount: { margin: 0, fontSize: '28px', fontWeight: '700' },
  filters: { display: 'flex', gap: '12px', marginBottom: '16px' },
  search: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    width: '300px',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  pagination: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' },
  pageBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    cursor: 'pointer',
    backgroundColor: '#fff',
  },
  pageInfo: { fontSize: '14px', color: '#555' },
};

export default Home;