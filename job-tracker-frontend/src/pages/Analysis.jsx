import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
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

function Analysis() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/applications/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return <div style={styles.loading}>Loading...</div>;

  const pieData = Object.entries(stats.statusCounts)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  const ghostRate = stats.total > 0
    ? ((stats.statusCounts.Ghosted / stats.total) * 100).toFixed(1)
    : 0;

  const conversionApplied = stats.total > 0
    ? ((stats.statusCounts.Interviewing / stats.total) * 100).toFixed(1)
    : 0;

  const conversionInterview = stats.statusCounts.Interviewing > 0
    ? ((stats.statusCounts.Offered / stats.statusCounts.Interviewing) * 100).toFixed(1)
    : 0;

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Welcome back, {user?.username}!</h1>
            <p style={styles.subtitle}>Here's your job hunting overview and recent activities.</p>
          </div>
          <button style={styles.addBtn}>+ Add Application</button>
        </div>

        <div style={styles.tabs}>
          <a href="/" style={styles.tab}>Overview</a>
          <span style={{ ...styles.tab, ...styles.activeTab }}>Analysis</span>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Application Metrics</h3>
            <div style={styles.metricRow}>
              <div>
                <p style={styles.metricLabel}>Total Applications</p>
                <p style={styles.metricValue}>{stats.total}</p>
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
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] || '#ccc'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' },
  main: { marginLeft: '220px', padding: '32px', flex: 1 },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { margin: '0 0 4px', fontSize: '26px' },
  subtitle: { margin: 0, color: '#888', fontSize: '14px' },
  addBtn: { backgroundColor: '#1a56db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#e5e7eb', padding: '4px', borderRadius: '8px', width: 'fit-content' },
  tab: { padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', textDecoration: 'none', color: '#555' },
  activeTab: { backgroundColor: '#fff', color: '#000', fontWeight: '500' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  card: { backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' },
  cardTitle: { margin: '0 0 20px', fontSize: '16px', fontWeight: '600' },
  metricRow: { display: 'flex', gap: '40px' },
  metricLabel: { margin: '0 0 8px', color: '#888', fontSize: '13px' },
  metricValue: { margin: 0, fontSize: '28px', fontWeight: '700' },
};

export default Analysis;