import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ApplicationTable from '../components/ApplicationTable';
import AddApplicationModal from '../components/modals/AddApplicationModal';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sankey } from 'recharts';

const COLORS = {
  Submitted: '#334155',
  Applied: '#1a56db',
  Interviewing: '#d97706',
  Offered: '#059669',
  Rejected: '#dc2626',
  Ghosted: '#6b7280',
  Planned: '#8b5cf6',
};

const STATUS_ORDER = ['Submitted', 'Planned', 'Applied', 'Interviewing', 'Offered', 'Rejected', 'Ghosted'];
const SOURCE_COLOR = '#64748b';

const nodeDisplayName = (nodeName) => nodeName.replace(/^Stage \d+:\s*/, '');
const getNodeColor = (nodeName) => COLORS[nodeDisplayName(nodeName)] || SOURCE_COLOR;

const SankeyTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data?.source?.name || !data?.target?.name) return null;

  return (
    <div style={styles.tooltipCard}>
      <p style={styles.tooltipTitle}>{nodeDisplayName(data.source.name)}{' -> '}{nodeDisplayName(data.target.name)}</p>
      <p style={styles.tooltipValue}>{data.value} applications</p>
    </div>
  );
};

const SankeyNode = ({ x, y, width, height, payload }) => {
  const fill = getNodeColor(payload.name);
  const isSourceNode = payload.type === 'source' || payload.depth === 0;
  const labelX = isSourceNode ? x - 16 : x + width + 16;
  const textAnchor = isSourceNode ? 'end' : 'start';
  const labelY = y + height / 2;
  const valueText = Math.round(Number(payload.fixedValue ?? payload.value ?? 0));

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.9} rx={2} />
      <text x={labelX} y={labelY - 8} textAnchor={textAnchor} fill="#111827" fontSize={24} fontWeight={600}>
        {valueText}
      </text>
      <text x={labelX} y={labelY + 26} textAnchor={textAnchor} fill="#64748b" fontSize={14} fontWeight={500}>
        {nodeDisplayName(payload.name)}
      </text>
    </g>
  );
};

const buildStatusSequenceSankeyData = (flows) => {
  if (!flows?.length) return { nodes: [], links: [] };

  const sortedNodes = [...new Set(flows.flatMap((row) => [row.from, row.to]))].sort((a, b) => {
    const stageA = Number((a.match(/^Stage (\d+):/) || [])[1] || 0);
    const stageB = Number((b.match(/^Stage (\d+):/) || [])[1] || 0);
    if (stageA !== stageB) return stageA - stageB;
    const nameA = a.replace(/^Stage \d+:\s*/, '');
    const nameB = b.replace(/^Stage \d+:\s*/, '');
    return nameA.localeCompare(nameB);
  });

  const nodes = sortedNodes.map((name) => ({ name, type: name === 'Applications' ? 'source' : 'status' }));
  const nodeIndex = new Map(nodes.map((node, index) => [node.name, index]));
  const links = flows.map((row) => ({
    source: nodeIndex.get(row.from),
    target: nodeIndex.get(row.to),
    value: Number(row.value || 0),
  }));

  return { nodes, links };
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
  const [statusSequenceFlows, setStatusSequenceFlows] = useState([]);

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

  const fetchStatusSequenceFlow = async () => {
    try {
      const res = await api.get('/applications/status-sequence-flow');
      setStatusSequenceFlows(res.data.flows || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchStats();
    fetchStatusSequenceFlow();
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

  const sankeyData = useMemo(() => buildStatusSequenceSankeyData(statusSequenceFlows), [statusSequenceFlows]);
  const totalFlow = useMemo(
    () => statusSequenceFlows.reduce((sum, row) => sum + Number(row.value || 0), 0),
    [statusSequenceFlows]
  );

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
              onRefresh={() => {
                fetchApplications();
                fetchStats();
                fetchStatusSequenceFlow();
              }}
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

            <div style={styles.card}>
              <div style={styles.sankeyHeader}>
                <div style={styles.sankeyTitleBlock}>
                  <h3 style={styles.cardTitle}>Status Sequence Flow</h3>
                </div>
                <p style={styles.sankeySub}>Total mapped applications: {totalFlow}</p>
              </div>
              {sankeyData.links.length === 0 ? (
                <div style={styles.emptyState}>No sequence data yet. Add or edit applications with multiple status stages.</div>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <Sankey
                    data={sankeyData}
                    node={SankeyNode}
                    nodePadding={34}
                    nodeWidth={14}
                    margin={{ top: 24, right: 180, bottom: 24, left: 180 }}
                  >
                    <Tooltip content={<SankeyTooltip />} />
                  </Sankey>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <AddApplicationModal
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            fetchApplications();
            fetchStats();
            fetchStatusSequenceFlow();
          }}
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
  sankeyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  sankeyTitleBlock: { display: 'flex', flexDirection: 'column', gap: '10px' },
  sankeySub: { margin: 0, color: '#64748b', fontSize: '13px' },
  emptyState: { padding: '28px 12px', color: '#6b7280', fontSize: '14px' },
  tooltipCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  tooltipTitle: { margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827' },
  tooltipValue: { margin: '4px 0 0', fontSize: '13px', color: '#475569' },
};

export default Home;
