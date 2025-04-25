import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  // Form states
  const [username, setUsername] = useState('');
  const [resetKey, setResetKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [foundUsername, setFoundUsername] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: '' };
    
    let score = 0;
    let feedback = '';
    
    // Length check
    if (password.length >= 12) {
      score += 2;
    } else if (password.length >= 8) {
      score += 1;
    }
    
    // Check for numbers
    if (/\d/.test(password)) score += 1;
    
    // Check for special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // Check for uppercase and lowercase
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    
    // Provide feedback based on score
    if (score < 2) {
      feedback = 'Weak: Try adding numbers, special characters, and mixing case';
    } else if (score < 4) {
      feedback = 'Medium: Good start, but could be stronger';
    } else {
      feedback = 'Strong: Good job!';
    }
    
    return { score, feedback };
  };
  
  // Update password strength when password changes
  useEffect(() => {
    const { score, feedback } = calculatePasswordStrength(newPassword);
    setPasswordStrength(score);
    setPasswordFeedback(feedback);
  }, [newPassword]);
  
  // Step 1: Find account with username
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
      
      // Check if username exists
      const response = await axios.post('http://localhost:5000/api/auth/check-username', {
        username: username.trim() // Ensure we trim any whitespace
      });
      
      console.log('Username check response:', response.data);
      
      // Store the verified username
      setFoundUsername(username.trim());
      
      // If username exists, proceed to next step
      setTimeout(() => {
        setIsLoading(false);
        setStep(2);
      }, 500);
    } catch (err) {
      setIsLoading(false);
      
      console.error('Username check error:', err);
      
      // Save debug info
      setDebugInfo({
        errorMessage: err.message,
        statusCode: err.response?.status,
        responseData: err.response?.data,
        requestData: { username: username.trim() }
      });
      
      // Check for specific error codes
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
  
  // Step 2: Verify reset key and set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setDebugInfo(null);
    
    // Validate inputs
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
        username: foundUsername, // Use the verified username
        resetKey: resetKey.trim(),
        newPassword
      });
      
      console.log('Password reset response:', response.data);
      
      // Set success UI
      setTimeout(() => {
        setIsLoading(false);
        setResetSuccess(true);
        
        // Store new token if provided
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        // Store new reset key if needed
        if (response.data && response.data.resetKey) {
          // You could handle the new key here, e.g., display it to the user
          // or save it securely
        }
      }, 600);
    } catch (err) {
      setIsLoading(false);
      
      console.error('Password reset error:', err);
      
      // Save debug info
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
  
  // If password reset was successful
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
      
      {/* Step 1: Enter username */}
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
                autoFocus
              />
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            {debugInfo && (
              <div className="debug-info">
                <details>
                  <summary>Debug Information</summary>
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </details>
              </div>
            )}
            
            <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
              {isLoading ? 'Processing...' : 'Continue'}
            </button>
          </form>
        </>
      )}
      
      {/* Step 2: Enter reset key and new password */}
      {step === 2 && (
        <>
          <p className="reset-info">
            Enter your secret reset key and choose a new password for <strong>{foundUsername}</strong>.
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
                autoFocus
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
              {newPassword && (
                <div className={`password-strength strength-${passwordStrength}`}>
                  <div className="strength-meter">
                    <div 
                      className="strength-meter-fill" 
                      style={{width: `${Math.min(100, passwordStrength * 20)}%`}}
                    ></div>
                  </div>
                  <div className="strength-text">{passwordFeedback}</div>
                </div>
              )}
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
            
            {error && <p className="error-message">{error}</p>}
            
            {debugInfo && (
              <div className="debug-info">
                <details>
                  <summary>Debug Information</summary>
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </details>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading || newPassword !== confirmPassword || passwordStrength < 2} 
              className={isLoading ? 'loading' : ''}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
      
      <Link to="/login" className="back-link">Back to Login</Link>
    </div>
  );
}

export default ForgotPasswordPage; 