import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const JOB_TYPES = ['Software Engineer', 'Product Design', 'UI Design', 'Research', 'Data Analyst', 'Marketing'];
const LOCATIONS = ['Remote', 'New York', 'San Francisco', 'Seattle', 'Chicago', 'Los Angeles'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior', 'Lead', 'Manager'];

function JobMatches() {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResumeInput, setShowResumeInput] = useState(false);

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const findMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/job-matches/find', {
        jobType: selectedTypes.join(', '),
        location,
        experienceLevel,
        resumeText,
      });
      setJobs(res.data.jobs);
    } catch (err) {
      setError('Failed to find matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Upload Your Resume</h1>
            <p style={styles.subtitle}>Get personalized job matches based on your skills and experience.</p>
          </div>
          <button style={styles.uploadBtn} onClick={() => setShowResumeInput(!showResumeInput)}>
            + Upload Resume
          </button>
        </div>

        {showResumeInput && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Paste Your Resume</h3>
            <textarea
              style={styles.textarea}
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
            />
          </div>
        )}

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Job Preferences</h3>
          <p style={styles.label}>Job Type</p>
          <div style={styles.typeRow}>
            {JOB_TYPES.map(type => (
              <span
                key={type}
                style={{
                  ...styles.typeTag,
                  ...(selectedTypes.includes(type) ? styles.typeTagActive : {}),
                }}
                onClick={() => toggleType(type)}
              >
                {type}
              </span>
            ))}
          </div>

          <div style={styles.row}>
            <select
              style={styles.select}
              value={location}
              onChange={e => setLocation(e.target.value)}
            >
              <option value="">Select Location</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              style={styles.select}
              value={experienceLevel}
              onChange={e => setExperienceLevel(e.target.value)}
            >
              <option value="">Experience Level</option>
              {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button style={styles.findBtn} onClick={findMatches} disabled={loading}>
              {loading ? 'Finding...' : 'Find Matches'}
            </button>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {jobs.length > 0 && (
          <div>
            <h3 style={styles.matchTitle}>Your Job Matches ({jobs.length})</h3>
            {jobs.map((job, i) => (
              <div key={i} style={styles.jobCard}>
                <div style={styles.jobHeader}>
                  <div style={styles.jobIcon}>{job.company?.charAt(0)}</div>
                  <div style={styles.jobInfo}>
                    <div style={styles.jobTitleRow}>
                      <h3 style={styles.jobTitle}>{job.title}</h3>
                      <span style={styles.matchScore}>{job.matchScore}%</span>
                    </div>
                    <p style={styles.jobCompany}>{job.company} · {job.location}</p>
                  </div>
                </div>

                <div style={styles.skillRow}>
                  {job.skills?.map(skill => (
                    <span key={skill} style={styles.skillTag}>{skill}</span>
                  ))}
                </div>

                <div style={styles.divider} />

                <p style={styles.sectionTitle}>Why This Job is a Match</p>
                <p style={styles.sectionText}>{job.whyMatch}</p>

                <p style={styles.sectionTitle}>Required Skills</p>
                <div style={styles.skillRow}>
                  {job.requiredSkills?.map(skill => (
                    <span key={skill} style={styles.skillTag}>{skill}</span>
                  ))}
                </div>

                <p style={styles.sectionTitle}>Keyword Match</p>
                <p style={styles.sectionText}>
                  Your resume has <strong>{job.keywordMatch?.matched} out of {job.keywordMatch?.total} ({Math.round((job.keywordMatch?.matched / job.keywordMatch?.total) * 100)}%)</strong> keywords that appear in the job description.
                </p>

                <div style={styles.jobActions}>
                  <button style={styles.savedBtn}>Saved</button>
                  <button style={styles.applyBtn}>Apply</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' },
  main: { marginLeft: '220px', padding: '32px', flex: 1 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { margin: '0 0 4px', fontSize: '26px' },
  subtitle: { margin: 0, color: '#888', fontSize: '14px' },
  uploadBtn: { backgroundColor: '#1a56db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  card: { backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' },
  cardTitle: { margin: '0 0 16px', fontSize: '16px', fontWeight: '600' },
  label: { margin: '0 0 8px', fontSize: '14px', color: '#555' },
  typeRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  typeTag: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #ddd', cursor: 'pointer', fontSize: '14px', backgroundColor: '#fff' },
  typeTagActive: { backgroundColor: '#1a56db', color: '#fff', borderColor: '#1a56db' },
  row: { display: 'flex', gap: '12px', alignItems: 'center' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  findBtn: { backgroundColor: '#1a56db', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  textarea: { width: '100%', height: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' },
  error: { color: 'red', fontSize: '14px', marginBottom: '16px' },
  matchTitle: { fontSize: '18px', marginBottom: '16px' },
  jobCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' },
  jobHeader: { display: 'flex', gap: '16px', marginBottom: '16px' },
  jobIcon: { width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700' },
  jobInfo: { flex: 1 },
  jobTitleRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  jobTitle: { margin: 0, fontSize: '18px' },
  matchScore: { backgroundColor: '#059669', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '13px' },
  jobCompany: { margin: '4px 0 0', color: '#888', fontSize: '14px' },
  skillRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' },
  skillTag: { padding: '4px 12px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '13px' },
  divider: { height: '1px', backgroundColor: '#eee', margin: '16px 0' },
  sectionTitle: { fontWeight: '600', fontSize: '14px', margin: '0 0 6px' },
  sectionText: { fontSize: '14px', color: '#555', margin: '0 0 12px' },
  jobActions: { display: 'flex', gap: '12px', marginTop: '16px' },
  savedBtn: { padding: '8px 20px', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: '#fff' },
  applyBtn: { padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#1a56db', color: '#fff', cursor: 'pointer' },
};

export default JobMatches;