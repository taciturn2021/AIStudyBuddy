import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const NotebookList = ({ notebooks, onDelete }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = (e) => {
    e.stopPropagation();
    onDelete(deletingId);
    setDeletingId(null);
  };

  const cancelDelete = (e) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  if (!notebooks || notebooks.length === 0) {
    return (
      <div className="empty-notebooks">
        <p>You don't have any notebooks yet.</p>
        <button 
          className="btn-create" 
          onClick={() => document.querySelector('.section-header .btn-create').click()}
        >
          Create your first notebook
        </button>
      </div>
    );
  }

  return (
    <div className="notebook-list">
      {notebooks.map((notebook) => (
        <div 
          key={notebook._id} 
          className={`notebook-card ${expandedId === notebook._id ? 'expanded' : ''}`}
        >
          <div className="notebook-header" onClick={() => toggleExpand(notebook._id)}>
            <div className="notebook-header-left">
              <h3>{notebook.title}</h3>
              <div className="notebook-meta">
                <span>Last updated: {formatDate(notebook.lastUpdated)}</span>
              </div>
            </div>
            <div className="notebook-expand-icon">
              {expandedId === notebook._id ? '−' : '+'}
            </div>
          </div>
          
          {expandedId === notebook._id && (
            <div className="notebook-details">
              <p className="notebook-description">
                {notebook.description || 'First notebook'}
              </p>
              <div className="notebook-actions">
                {deletingId === notebook._id ? (
                  <div className="delete-confirmation">
                    <p>Are you sure?</p>
                    <div className="confirmation-buttons">
                      <button 
                        onClick={confirmDelete} 
                        className="btn-confirm"
                      >
                        Yes, delete
                      </button>
                      <button 
                        onClick={cancelDelete} 
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link to={`/notebook/${notebook._id}`} className="btn-open">
                      Open Notebook
                    </Link>
                    <button 
                      onClick={(e) => handleDeleteClick(e, notebook._id)} 
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotebookList; 