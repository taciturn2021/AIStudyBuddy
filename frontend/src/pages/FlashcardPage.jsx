import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getDocuments } from '../services/documentService'; 
import { getAvailableModels } from '../services/chatService';
import { generateFlashcards, getFlashcards, deleteFlashcard } from '../services/flashcardService';
import LoadingIndicator from '../components/LoadingIndicator';
import './FlashcardPage.css';

function FlashcardPage({ notebookId })  {  
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());
  const [flashcards, setFlashcards] = useState([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerateMode, setIsGenerateMode] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const response = await getAvailableModels();
        const fetchedModels = response.data || [];
        setAvailableModels(fetchedModels);
        if (fetchedModels.length > 0) {
          setSelectedModel(fetchedModels[0].id);
        }
      } catch (err) {
        console.error('Error fetching available models:', err);
        setError('Failed to load AI models.');
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (notebookId) {
      setIsLoadingDocs(true);
      setIsLoadingFlashcards(true);
      setError('');

      const fetchDocs = getDocuments(notebookId)
        .then(response => {
          setDocuments(response.data?.filter(doc => doc.processed) || []);
        })
        .catch(err => {
          console.error('Error fetching documents:', err);
          setError(prev => prev ? `${prev}. Failed to load documents.` : 'Failed to load documents.');
        })
        .finally(() => setIsLoadingDocs(false));

      const fetchFlashcards = getFlashcards(notebookId)
        .then(response => {
          setFlashcards(response.data || []);
        })
        .catch(err => {
          console.error('Error fetching flashcards:', err);
          setError(prev => prev ? `${prev}. Failed to load flashcards.` : 'Failed to load flashcards.');
        })
        .finally(() => setIsLoadingFlashcards(false));

      Promise.all([fetchDocs, fetchFlashcards]).catch(err => {
        console.error("Error loading data:", err);
      });
    }
  }, [notebookId]);

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
    setSuccess('');
    setIsGenerating(true);
    
    try {
      const payload = {
        selectedDocumentIds: Array.from(selectedDocIds),
        model: selectedModel
      };
        const response = await generateFlashcards(notebookId, payload);
      
      if (response.success && response.data) {
        const allFlashcardsResponse = await getFlashcards(notebookId);
        const allFlashcards = allFlashcardsResponse.data || [];
        
        setFlashcards(allFlashcards);
        setCurrentFlashcardIndex(0);
        setIsFlipped(false);
        
        setSuccess('Flashcards generated successfully!');
        
        setIsGenerateMode(false);
        
        setTimeout(() => {
          setSuccess('');
        }, 5000);
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

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePrevCard = () => {
    if (currentFlashcardIndex > 0) {
      setCurrentFlashcardIndex(currentFlashcardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNextCard = () => {
    if (currentFlashcardIndex < flashcards.length - 1) {
      setCurrentFlashcardIndex(currentFlashcardIndex + 1);
      setIsFlipped(false);
    }
  };
  const handleDeleteFlashcard = async () => {
    if (!flashcards[currentFlashcardIndex]) return;
    
    if (!window.confirm('Are you sure you want to delete this flashcard?')) {
      return;
    }
    
    const flashcardId = flashcards[currentFlashcardIndex]._id;
    setIsDeleting(true);
    setError('');
    
    try {
      await deleteFlashcard(flashcardId);
      const updatedFlashcards = [...flashcards];
      updatedFlashcards.splice(currentFlashcardIndex, 1);
      setFlashcards(updatedFlashcards);
      
      if (updatedFlashcards.length === 0) {
        setCurrentFlashcardIndex(0);
      } else if (currentFlashcardIndex >= updatedFlashcards.length) {
        setCurrentFlashcardIndex(updatedFlashcards.length - 1);
      }
      
      setIsFlipped(false);
      setSuccess('Flashcard deleted successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting flashcard:', err);
      setError('Failed to delete flashcard. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderGenerateForm = () => {
    return (
      <div className="generate-area">
        <h2>Generate New Flashcards</h2>
        
        <div className="generate-form-section">
          <h3>1. Select Documents</h3>
          <p className="form-instruction">Choose documents to generate flashcards from:</p>
          
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
                      disabled={isGenerating}
                    />
                    {doc.originalFilename}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="generate-form-section">
          <h3>2. Select AI Model</h3>
          <p className="form-instruction">Choose which AI model to use for flashcard generation:</p>
            {availableModels.length === 0 ? (
            <div className="model-list-empty">
              <p>No AI models available. Please check your API key in account settings.</p>
            </div>
          ) : (
            <div className="model-selection">
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isGenerating || isLoadingModels}
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              {isLoadingModels && <span className="model-loading">Loading models...</span>}
            </div>
          )}
        </div>

        {error && (
          <div className="flashcard-alert alert-danger">
            {error}
          </div>
        )}
          <div className="form-buttons">
          <button 
            className={`btn-generate ${isGenerating ? 'generating' : ''}`}
            onClick={handleGenerateFlashcards}
            disabled={isGenerating || selectedDocIds.size === 0 || !selectedModel || isLoadingDocs || isLoadingModels}
          >
            {isGenerating ? 'Generating...' : 'Generate Flashcards'}
          </button>
        </div>
      </div>
    );
  };

  const renderFlashcardView = () => {
    if (isLoadingFlashcards) {
      return (
        <div className="empty-state">
          <LoadingIndicator />
          <p>Loading flashcards...</p>
        </div>
      );
    }

    if (flashcards.length === 0) {
      return (
        <div className="empty-state">
          <h3>No Flashcards Available</h3>
          <p>Generate some flashcards to start studying!</p>
          <button 
            className="btn-generate"
            onClick={() => setIsGenerateMode(true)}
            disabled={isLoadingDocs || isLoadingModels}
          >
            Generate New Flashcards
          </button>
        </div>
      );
    }

    const currentFlashcard = flashcards[currentFlashcardIndex];

    return (
      <div className="flashcard-study-area">
        <div className="flashcard-controls">
          <button 
            className="prev-card-btn" 
            onClick={handlePrevCard}
            disabled={currentFlashcardIndex === 0 || isDeleting}
          >
            ← Previous Card
          </button>
          <span className="flashcard-counter">
            Card {currentFlashcardIndex + 1} of {flashcards.length}
          </span>
          <button 
            className="next-card-btn" 
            onClick={handleNextCard}
            disabled={currentFlashcardIndex === flashcards.length - 1 || isDeleting}
          >
            Next Card →
          </button>
        </div>

        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlipCard}>
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="flashcard-content">
                <h3>Question</h3>
                <p>{currentFlashcard.question}</p>
              </div>
              <div className="flashcard-footer">
                Click to flip card
              </div>
            </div>
            <div className="flashcard-back">
              <div className="flashcard-content">
                <h3>Answer</h3>
                <p>{currentFlashcard.answer}</p>
              </div>
              <div className="flashcard-footer">
                Click to flip card
              </div>
            </div>
          </div>
        </div>

        <div className="flashcard-actions">
          <button 
            className="delete-card-btn" 
            onClick={handleDeleteFlashcard}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Card'}
          </button>
        </div>

        {success && (
          <div className="flashcard-alert alert-success">
            {success}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flashcard-page">
      <div className="flashcard-header">
        <Link to={`/notebook/${notebookId}`} className="btn-back">
            ← Back to Notebook
        </Link>
        <h1>Flashcards</h1>
      </div>      <div className="flashcard-body">
        <div className="flashcard-sidebar">
          <div className="flashcard-section-header">
            <h4>Actions</h4>
          </div>
          <button 
            onClick={() => setIsGenerateMode(true)} 
            className="btn-new-flashcard" 
            disabled={isGenerating || isLoadingDocs || isLoadingModels}
          >
            + Generate New Flashcards
          </button>
          
          <hr />
          
          <button 
            onClick={() => setIsGenerateMode(false)} 
            className="btn-view-flashcards" 
            disabled={isLoadingFlashcards || flashcards.length === 0}
          >
            View Flashcards
          </button>
          
          {isLoadingFlashcards && (
            <div className="loading-container">
              <LoadingIndicator />
              <p>Loading flashcards...</p>
            </div>
          )}
          
          {!isLoadingFlashcards && flashcards.length > 0 && (
            <div className="flashcard-count">
              {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} available
            </div>
          )}
        </div>
        
        <div className="flashcard-main">
          <div className="flashcard-stage">
            {isGenerateMode ? renderGenerateForm() : renderFlashcardView()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashcardPage;
