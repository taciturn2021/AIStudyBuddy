import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getNotebook, updateNotebook } from '../services/notebookService';
import UploadModal from '../components/UploadModal';
import DocumentList from '../components/DocumentList';
import EnterContentModal from '../components/EnterContentModal';

function NotebookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEnterContentModalOpen, setIsEnterContentModalOpen] = useState(false);
  const [documentListChanged, setDocumentListChanged] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    const fetchNotebook = async () => {
      try {
        const response = await getNotebook(id);
        const notebookData = response.data;
        setNotebook(notebookData);
        setTitle(notebookData.title);
        setDescription(notebookData.description || '');
      } catch (err) {
        setError('Failed to load notebook. Please try again later.');
        console.error('Error fetching notebook:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotebook();
  }, [id, navigate]);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const updatedData = { title, description };
      const response = await updateNotebook(id, updatedData);
      setNotebook(response.data);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update notebook. Please try again.');
      console.error('Error updating notebook:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleEnterContentClick = () => {
    setIsEnterContentModalOpen(true);
  };

  const handleAiAssistantClick = () => {
    navigate(`/notebook/${id}/chat`);
  };

  const handleUploadSuccess = () => {
    setDocumentListChanged(prev => prev + 1);
    setIsUploadModalOpen(false);
  };

  const handleSaveTextSuccess = () => {
    setDocumentListChanged(prev => prev + 1);
    setIsEnterContentModalOpen(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="notebook-page loading-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading notebook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notebook-page error-container">
        <div className="error-message">{error}</div>
        <Link to="/dashboard" className="btn-back">Back to Dashboard</Link>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="notebook-page error-container">
        <div className="error-message">Notebook not found</div>
        <Link to="/dashboard" className="btn-back">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="notebook-page">
      <Link to="/dashboard" className="btn-back" style={{ marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Dashboard
      </Link>
      <div className="notebook-header">
        <div className="header-left">
          {isEditing ? (
            <div className="edit-title-container">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="edit-title-input"
                placeholder="Notebook title"
                autoFocus
              />
            </div>
          ) : (
            <h1>{notebook.title}</h1>
          )}
        </div>
        <div className="header-right">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSaveChanges} className="btn-save">
                Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="btn-edit">
              Edit Notebook
            </button>
          )}
        </div>
      </div>

      <div className="notebook-info">
        <div className="notebook-dates">
          <span>Created: {formatDate(notebook.createdAt)}</span>
          <span>Last updated: {formatDate(notebook.lastUpdated)}</span>
        </div>
        
        {isEditing ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="edit-description-textarea"
            rows={3}
          />
        ) : (
          <p className="notebook-description">
            {notebook.description || 'First notebook'}
          </p>
        )}
      </div>

      <div className="notebook-content">
        <h2>Study Tools</h2>
        <div className="tool-buttons">
          <button className="tool-btn upload-btn" onClick={handleUploadClick}>
            <span className="tool-icon">📄</span>
            <span className="tool-label">Upload PDF</span>
          </button>
          <button className="tool-btn text-entry-btn" onClick={handleEnterContentClick}>
            <span className="tool-icon">✏️</span>
            <span className="tool-label">Enter Content</span>
          </button>
          <button className="tool-btn flashcards-btn">
            <span className="tool-icon">🔍</span>
            <span className="tool-label">Generate Flashcards</span>
          </button>
          <button className="tool-btn quiz-btn">
            <span className="tool-icon">📝</span>
            <span className="tool-label">Create Quiz</span>
          </button>
          <button className="tool-btn assistant-btn" onClick={handleAiAssistantClick}>
            <span className="tool-icon">💬</span>
            <span className="tool-label">Ask AI Assistant</span>
          </button>
        </div>

        <div className="documents-section">
          <DocumentList 
            notebookId={id} 
            documentListChanged={documentListChanged} 
          />
        </div>

        <UploadModal 
          notebookId={id}
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
        
        <EnterContentModal 
          notebookId={id}
          isOpen={isEnterContentModalOpen}
          onClose={() => setIsEnterContentModalOpen(false)}
          onSaveSuccess={handleSaveTextSuccess}
        />
      </div>
    </div>
  );
}

export default NotebookPage;