import React, { useState, useEffect } from 'react';
import { getDocuments } from '../services/documentService';
import { getAvailableModels } from '../services/chatService';
import { generateFlashcards } from '../services/flashcardService';
import LoadingIndicator from './LoadingIndicator';

const FlashcardModal = ({ notebookId, isOpen, onClose, onGenerateSuccess }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      
      fetchData();
    } else {
      
      setSelectedDocIds(new Set());
      setError('');
    }
  }, [isOpen, notebookId]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');

    try {
      
      const docsResponse = await getDocuments(notebookId);
      const processedDocs = docsResponse.data.filter(doc => doc.processed);
      setDocuments(processedDocs || []);

      
      const modelsResponse = await getAvailableModels();
      const fetchedModels = modelsResponse.data || [];
      setAvailableModels(fetchedModels);
      if (fetchedModels.length > 0) {
        setSelectedModel(fetchedModels[0].id); 
      }
    } catch (err) {
      console.error('Error fetching data for flashcard modal:', err);
      setError('Failed to load documents or AI models. Please check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  const handleDocSelectionChange = (docId) => {
    setSelectedDocIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleGenerateFlashcards = async () => {
    if (selectedDocIds.size === 0) {
      setError('Please select at least one document.');
      return;
    }

    setError('');
    setIsGenerating(true);
    
    try {
      const payload = {
        selectedDocumentIds: Array.from(selectedDocIds),
        model: selectedModel
      };
      
      const response = await generateFlashcards(notebookId, payload);
      
      if (response.success && response.data) {
        onGenerateSuccess(response.data);
        onClose();
      } else {
        setError('Failed to generate flashcards. Please try again.');
      }
    } catch (err) {
      console.error('Error generating flashcards:', err);
      const errorMessage = err.response?.data?.message || 'Failed to generate flashcards. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content flashcard-modal">
        <div className="modal-header">
          <h2>Generate Flashcards</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {isLoading ? (
            <div className="modal-loading">
              <LoadingIndicator />
              <p>Loading documents and models...</p>
            </div>
          ) : (
            <>
              <div className="modal-section">
                <h3>1. Select Documents</h3>
                <p className="modal-instruction">Choose documents to generate flashcards from:</p>
                
                {documents.length === 0 ? (
                  <div className="document-list-empty">
                    <p>No processed documents available in this notebook.</p>
                  </div>
                ) : (
                  <div className="document-selection-list">
                    {documents.map(doc => (
                      <div key={doc._id} className="document-selection-item">
                        <label>
                          <input 
                            type="checkbox"
                            checked={selectedDocIds.has(doc._id)}
                            onChange={() => handleDocSelectionChange(doc._id)}
                          />
                          {doc.originalFilename}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-section">
                <h3>2. Select AI Model</h3>
                <p className="modal-instruction">Choose which AI model to use for flashcard generation:</p>
                
                {availableModels.length === 0 ? (
                  <div className="model-list-empty">
                    <p>No AI models available. Please check your API key in account settings.</p>
                  </div>
                ) : (
                  <div className="model-selection">
                    <select 
                      value={selectedModel} 
                      onChange={handleModelChange}
                      className="model-select"
                    >
                      {availableModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <div className="modal-error">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-cancel-btn" 
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button 
            className="modal-generate-btn" 
            onClick={handleGenerateFlashcards}
            disabled={isLoading || isGenerating || selectedDocIds.size === 0 || !selectedModel}
          >
            {isGenerating ? 'Generating...' : 'Generate Flashcards'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FlashcardModal;
