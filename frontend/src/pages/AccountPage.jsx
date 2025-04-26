import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updatePassword, updateGeminiKey, removeGeminiKey, getAccountStatus } from '../services/accountService';
import LoadingIndicator from '../components/LoadingIndicator';

function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isGeminiKeySet, setIsGeminiKeySet] = useState(false);
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [geminiMessage, setGeminiMessage] = useState({ type: '', text: '' });
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      try {
        const response = await getAccountStatus();
        setIsGeminiKeySet(response.data.isGeminiKeySet);
        setStatusError('');
      } catch (err) {
        setStatusError('Failed to load account status.');
        console.error('Error fetching status:', err);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await updatePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: response.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGeminiSubmit = async (e) => {
    e.preventDefault();
    setGeminiMessage({ type: '', text: '' });

    if (!geminiApiKey) {
      setGeminiMessage({ type: 'error', text: 'Please enter your Gemini API Key' });
      return;
    }

    setGeminiLoading(true);
    try {
      const response = await updateGeminiKey({ geminiApiKey });
      setGeminiMessage({ type: 'success', text: response.message });
      setIsGeminiKeySet(true);
      setGeminiApiKey('');
    } catch (err) {
      setGeminiMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save Gemini API Key' });
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleRemoveGeminiKey = async () => {
    if (!window.confirm('Are you sure you want to remove your Gemini API Key? AI features will be limited without it.')) {
      return;
    }

    setGeminiLoading(true);
    try {
      const response = await removeGeminiKey();
      setGeminiMessage({ type: 'success', text: response.message });
      setIsGeminiKeySet(false);
    } catch (err) {
      setGeminiMessage({ type: 'error', text: err.response?.data?.message || 'Failed to remove Gemini API Key' });
    } finally {
      setGeminiLoading(false);
    }
  };

  return (
    <div className="page account-page">
      <Link to="/dashboard" className="btn-back" style={{ marginBottom: '1.5rem' }}>
        ← Back to Dashboard
      </Link>
      <h1>Account Management</h1>

      <div className="account-section">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="auth-form account-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input 
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
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
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input 
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {passwordMessage.text && (
            <div className={`alert alert-${passwordMessage.type === 'error' ? 'warning' : 'info'}`}>
              {passwordMessage.text}
            </div>
          )}
          <button type="submit" disabled={passwordLoading} className={`form-btn-submit ${passwordLoading ? 'loading' : ''}`}>
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="account-section">
        <h2>Gemini API Key</h2>
        {statusLoading ? (
          <LoadingIndicator />
        ) : statusError ? (
            <div className="alert alert-warning">{statusError}</div>
        ) : (
          <p className="api-key-status">
            Status: {isGeminiKeySet ? 
              <span className="status-set">Key is set and saved securely.</span> : 
              <span className="status-not-set">Key is not set. AI features may be limited.</span>}
          </p>
        )}
        
        <form onSubmit={handleGeminiSubmit} className="auth-form account-form">
          <div className="form-group">
            <label htmlFor="geminiApiKey">{isGeminiKeySet ? 'Update' : 'Enter'} Gemini API Key</label>
            <input 
              type="password"
              id="geminiApiKey"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Enter your Google AI Studio API Key"
              required
            />
            <small className="form-text">Your key will be encrypted before storage. Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>. (its free!)</small>
          </div>
          {geminiMessage.text && (
            <div className={`alert alert-${geminiMessage.type === 'error' ? 'warning' : 'info'}`}>
              {geminiMessage.text}
            </div>
          )}
          <div className="form-buttons">
            <button type="submit" disabled={geminiLoading || statusLoading} className={`form-btn-submit ${geminiLoading ? 'loading' : ''}`}>
              {geminiLoading ? 'Saving...' : 'Save API Key'}
            </button>
            {isGeminiKeySet && (
              <button 
                type="button"
                onClick={handleRemoveGeminiKey} 
                disabled={geminiLoading || statusLoading} 
                className="form-btn-remove"
              >
                Remove API Key
              </button>
            )}
          </div>
        </form>
      </div>
      
      <style jsx>{`
        .account-page {
          max-width: 700px;
          margin: 2rem auto;
        }
        .account-section {
          background-color: #fff;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .account-section h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.75rem;
        }
        .account-form {
          max-width: none;
          padding: 0;
        }
        .api-key-status {
          margin-bottom: 1rem;
          font-size: 0.95rem;
        }
        .status-set {
          color: #10b981; 
          font-weight: 500;
        }
        .status-not-set {
          color: #f59e0b; 
          font-weight: 500;
        }
        .form-text {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #64748b;
        }
        .form-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .form-btn-remove {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #fff;
          color: #dc2626;
          border: 1px solid #dc2626;
        }
        .form-btn-remove:hover:not(:disabled) {
          background-color: #fee2e2;
        }
        .form-btn-remove:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default AccountPage;