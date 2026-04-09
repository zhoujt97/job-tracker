import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const payload = isSignup
        ? { username: form.username, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.avatar} />
        <h2 style={styles.title}>Welcome to Job Tracker</h2>
        <p style={styles.subtitle}>Your job search starts from here</p>

        <h3 style={styles.formTitle}>{isSignup ? 'Sign up' : 'Log in'}</h3>

        {error && <p style={styles.error}>{error}</p>}

        {isSignup && (
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              name="username"
              placeholder="Enter your full name"
              value={form.username}
              onChange={handleChange}
            />
          </div>
        )}

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            name="password"
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <button style={styles.button} onClick={handleSubmit}>
          {isSignup ? 'Sign Up' : 'Log In'}
        </button>

        <p style={styles.toggle}>
          {isSignup ? 'Already have an account? ' : 'New to Job tracker? '}
          <span style={styles.link} onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? 'Log in' : 'Sign up for an account'}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    width: '400px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#ccc',
    marginBottom: '16px',
  },
  title: { margin: '0 0 4px', fontSize: '22px' },
  subtitle: { margin: '0 0 24px', color: '#888', fontSize: '14px' },
  formTitle: { alignSelf: 'flex-start', margin: '0 0 16px' },
  error: { color: 'red', fontSize: '14px', marginBottom: '12px' },
  field: { width: '100%', marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '14px' },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1a56db',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  toggle: { fontSize: '14px', color: '#555' },
  link: { color: '#1a56db', cursor: 'pointer' },
};

export default Login;