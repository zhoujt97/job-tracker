import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Star, FileText } from 'lucide-react';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Job Matches', path: '/job-matches', icon: Star },
    { label: 'Interview Preparation', path: '/interview-prep', icon: FileText },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.top}>
        <div style={styles.logo}>
          <div style={styles.logoIcon} />
          <span style={styles.logoText}>Job Tracker</span>
        </div>
        <nav style={styles.nav}>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                style={{
                  ...styles.navItem,
                  ...(location.pathname === item.path ? styles.navItemActive : {}),
                }}
                onClick={() => navigate(item.path)}
              >
                <Icon size={16} />
                {item.label}
              </div>
            );
          })}
        </nav>
      </div>
      <div style={styles.bottom}>
        <div style={styles.userRow}>
          <div style={styles.userAvatar}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <span style={styles.username}>{user?.username}</span>
        </div>
        <div style={styles.logout} onClick={handleLogout}>Logout</div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: { width: '240px', height: '100vh', backgroundColor: '#fff', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px 16px', boxSizing: 'border-box', position: 'fixed' },
  top: { display: 'flex', flexDirection: 'column', gap: '32px' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1a56db' },
  logoText: { fontWeight: '600', fontSize: '16px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px' },
  navItem: { padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', color: '#555', display: 'flex', alignItems: 'center', gap: '10px' },
  navItemActive: { backgroundColor: '#EFF6FF', color: '#1a56db', fontWeight: '600' },
  bottom: { display: 'flex', flexDirection: 'column', gap: '8px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#c0392b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' },
  username: { fontSize: '14px' },
  logout: { fontSize: '14px', cursor: 'pointer', color: '#555', paddingLeft: '4px' },
};

export default Sidebar;