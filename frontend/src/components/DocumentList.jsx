import React, { useState, useEffect } from 'react';
import { getDocuments, deleteDocument } from '../services/documentService';

function DocumentList({ notebookId, documentListChanged }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [notebookId, documentListChanged]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await getDocuments(notebookId);
      setDocuments(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (documentId) => {
    setDeleteConfirmation(documentId);
  };

  const handleConfirmDelete = async (documentId) => {
    try {
      await deleteDocument(notebookId, documentId);
      setDocuments(documents.filter(doc => doc._id !== documentId));
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="document-list-loading">
        <div className="spinner"></div>
        <p>Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-list-error">
        <div className="error-message">{error}</div>
        <button onClick={fetchDocuments} className="retry-btn">Try Again</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-documents">
        <p>No documents have been uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="document-list">
      <h3>Uploaded Documents</h3>
      <div className="document-items">
        {documents.map(doc => (
          <div key={doc._id} className="document-item">
            <div className="document-icon">📄</div>
            <div className="document-details">
              <div className="document-name">{doc.originalFilename}</div>
              <div className="document-meta">
                <span>{formatDate(doc.uploadDate)}</span>
                <span>{formatFileSize(doc.fileSize)}</span>
                <span className={`document-status ${doc.processed ? 'processed' : 'processing'}`}>
                  {doc.processed ? 'Processed' : 'Processing...'}
                </span>
              </div>
            </div>
            <div className="document-actions">
              {deleteConfirmation === doc._id ? (
                <div className="delete-confirmation">
                  <p>Delete this document?</p>
                  <div className="confirmation-buttons">
                    <button 
                      className="btn-confirm" 
                      onClick={() => handleConfirmDelete(doc._id)}
                    >
                      Yes, Delete
                    </button>
                    <button 
                      className="btn-cancel" 
                      onClick={cancelDelete}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteClick(doc._id)}
                    title="Delete Document"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocumentList; 