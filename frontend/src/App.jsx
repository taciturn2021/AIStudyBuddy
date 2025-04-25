import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotebookPage from './pages/NotebookPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AccountPage from './pages/AccountPage';
import AiAssistantPage from './pages/AiAssistantPage';
import './App.css'

function PrivateRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  const chatRouteMatch = useMemo(() => {
    const match = location.pathname.match(/^\/notebook\/([\w-]+)\/chat$/);
    return match ? { isMatch: true, notebookId: match[1] } : { isMatch: false };
  }, [location.pathname]);

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === "fadeOut") {
      setTransitionStage("fadeIn");
      setDisplayLocation(location);
    }
  };

  return (
    <div className="App">
      {chatRouteMatch.isMatch ? (
        <PrivateRoute>
          <AiAssistantPage notebookId={chatRouteMatch.notebookId} />
        </PrivateRoute>
      ) : (
        <div 
          className={`page ${transitionStage}`}
          onAnimationEnd={handleAnimationEnd}
        >
          <Routes location={displayLocation}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/notebook/:id"
              element={
                <PrivateRoute>
                  <NotebookPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/account"
              element={
                <PrivateRoute>
                  <AccountPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/"
              element={localStorage.getItem('token') ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
            />
            <Route path="*" element={
              <div className="auth-container">
                <h2>404 Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <Link to="/">Go Home</Link>
              </div>
            } />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default App
