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

  const statusConfig = {
  Planned: {
    bg: '#F8F8F8',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15.2141 4.92859H17.1427C17.4837 4.92859 17.8107 5.06405 18.0519 5.30517C18.293 5.54628 18.4284 5.87331 18.4284 6.2143V19.0714C18.4284 19.4124 18.293 19.7395 18.0519 19.9806C17.8107 20.2217 17.4837 20.3572 17.1427 20.3572H6.857C6.51601 20.3572 6.18898 20.2217 5.94787 19.9806C5.70675 19.7395 5.57129 19.4124 5.57129 19.0714V6.2143C5.57129 5.87331 5.70675 5.54628 5.94787 5.30517C6.18898 5.06405 6.51601 4.92859 6.857 4.92859H8.78557" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.9285 3.64282H10.0714C9.36128 3.64282 8.78564 4.21846 8.78564 4.92854V5.57139C8.78564 6.28147 9.36128 6.85711 10.0714 6.85711H13.9285C14.6386 6.85711 15.2142 6.28147 15.2142 5.57139V4.92854C15.2142 4.21846 14.6386 3.64282 13.9285 3.64282Z" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.78564 10.0714H15.2142" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.78564 13.2858H15.2142" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.78564 16.5H15.2142" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  Applied: {
    bg: '#F2F8FF',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19.0711 8.78345H4.92829C4.21821 8.78345 3.64258 9.35908 3.64258 10.0692V19.0692C3.64258 19.7792 4.21821 20.3549 4.92829 20.3549H19.0711C19.7812 20.3549 20.3569 19.7792 20.3569 19.0692V10.0692C20.3569 9.35908 19.7812 8.78345 19.0711 8.78345Z" stroke="#1F62C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.64258 13.9263H20.3569" stroke="#1F62C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12.6405V15.2119" stroke="#1F62C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.8569 8.78341C15.8569 7.76043 15.4505 6.77936 14.7271 6.056C14.0038 5.33265 13.0227 4.92627 11.9997 4.92627C10.9767 4.92627 9.99566 5.33265 9.27231 6.056C8.54895 6.77936 8.14258 7.76043 8.14258 8.78341" stroke="#1F62C7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  Interviewing: {
    bg: '#FFF8F0',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9.42899 10.7121C11.0267 10.7121 12.3218 9.41693 12.3218 7.81925C12.3218 6.22157 11.0267 4.92639 9.42899 4.92639C7.83131 4.92639 6.53613 6.22157 6.53613 7.81925C6.53613 9.41693 7.83131 10.7121 9.42899 10.7121Z" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.2145 20.355H3.64307V19.0693C3.64307 17.5348 4.25263 16.0632 5.33766 14.9782C6.42269 13.8931 7.89431 13.2836 9.42878 13.2836C10.9632 13.2836 12.4349 13.8931 13.5199 14.9782C14.6049 16.0632 15.2145 17.5348 15.2145 19.0693V20.355Z" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.5718 4.92639C15.339 4.92639 16.0748 5.23117 16.6173 5.77369C17.1599 6.31621 17.4646 7.05202 17.4646 7.81925C17.4646 8.58648 17.1599 9.32229 16.6173 9.86481C16.0748 10.4073 15.339 10.7121 14.5718 10.7121" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.6289 13.5277C17.7241 13.9443 18.667 14.6837 19.3328 15.648C19.9986 16.6122 20.3559 17.7559 20.3575 18.9277V20.3549H18.4289" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  Offered: {
    bg: '#F0FFF8',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12.0002 20.9977C16.6157 20.9977 20.3574 17.2561 20.3574 12.6406C20.3574 8.02507 16.6157 4.28345 12.0002 4.28345C7.38469 4.28345 3.64307 8.02507 3.64307 12.6406C3.64307 17.2561 7.38469 20.9977 12.0002 20.9977Z" stroke="#067153" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.75732 13.9263C8.40018 16.2406 10.9716 17.6548 13.2859 17.012C14.7002 16.4977 15.8573 15.3406 16.243 13.9263" stroke="#067153" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.17169 10.5834C9.02968 10.5834 8.91455 10.4683 8.91455 10.3262C8.91455 10.1842 9.02968 10.0691 9.17169 10.0691" stroke="#067153" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.17188 10.5834C9.31389 10.5834 9.42902 10.4683 9.42902 10.3262C9.42902 10.1842 9.31389 10.0691 9.17188 10.0691" stroke="#067153" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.8289 10.5834C14.6869 10.5834 14.5718 10.4683 14.5718 10.3262C14.5718 10.1842 14.6869 10.0691 14.8289 10.0691" stroke="#067153" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.8286 10.5834C14.9706 10.5834 15.0858 10.4683 15.0858 10.3262C15.0858 10.1842 14.9706 10.0691 14.8286 10.0691" stroke="#067153" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  Rejected: {
    bg: '#FFF0F3',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12.0002 20.9977C16.6157 20.9977 20.3574 17.2561 20.3574 12.6406C20.3574 8.02507 16.6157 4.28345 12.0002 4.28345C7.38469 4.28345 3.64307 8.02507 3.64307 12.6406C3.64307 17.2561 7.38469 20.9977 12.0002 20.9977Z" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.75732 16.1405C8.40018 13.8262 10.843 12.412 13.2859 13.0548C14.7002 13.4405 15.8573 14.5977 16.3716 16.1405" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.17169 9.71204C9.02968 9.71204 8.91455 9.59691 8.91455 9.4549C8.91455 9.31288 9.02968 9.19775 9.17169 9.19775" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.17139 9.71204C9.3134 9.71204 9.42853 9.59691 9.42853 9.4549C9.42853 9.31288 9.3134 9.19775 9.17139 9.19775" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.8289 9.71204C14.6869 9.71204 14.5718 9.59691 14.5718 9.4549C14.5718 9.31288 14.6869 9.19775 14.8289 9.19775" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.8286 9.71204C14.9706 9.71204 15.0858 9.59691 15.0858 9.4549C15.0858 9.31288 14.9706 9.19775 14.8286 9.19775" stroke="#BE123C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  Ghosted: {
    bg: '#F5F5F5',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19.7142 11.3571C19.715 10.0352 19.376 8.73528 18.7299 7.58206C18.0838 6.42884 17.1521 5.461 16.0244 4.77138C14.8966 4.08177 13.6106 3.69351 12.2896 3.64387C10.9687 3.59423 9.65713 3.88486 8.4808 4.48788C7.30447 5.09091 6.30283 5.98609 5.57197 7.08756C4.84111 8.18903 4.40555 9.45983 4.30708 10.778C4.20861 12.0963 4.45053 13.4177 5.00963 14.6155C5.56873 15.8133 6.42625 16.8474 7.49993 17.6185V19.0714C7.49993 19.4124 7.63539 19.7394 7.87651 19.9805C8.11763 20.2216 8.44465 20.3571 8.78565 20.3571H15.2142C15.5552 20.3571 15.8822 20.2216 16.1234 19.9805C16.3645 19.7394 16.4999 19.4124 16.4999 19.0714V17.6185C17.494 16.9046 18.3039 15.9645 18.8628 14.8757C19.4217 13.787 19.7135 12.5809 19.7142 11.3571Z" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.78592 12.6429C9.14096 12.6429 9.42878 12.3551 9.42878 12C9.42878 11.645 9.14096 11.3572 8.78592 11.3572C8.43088 11.3572 8.14307 11.645 8.14307 12C8.14307 12.3551 8.43088 12.6429 8.78592 12.6429Z" fill="#101828" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15.2141 12.6429C15.5692 12.6429 15.857 12.3551 15.857 12C15.857 11.645 15.5692 11.3572 15.2141 11.3572C14.8591 11.3572 14.5713 11.645 14.5713 12C14.5713 12.3551 14.8591 12.6429 15.2141 12.6429Z" fill="#101828" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.7144 17.7856V20.3571" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.2856 17.7856V20.3571" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
};

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
  {Object.entries(statusCounts).map(([label, count]) => {
    const config = statusConfig[label] || { bg: '#F5F5F5', icon: null };
    return (
      <div key={label} style={styles.statCard}>
        <div style={styles.statCardInner}>
          <div>
            <p style={styles.statLabel}>{label}</p>
            <p style={styles.statCount}>{count}</p>
          </div>
          <div style={{ ...styles.iconBox, backgroundColor: config.bg }}>
            {config.icon}
          </div>
        </div>
      </div>
    );
  })}
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
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value">
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
  main: { marginLeft: '240px', padding: '32px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { margin: '0 0 4px', fontSize: '32px', fontWeight: '700', color: '#101828', fontFamily: 'Inter', lineHeight: '120%' },
  subtitle: { margin: 0, fontSize: '16px', fontWeight: '400', color: '#4A5565', fontFamily: 'Source Serif Pro', lineHeight: '140%' },
  addBtn: { backgroundColor: '#1a56db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '32px', width: 'fit-content' },
  tab: { padding: '8px 20px', borderRadius: '32px', cursor: 'pointer', fontSize: '14px', color: '#555' },
  activeTab: { backgroundColor: '#fff', color: '#000', fontWeight: '500' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statCardInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  iconBox: { width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { margin: '0 0 8px', color: '#888', fontSize: '14px', textAlign: 'left' },
  statCount: { margin: 0, fontSize: '28px', fontWeight: '700', textAlign: 'left', color: '#101828' },
  filters: { display: 'flex', gap: '12px', marginBottom: '16px' },
  search: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', width: '300px' },
  select: { padding: '10px 30px 10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
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