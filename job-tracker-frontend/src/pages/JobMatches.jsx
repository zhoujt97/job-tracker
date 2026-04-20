import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const JOB_TYPES = ['Software Engineer', 'Product Design', 'UI Design', 'Research', 'Data Analyst', 'Marketing'];
const LOCATIONS = ['Remote', 'New York', 'San Francisco', 'Seattle', 'Chicago', 'Los Angeles'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior', 'Lead', 'Manager'];
const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024;

const CHIP_COLORS = [
  { bg: '#EFF6FF', text: '#2563EB' },
  { bg: '#F0FDF4', text: '#16A34A' },
  { bg: '#FFF7ED', text: '#EA580C' },
  { bg: '#FAF5FF', text: '#7C3AED' },
  { bg: '#FFF1F2', text: '#E11D48' },
];

function CompanyLogo({ company }) {
  const domain = company?.toLowerCase().replace(/\s+/g, '') + '.com';
  const [imgError, setImgError] = useState(false);
  const bgColors = ['#EA4335', '#4285F4', '#34A853', '#FBBC05', '#7C3AED', '#DB2777', '#059669', '#D97706'];
  const color = bgColors[company?.charCodeAt(0) % bgColors.length];

  if (imgError) {
    return (
      <div style={{ ...styles.logoBox, backgroundColor: color }}>
        <span style={styles.logoLetter}>{company?.charAt(0)?.toUpperCase()}</span>
      </div>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={company}
      style={styles.logoImg}
      onError={() => setImgError(true)}
    />
  );
}

function ScoreBadge({ score }) {
  const color = score >= 90 ? '#059669' : score >= 75 ? '#2563EB' : '#D97706';
  return <span style={{ ...styles.scoreBadge, backgroundColor: color }}>{score}%</span>;
}

function SkillChip({ skill, index }) {
  const c = CHIP_COLORS[index % CHIP_COLORS.length];
  return (
    <span style={{ ...styles.skillChip, backgroundColor: c.bg, color: c.text, borderColor: c.bg }}>
      {skill}
    </span>
  );
}

function JobCard({ job, onToggleSave, onApply, saving }) {
  return (
    <div style={styles.jobCard}>
      <div style={styles.jobHeader}>
        <CompanyLogo company={job.company} />
        <div style={styles.jobMeta}>
          <div style={styles.jobTitleRow}>
            <h2 style={styles.jobTitle}>{job.title}</h2>
            <ScoreBadge score={job.matchScore} />
          </div>
          <p style={styles.jobSub}>{job.company} · {job.location}</p>
        </div>
      </div>

      <div style={styles.tagRow}>
        {job.skills?.map((skill, i) => <SkillChip key={skill} skill={skill} index={i} />)}
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Why This Job is a Match</p>
        <p style={styles.sectionText}>{job.whyMatch}</p>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Required Skills</p>
        <p style={styles.sectionHint}>Skills that you prefer have been highlighted</p>
        <div style={styles.tagRow}>
          {job.requiredSkills?.map((skill, i) => <SkillChip key={skill} skill={skill} index={i} />)}
        </div>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Keyword Match</p>
        <p style={styles.sectionText}>
          Your resume has{' '}
          <strong style={{ color: '#111827' }}>
            {job.keywordMatch?.matched} out of {job.keywordMatch?.total} ({Math.round((job.keywordMatch?.matched / job.keywordMatch?.total) * 100)}%)
          </strong>{' '}
          keywords that appear in the job description.
        </p>
      </div>

      <div style={styles.actions}>
        <button style={styles.savedBtn} onClick={() => onToggleSave(job)} disabled={saving}>
          {saving ? 'Saving...' : job.saved ? 'Saved' : 'Save'}
        </button>
        <button style={styles.applyBtn} onClick={() => onApply(job)}>Apply</button>
      </div>
    </div>
  );
}

export default function JobMatches() {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResume, setShowResume] = useState(false);
  const [savingJobKey, setSavingJobKey] = useState('');

  const toggleType = (type) =>
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

  const onResumeFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setResumeFile(null);
      return;
    }

    const isPdfMime = file.type === 'application/pdf';
    const isPdfName = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfMime && !isPdfName) {
      setError('Please upload a PDF file.');
      setResumeFile(null);
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setError('Resume PDF must be 5MB or smaller.');
      setResumeFile(null);
      event.target.value = '';
      return;
    }

    setError('');
    setResumeFile(file);
  };

  const findMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('jobType', selectedTypes.join(', '));
      formData.append('location', location);
      formData.append('experienceLevel', experienceLevel);
      formData.append('resumeText', resumeText);
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await api.post('/job-matches/find', formData);
      setJobs(res.data.jobs);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to find matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onToggleSave = async (job) => {
    if (!job?.jobKey || savingJobKey) return;
    setSavingJobKey(job.jobKey);
    setError('');

    const previousJobs = jobs;
    const nextSavedValue = !job.saved;

    setJobs((prev) =>
      prev.map((item) =>
        item.jobKey === job.jobKey ? { ...item, saved: nextSavedValue } : item
      )
    );

    try {
      if (nextSavedValue) {
        await api.post('/job-matches/save', {
          title: job.title,
          company: job.company,
          location: job.location,
          matchScore: job.matchScore,
          jobUrl: job.jobUrl,
          skills: job.skills,
          requiredSkills: job.requiredSkills,
          whyMatch: job.whyMatch,
          keywordMatch: job.keywordMatch,
        });
      } else {
        await api.delete(`/job-matches/save/${encodeURIComponent(job.jobKey)}`);
      }
    } catch (err) {
      setJobs(previousJobs);
      setError(err?.response?.data?.error || 'Failed to update saved job.');
    } finally {
      setSavingJobKey('');
    }
  };

  const onApply = (job) => {
    const fallbackQuery = `${job.title || ''} ${job.company || ''} jobs`.trim();
    const targetUrl = job.jobUrl || `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Upload Your Resume</h1>
            <p style={styles.pageSubtitle}>Get personalized job matches based on your skills and experience.</p>
          </div>
          <button style={styles.uploadBtn} onClick={() => setShowResume(!showResume)}>
            + Upload Resume
          </button>
        </div>

        {showResume && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Resume Input</h3>
            <textarea
              style={styles.textarea}
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
            />
            <div style={styles.fileUploadSection}>
              <label style={styles.fileUploadLabel} htmlFor="resumePdf">
                Or upload PDF (max 5MB)
              </label>
              <input
                id="resumePdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={onResumeFileChange}
                style={styles.fileInput}
              />
              {resumeFile && (
                <p style={styles.fileSelected}>
                  Selected: {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
        )}

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Job Preferences</h3>
          <p style={styles.prefLabel}>Job Type</p>
          <div style={styles.typeRow}>
            {JOB_TYPES.map(type => (
              <span
                key={type}
                style={{ ...styles.typeTag, ...(selectedTypes.includes(type) ? styles.typeTagActive : {}) }}
                onClick={() => toggleType(type)}
              >
                {type}
              </span>
            ))}
          </div>
          <div style={styles.controls}>
            <select style={styles.select} value={location} onChange={e => setLocation(e.target.value)}>
              <option value="">Select Location</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select style={styles.select} value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
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
            <h3 style={styles.resultsTitle}>Your Job Matches ({jobs.length})</h3>
            {jobs.map((job) => (
              <JobCard
                key={job.jobKey || `${job.company}-${job.title}-${job.location}`}
                job={job}
                onToggleSave={onToggleSave}
                onApply={onApply}
                saving={savingJobKey === job.jobKey}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#F3F4F6' },
  main: { marginLeft: '220px', padding: '40px 48px', flex: 1, maxWidth: '860px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  pageTitle: { margin: '0 0 6px', fontSize: '26px', fontWeight: '700', color: '#111827', textAlign: 'left' },
  pageSubtitle: { margin: 0, fontSize: '14px', color: '#6B7280', textAlign: 'left' },
  uploadBtn: { backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' },
  card: { backgroundColor: '#fff', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px' },
  cardTitle: { margin: '0 0 18px', fontSize: '16px', fontWeight: '600', color: '#111827', textAlign: 'left' },
  textarea: { width: '100%', height: '160px', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', color: '#374151' },
  fileUploadSection: { marginTop: '16px' },
  fileUploadLabel: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151', textAlign: 'left' },
  fileInput: { display: 'block', fontSize: '14px', color: '#374151' },
  fileSelected: { margin: '8px 0 0', fontSize: '13px', color: '#4B5563', textAlign: 'left' },
  prefLabel: { margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#374151', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' },
  typeRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' },
  typeTag: { padding: '6px 16px', borderRadius: '20px', border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: '13px', color: '#374151', backgroundColor: '#fff' },
  typeTagActive: { backgroundColor: '#2563EB', color: '#fff', borderColor: '#2563EB' },
  controls: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  select: { padding: '9px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#374151', backgroundColor: '#fff', outline: 'none' },
  findBtn: { backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  error: { color: '#DC2626', fontSize: '14px', marginBottom: '16px', textAlign: 'left' },
  resultsTitle: { fontSize: '17px', fontWeight: '600', color: '#111827', margin: '0 0 14px', textAlign: 'left' },
  jobCard: { backgroundColor: '#fff', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' },
  jobHeader: { display: 'flex', gap: '16px', marginBottom: '14px', alignItems: 'center' },
  logoImg: { width: '48px', height: '48px', borderRadius: '10px', objectFit: 'contain', border: '1px solid #F3F4F6', padding: '4px', flexShrink: 0 },
  logoBox: { width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoLetter: { color: '#fff', fontSize: '20px', fontWeight: '700' },
  jobMeta: { flex: 1 },
  jobTitleRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px', flexWrap: 'wrap' },
  jobTitle: { margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827', textAlign: 'left' },
  scoreBadge: { color: '#fff', padding: '3px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', flexShrink: 0 },
  jobSub: { margin: 0, fontSize: '14px', color: '#6B7280', textAlign: 'left' },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' },
  skillChip: { padding: '4px 12px', borderRadius: '20px', border: '1px solid', fontSize: '13px', fontWeight: '500' },
  divider: { height: '1px', backgroundColor: '#F3F4F6', margin: '18px 0' },
  section: { marginBottom: '18px' },
  sectionTitle: { margin: '0 0 5px', fontSize: '14px', fontWeight: '600', color: '#111827', textAlign: 'left' },
  sectionHint: { margin: '0 0 10px', fontSize: '12px', color: '#9CA3AF', textAlign: 'left' },
  sectionText: { margin: 0, fontSize: '14px', color: '#6B7280', lineHeight: '1.6', textAlign: 'left' },
  actions: { display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' },
  savedBtn: { padding: '9px 24px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer', backgroundColor: '#fff', fontSize: '14px', color: '#374151', fontWeight: '500' },
  applyBtn: { padding: '9px 28px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
};
