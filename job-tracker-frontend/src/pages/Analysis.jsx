import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = {
  Applied: '#1a56db',
  Interviewing: '#d97706',
  Offered: '#059669',
  Rejected: '#dc2626',
  Ghosted: '#6b7280',
  Planned: '#8b5cf6',
};

const STATUS_ORDER = ['Planned', 'Applied', 'Interviewing', 'Offered', 'Rejected', 'Ghosted'];
const SOURCE_COLOR = '#64748b';

const getNodeColor = (nodeName) => COLORS[nodeName] || SOURCE_COLOR;

const SankeyTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data?.source?.name || !data?.target?.name) return null;

  return (
    <div style={styles.tooltip}>
      <p style={styles.tooltipTitle}>{data.source.name}{' -> '}{data.target.name}</p>
      <p style={styles.tooltipValue}>{data.value} applications</p>
    </div>
  );
};

const SankeyNode = (props) => {
  const { x, y, width, height, payload } = props;
  const fill = getNodeColor(payload.name);
  return <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.9} rx={2} />;
};

const buildSankeyData = (flows) => {
  if (!flows?.length) return { nodes: [], links: [] };

  const sourceNames = [...new Set(flows.map((row) => row.source))].sort((a, b) => a.localeCompare(b));
  const rawStatuses = [...new Set(flows.map((row) => row.status))];
  const statusNames = [
    ...STATUS_ORDER.filter((status) => rawStatuses.includes(status)),
    ...rawStatuses.filter((status) => !STATUS_ORDER.includes(status)).sort((a, b) => a.localeCompare(b)),
  ];

  const nodes = [
    ...sourceNames.map((name) => ({ name, type: 'source' })),
    ...statusNames.map((name) => ({ name, type: 'status' })),
  ];

  const nodeIndex = new Map(nodes.map((node, index) => [`${node.type}:${node.name}`, index]));
  const links = flows.map((row) => ({
    source: nodeIndex.get(`source:${row.source}`),
    target: nodeIndex.get(`status:${row.status}`),
    value: row.value,
  }));

  return { nodes, links };
};

function Analysis() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [flows, setFlows] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchSourceStatusFlow();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/applications/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSourceStatusFlow = async () => {
    try {
      const res = await api.get('/applications/source-status-flow');
      setFlows(res.data.flows || []);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) return <div style={styles.loading}>Loading...</div>;

  const sankeyData = useMemo(() => buildSankeyData(flows), [flows]);
  const totalFlow = useMemo(
    () => flows.reduce((sum, row) => sum + Number(row.value || 0), 0),
    [flows]
  );

  const ghostRate = stats.total > 0
    ? ((stats.statusCounts.Ghosted / stats.total) * 100).toFixed(1)
    : 0;

  const everInterviewed = stats?.funnelCounts?.everInterviewed ?? stats?.statusCounts?.Interviewing ?? 0;
  const everOffered = stats?.funnelCounts?.everOffered ?? stats?.statusCounts?.Offered ?? 0;

  const applicationToInterview = stats.total > 0
    ? ((everInterviewed / stats.total) * 100).toFixed(1)
    : 0;

  const applicationToOffer = stats.total > 0
    ? ((everOffered / stats.total) * 100).toFixed(1)
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
                <p style={styles.metricValue}>{applicationToInterview}%</p>
              </div>
              <div>
                <p style={styles.metricLabel}>Applied to Offer</p>
                <p style={styles.metricValue}>{applicationToOffer}%</p>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sankeyHeader}>
            <h3 style={styles.cardTitle}>Source to Status Flow</h3>
            <p style={styles.sankeySub}>Total mapped applications: {totalFlow}</p>
          </div>
          {sankeyData.links.length === 0 ? (
            <div style={styles.emptyState}>No source/status data yet. Add application sources to populate this chart.</div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <Sankey
                data={sankeyData}
                node={SankeyNode}
                nodePadding={34}
                nodeWidth={14}
                margin={{ top: 24, right: 140, bottom: 24, left: 24 }}
              >
                <Tooltip content={<SankeyTooltip />} />
              </Sankey>
            </ResponsiveContainer>
          )}
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
  sankeyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  sankeySub: { margin: 0, color: '#64748b', fontSize: '13px' },
  emptyState: { padding: '28px 12px', color: '#6b7280', fontSize: '14px' },
  tooltip: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  tooltipTitle: { margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827' },
  tooltipValue: { margin: '4px 0 0', fontSize: '13px', color: '#475569' },
};

export default Analysis;
