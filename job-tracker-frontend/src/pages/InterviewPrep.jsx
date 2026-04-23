import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

function CompanyLogo({ company }) {
  const domain = company?.toLowerCase().replace(/\s+/g, '') + '.com';
  const [imgError, setImgError] = useState(false);
  const bgColors = ['#EA4335', '#4285F4', '#34A853', '#FBBC05', '#7C3AED', '#DB2777', '#059669'];
  const color = bgColors[company?.charCodeAt(0) % bgColors.length];
  if (imgError) {
    return <div style={{ ...styles.logoBox, backgroundColor: color }}><span style={styles.logoLetter}>{company?.charAt(0)?.toUpperCase()}</span></div>;
  }
  return <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} alt={company} style={styles.logoImg} onError={() => setImgError(true)} />;
}

const DIFFICULTY_COLORS = {
  Easy: { bg: '#F0FDF4', text: '#16A34A' },
  Medium: { bg: '#FFF7ED', text: '#EA580C' },
  Hard: { bg: '#FFF1F2', text: '#E11D48' },
};

export default function InterviewPrep() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTips, setShowTips] = useState(true);

  useEffect(() => {
    fetchInterviewingApps();
  }, []);

  const fetchInterviewingApps = async () => {
    try {
      const res = await api.get('/applications', { params: { status: 'Interviewing', limit: 10 } });
      setApplications(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const generateQuestions = async (app) => {
    setSelectedApp(app);
    setLoading(true);
    setCurrentQ(0);
    setQuestions([]);
    try {
      const res = await api.post('/interview-prep/generate', {
        jobTitle: app.job_title,
        company: app.company_name,
        jobDescription: app.job_description,
      });
      setQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const q = questions[currentQ];

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Interview Preparation</h1>
          <p style={styles.pageSubtitle}>Interview prep tailored to your profile and job match.</p>
        </div>

        {/* Job Cards */}
        {applications.length === 0 ? (
          <div style={styles.emptyCard}>
            <p style={styles.emptyText}>No applications with "Interviewing" status yet.</p>
            <p style={styles.emptyHint}>Update an application status to "Interviewing" on the Home page to get started.</p>
          </div>
        ) : (
          <div style={styles.jobCards}>
            {applications.map(app => (
              <div
                key={app.id}
                style={{
                  ...styles.jobCard,
                  ...(selectedApp?.id === app.id ? styles.jobCardActive : {}),
                }}
                onClick={() => generateQuestions(app)}
              >
                <div style={styles.jobCardTop}>
                  <CompanyLogo company={app.company_name} />
                  <div style={styles.jobCardInfo}>
                    <p style={styles.jobCardTitle}>{app.job_title}</p>
                    <p style={styles.jobCardSub}>{app.company_name}</p>
                  </div>
                </div>
                {app.interview_date && (
                  <p style={styles.interviewDate}>Interview date: {new Date(app.interview_date).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Questions */}
        {loading && (
          <div style={styles.loadingCard}>
            <p style={styles.loadingText}>Generating interview questions...</p>
          </div>
        )}

        {!loading && selectedApp && questions.length > 0 && (
          <div style={styles.questionCard}>
            <div style={styles.questionHeader}>
              <span style={styles.questionCount}>Question {currentQ + 1} of {questions.length}</span>
              <div style={styles.tags}>
                {q.difficulty && (
                  <span style={{ ...styles.tag, backgroundColor: DIFFICULTY_COLORS[q.difficulty]?.bg, color: DIFFICULTY_COLORS[q.difficulty]?.text }}>
                    {q.difficulty}
                  </span>
                )}
                {q.category && (
                  <span style={{ ...styles.tag, backgroundColor: '#EFF6FF', color: '#2563EB' }}>{q.category}</span>
                )}
              </div>
            </div>

            <p style={styles.questionText}>{q.question}</p>

            <div style={styles.divider} />

            <div style={styles.tipsSection}>
              <div style={styles.tipsHeader} onClick={() => setShowTips(!showTips)}>
                <span style={styles.tipsTitle}>Preparation Tips</span>
                <span>{showTips ? '▲' : '▼'}</span>
              </div>
              {showTips && q.tips && (
                <ol style={styles.tipsList}>
                  {q.tips.map((tip, i) => (
                    <li key={i} style={styles.tipItem}>
                      <span style={styles.tipNum}>{i + 1}</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div style={styles.dots}>
              {questions.map((_, i) => (
                <div key={i} style={{ ...styles.dot, ...(i === currentQ ? styles.dotActive : {}) }} onClick={() => setCurrentQ(i)} />
              ))}
            </div>

            <div style={styles.navButtons}>
              <button style={styles.prevBtn} onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}>
                Previous
              </button>
              <button style={styles.nextBtn} onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))} disabled={currentQ === questions.length - 1}>
                Next
              </button>
            </div>
          </div>
        )}

        {!loading && !selectedApp && applications.length > 0 && (
          <div style={styles.emptyCard}>
            <p style={styles.emptyText}>Select a job above to generate interview questions.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#F3F4F6' },
  main: { marginLeft: '220px', padding: '40px 48px', flex: 1, maxWidth: '900px' },
  header: { marginBottom: '28px' },
  pageTitle: { margin: '0 0 6px', fontSize: '28px', fontWeight: '700', color: '#111827' },
  pageSubtitle: { margin: 0, fontSize: '14px', color: '#6B7280' },
  jobCards: { display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' },
  jobCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', width: '200px', cursor: 'pointer', border: '2px solid transparent', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  jobCardActive: { border: '2px solid #2563EB' },
  jobCardTop: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' },
  logoImg: { width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #F3F4F6', padding: '2px' },
  logoBox: { width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoLetter: { color: '#fff', fontSize: '16px', fontWeight: '700' },
  jobCardInfo: { flex: 1, minWidth: 0 },
  jobCardTitle: { margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  jobCardSub: { margin: '2px 0 0', fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  interviewDate: { margin: 0, fontSize: '12px', color: '#6B7280' },
  emptyCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  emptyText: { margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#374151' },
  emptyHint: { margin: 0, fontSize: '14px', color: '#9CA3AF' },
  loadingCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  loadingText: { margin: 0, fontSize: '15px', color: '#6B7280' },
  questionCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  questionCount: { fontSize: '13px', color: '#9CA3AF' },
  tags: { display: 'flex', gap: '8px' },
  tag: { padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  questionText: { fontSize: '18px', fontWeight: '600', color: '#111827', lineHeight: '1.6', margin: '0 0 24px' },
  divider: { height: '1px', backgroundColor: '#F3F4F6', marginBottom: '20px' },
  tipsSection: { marginBottom: '24px' },
  tipsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '12px' },
  tipsTitle: { fontSize: '15px', fontWeight: '600', color: '#111827' },
  tipsList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' },
  tipItem: { display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px', color: '#374151', lineHeight: '1.5' },
  tipNum: { color: '#2563EB', fontWeight: '700', fontSize: '14px', minWidth: '16px' },
  dots: { display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E5E7EB', cursor: 'pointer' },
  dotActive: { backgroundColor: '#2563EB' },
  navButtons: { display: 'flex', justifyContent: 'center', gap: '12px' },
  prevBtn: { padding: '10px 32px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer', backgroundColor: '#fff', fontSize: '14px', fontWeight: '500', color: '#374151' },
  nextBtn: { padding: '10px 32px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
};
