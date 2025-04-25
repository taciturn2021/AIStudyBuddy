import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [resetKey, setResetKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [foundUsername, setFoundUsername] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: '' };
    
    let score = 0;
    let feedback = '';
    
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
    }
    
    if (/\d/.test(password)) score += 1;
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    
    if (score < 2) {
      feedback = 'Weak: Try adding numbers, special characters, and mixing case';
    } else if (score < 4) {
      feedback = 'Medium: Good start, but could be stronger';
    } else {
      feedback = 'Strong: Good job!';
    }
    
    return { score, feedback };
  };
  
  useEffect(() => {
    const { score, feedback } = calculatePasswordStrength(newPassword);
    setPasswordStrength(score);
    setPasswordFeedback(feedback);
  }, [newPassword]);
  
  const handleFindAccount = async (e) => {
    e.preventDefault();
    setError('');
    setDebugInfo(null);
    
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Sending request to check username:', username);
      
      const response = await axios.post('http://localhost:5000/api/auth/check-username', {
        username: username.trim()
      });
      
      console.log('Username check response:', response.data);
      
      setFoundUsername(username.trim());
      
      setTimeout(() => {
        setIsLoading(false);
        setStep(2);
      }, 500);
    } catch (err) {
      setIsLoading(false);
      
      console.error('Username check error:', err);
      
      setDebugInfo({
        errorMessage: err.message,
        statusCode: err.response?.status,
        responseData: err.response?.data,
        requestData: { username: username.trim() }
      });
      
      if (err.response && err.response.status === 404) {
        setError('No account found with this username. Please check and try again.');
      } else if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Error finding account. Please try again.');
      }
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setDebugInfo(null);
    
    if (!resetKey.trim()) {
      setError('Please enter your secret reset key');
      return;
    }
    
    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (passwordStrength < 2) {
      setError('Please use a stronger password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Sending password reset request for user:', foundUsername);
      
      const response = await axios.post('http://localhost:5000/api/auth/resetpassword', {
        username: foundUsername,
        resetKey: resetKey.trim(),
        newPassword
      });
      
      console.log('Password reset response:', response.data);
      
      setTimeout(() => {
        setIsLoading(false);
        setResetSuccess(true);
        
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        if (response.data && response.data.resetKey) {
        }
      }, 600);
    } catch (err) {
      setIsLoading(false);
      
      console.error('Password reset error:', err);
      
      setDebugInfo({
        errorMessage: err.message,
        statusCode: err.response?.status,
        responseData: err.response?.data,
        requestData: { username: foundUsername, resetKeyLength: resetKey.length }
      });
      
      if (err.response && err.response.status === 401) {
        setError('Invalid reset key. Please check and try again.');
      } else if (err.response) {
        setError(err.response?.data?.message || 'Password reset failed. Please try again.');
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Password reset failed. Please try again.');
      }
    }
  };
  
  if (resetSuccess) {
    return (
      <div className="auth-container password-reset-container">
        <h2>Password Reset Successful</h2>
        <div className="reset-success">
          <span className="reset-success-icon">✓</span>
          Your password has been successfully reset!
        </div>
        <p>You can now log in with your new password.</p>
        <button onClick={() => navigate('/login')} className="mt-4">
          Go to Login
        </button>
      </div>
    );
  }
  
  return (
    <div className="auth-container password-reset-container">
      <h2>Reset Your Password</h2>
      
      {step === 1 && (
        <>
          <p className="reset-info">
            Enter your username below to start the password reset process.
          </p>
          
          <div className="alert alert-info">
            You will need the secret key that was provided when you registered your account.
          </div>
          
          <form onSubmit={handleFindAccount} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" disabled={isLoading} className={`form-btn-submit ${isLoading ? 'loading' : ''}`}>
              {isLoading ? 'Finding Account...' : 'Find Account'}
            </button>
          </form>
        </>
      )}
      
      {step === 2 && (
        <>
          <p className="reset-info">
            Account found for <strong>{foundUsername}</strong>.
          </p>
          <p className="reset-info">
            Enter your secret reset key and set a new password.
          </p>
          
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="resetKey">Secret Reset Key</label>
              <input
                type="text"
                id="resetKey"
                value={resetKey}
                onChange={(e) => setResetKey(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <div className={`password-strength-meter strength-${passwordStrength}`}>
                <div className="strength-bar"></div>
              </div>
              <div className="password-feedback">
                {passwordFeedback}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" disabled={isLoading} className={`form-btn-submit ${isLoading ? 'loading' : ''}`}>
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
      
      {debugInfo && (
        <div className="debug-info">
          <h4>Debug Information</h4>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
      
      <div className="auth-links">
        <p>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;