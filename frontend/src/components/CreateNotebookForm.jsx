import React, { useState } from 'react';

const CreateNotebookForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Notebook title is required');
      return;
    }
    
    setError('');
    
    onSubmit({ title, description });
  };
  
  return (
    <div className="create-notebook-form">
      <h2>Create New Notebook</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your notebook"
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will you use this notebook for?"
            rows={4}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="form-btn-cancel"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="form-btn-submit"
          >
            Create Notebook
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNotebookForm; 