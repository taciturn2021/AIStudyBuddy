import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [secretKey, setSecretKey] = useState(null);
  const [showKeyConfirmation, setShowKeyConfirmation] = useState(false);
  const [enteredKey, setEnteredKey] = useState('');
  const [keyConfirmationError, setKeyConfirmationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSecretKey(null);
    setShowKeyConfirmation(false);
    setKeyConfirmationError('');    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        username,
        password,
      });
      
      setTimeout(() => {
        setIsLoading(false);
        setSecretKey(response.data.resetKey);
        setShowKeyConfirmation(true);
      }, 600);
      
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    }
  };

  const handleKeyConfirmation = (e) => {
    e.preventDefault();
    setKeyConfirmationError('');
    setIsConfirming(true);
    
    setTimeout(() => {
      if (enteredKey === secretKey) {
        navigate('/login'); 
      } else {
        setIsConfirming(false);
        setKeyConfirmationError('The entered key does not match. Please try again.');
      }
    }, 400);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secretKey);
    const keyDisplay = document.querySelector('.secret-key-display');
    keyDisplay.classList.add('copied');
    setTimeout(() => keyDisplay.classList.remove('copied'), 1000);
  };

  if (showKeyConfirmation) {
    return (
      <div className="auth-container confirmation-container">
        <h2>Registration Successful!</h2>
        <p className="important-notice">
          <strong>IMPORTANT:</strong> Please save this secret key securely. 
          You will need it to recover your account if you forget your password. 
          <strong>This key will only be shown once.</strong>
        </p>
        <div className="secret-key-display" onClick={copyToClipboard} title="Click to copy">
          <code>{secretKey}</code>
          <span className="copy-hint">Click to copy</span>
        </div>
        <p>Please write down the key above and enter it below to confirm you have saved it.</p>
        <form onSubmit={handleKeyConfirmation} className="auth-form">
          <div className="form-group">
            <label htmlFor="confirmKey">Confirm Secret Key</label>
            <input
              type="text"
              id="confirmKey"
              value={enteredKey}
              onChange={(e) => setEnteredKey(e.target.value)}
              required
              autoFocus
              disabled={isConfirming}
            />
          </div>
          {keyConfirmationError && <p className="error-message">{keyConfirmationError}</p>}
          <button type="submit" disabled={isConfirming} className={isConfirming ? 'loading' : ''}>
            {isConfirming ? 'Verifying...' : 'Confirm and Continue'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>Create Account</h2>
      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
          {isLoading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
