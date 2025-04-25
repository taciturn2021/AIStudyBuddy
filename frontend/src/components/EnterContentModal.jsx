import React, { useState, useEffect } from 'react';
import { saveTextDocument } from '../services/documentService'; // We'll add this service function next

function EnterContentModal({ notebookId, isOpen, onClose, onSaveSuccess }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Document title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await saveTextDocument(notebookId, { title: title.trim(), content: content.trim() });
      onSaveSuccess(); // Call the success handler passed from NotebookPage
    } catch (err) {
      console.error('Error saving text document:', err);
      setError(err.response?.data?.message || 'Failed to save content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalContentClick = (e) => {
    e.stopPropagation(); // Prevent clicks inside modal from closing it
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleModalContentClick}>
        <div className="modal-header">
          <h2>Enter Text Content</h2>
          <button className="modal-close-btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSave} className="enter-content-form">
            <div className="form-group">
              <label htmlFor="documentTitle">Document Title</label>
              <input
                type="text"
                id="documentTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this content"
                required
                autoFocus
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="documentContent">Content</label>
              <textarea
                id="documentContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or type your content here..."
                rows={10}
                required
                disabled={isLoading}
              />
            </div>
            {error && <div className="alert alert-warning" style={{ marginTop: '1rem' }}>{error}</div>}
            <div className="modal-actions">
              <button type="button" className="form-btn-cancel" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className={`form-btn-submit ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Content'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Basic styling for the text entry modal */}
      <style>{`
        .enter-content-form textarea {
          width: 100%;
          min-height: 200px; /* Adjust as needed */
          resize: vertical;
          font-family: inherit;
          font-size: 0.95rem;
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  );
}

export default EnterContentModal; 