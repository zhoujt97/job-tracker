import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ApplicationTable from '../components/ApplicationTable';
import AddApplicationModal from '../components/modals/AddApplicationModal';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  Applied: '#1a56db',
  Interviewing: '#d97706',
  Offered: '#059669',
  Rejected: '#dc2626',
  Ghosted: '#6b7280',
  Planned: '#8b5cf6',
};

function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState(null);

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

  const fetchStats = async () => {
    try {
      const res = await api.get('/applications/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [page, search, status, sortBy, order]);

  const statusCounts = stats?.statusCounts || {
    Planned: 0, Applied: 0, Interviewing: 0,
    Rejected: 0, Ghosted: 0, Offered: 0,
  };

  const pieData = stats ? Object.entries(stats.statusCounts)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value })) : [];

  const ghostRate = stats?.total > 0
    ? ((stats.statusCounts.Ghosted / stats.total) * 100).toFixed(1) : 0;

  const conversionApplied = stats?.total > 0
    ? ((stats.statusCounts.Interviewing / stats.total) * 100).toFixed(1) : 0;

  const conversionInterview = stats?.statusCounts.Interviewing > 0
    ? ((stats.statusCounts.Offered / stats.statusCounts.Interviewing) * 100).toFixed(1) : 0;

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

        <div style={styles.tabs}>
          <span
            style={{ ...styles.tab, ...(activeTab === 'overview' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </span>
          <span
            style={{ ...styles.tab, ...(activeTab === 'analysis' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </span>
        </div>

        {activeTab === 'overview' ? (
          <>
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
              <button style={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                &lt;
              </button>
              <span style={styles.pageInfo}>Page {page} of {totalPages} — {total} total</span>
              <button style={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                &gt;
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={styles.analysisGrid}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Application Metrics</h3>
                <div style={styles.metricRow}>
                  <div>
                    <p style={styles.metricLabel}>Total Applications</p>
                    <p style={styles.metricValue}>{stats?.total || 0}</p>
                  </div>
                  <div>
                    <p style={styles.metricLabel}>Ghost Rate</p>
                    <p style={styles.metricValue}>{ghostRate}%</p>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Conversion Rate</h3>
                <div style={styles.metricRow}>
                  <div>
                    <p style={styles.metricLabel}>Applied to Interview</p>
                    <p style={styles.metricValue}>{conversionApplied}%</p>
                  </div>
                  <div>
                    <p style={styles.metricLabel}>Interview to Offer</p>
                    <p style={styles.metricValue}>{conversionInterview}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name] || '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <AddApplicationModal
          onClose={() => setShowAddModal(false)}
          onSave={() => { setShowAddModal(false); fetchApplications(); fetchStats(); }}
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
  addBtn: { backgroundColor: '#1a56db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px', width: 'fit-content' },
  tab: { padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: '#555' },
  activeTab: { backgroundColor: '#fff', color: '#000', fontWeight: '500' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statLabel: { margin: '0 0 8px', color: '#888', fontSize: '14px' },
  statCount: { margin: 0, fontSize: '28px', fontWeight: '700' },
  filters: { display: 'flex', gap: '12px', marginBottom: '16px' },
  search: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', width: '300px' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  pagination: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' },
  pageBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#fff' },
  pageInfo: { fontSize: '14px', color: '#555' },
  analysisGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  card: { backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' },
  cardTitle: { margin: '0 0 20px', fontSize: '16px', fontWeight: '600' },
  metricRow: { display: 'flex', gap: '40px' },
  metricLabel: { margin: '0 0 8px', color: '#888', fontSize: '13px' },
  metricValue: { margin: 0, fontSize: '28px', fontWeight: '700' },
};

export default Home;