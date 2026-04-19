import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import JobMatches from './pages/JobMatches';
import InterviewPrep from './pages/InterviewPrep';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/analysis" element={<PrivateRoute><Analysis /></PrivateRoute>} />
      <Route path="/job-matches" element={<PrivateRoute><JobMatches /></PrivateRoute>} />
      <Route path="/interview-prep" element={<PrivateRoute><InterviewPrep /></PrivateRoute>} />
    </Routes>
  );
}

export default App;