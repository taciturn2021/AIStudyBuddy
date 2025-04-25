import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotebookList from '../components/NotebookList';
import CreateNotebookForm from '../components/CreateNotebookForm';
import { getNotebooks, createNotebook, deleteNotebook } from '../services/notebookService';

function DashboardPage() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notebooks, setNotebooks] = useState([]);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get a personalized greeting based on time of day
  useEffect(() => {
    // Check if user is logged in
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    };
    
    // Fetch notebooks
    const fetchNotebooks = async () => {
      try {
        const response = await getNotebooks();
        setNotebooks(response.data);
      } catch (err) {
        setError('Failed to load notebooks. Please try again later.');
        console.error('Error fetching notebooks:', err);
      } finally {
        setGreeting(getGreeting());
        setIsLoading(false);
      }
    };
    
    fetchNotebooks();
  }, [navigate]);

  const handleCreateNotebook = async (notebookData) => {
    setIsLoading(true);
    try {
      const response = await createNotebook(notebookData);
      setNotebooks([response.data, ...notebooks]);
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create notebook. Please try again.');
      console.error('Error creating notebook:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotebook = async (id) => {
    setIsLoading(true);
    try {
      await deleteNotebook(id);
      setNotebooks(notebooks.filter(notebook => notebook._id !== id));
    } catch (err) {
      setError('Failed to delete notebook. Please try again.');
      console.error('Error deleting notebook:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Add slight delay for better UX
    setIsLoading(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      navigate('/login');
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="dashboard-container loading-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading your study dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>AI Study Buddy</h1>
        <button onClick={handleLogout} className="header-logout-btn">
          Logout
        </button>
      </div>
      
      <div className="greeting-card">
        <h2>{greeting}, Scholar!</h2>
        <p>Your personalized learning journey awaits.</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="main-content">
        <div className="notebooks-section">
          <div className="section-header">
            <h2>Your Notebooks</h2>
            {!showCreateForm && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-create"
              >
                Create New Notebook
              </button>
            )}
          </div>
          
          {showCreateForm ? (
            <CreateNotebookForm 
              onSubmit={handleCreateNotebook}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : (
            <NotebookList 
              notebooks={notebooks} 
              onDelete={handleDeleteNotebook}
            />
          )}
        </div>
        
        <div className="features-sidebar">
          <h3>Available Tools</h3>
          <div className="note">⚠️ Create a notebook  to access these features</div>
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">📄</div>
              <div className="feature-text">
                <h4>Content Ingestion</h4>
                <p>Upload or paste learning materials</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">🔍</div>
              <div className="feature-text">
                <h4>Flashcards</h4>
                <p>Create smart study flashcards</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">💬</div>
              <div className="feature-text">
                <h4>Interactive Q&A</h4>
                <p>Ask questions about your content</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <h4>Quiz Generator</h4>
                <p>Test your knowledge</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
