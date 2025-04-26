import React, { useState, useEffect } from 'react';
import { getFlashcards, deleteFlashcard } from '../services/flashcardService';
import LoadingIndicator from './LoadingIndicator';

function FlashcardView({ notebookId, newFlashcards, onFlashcardDeleted }) {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (newFlashcards && newFlashcards.length > 0) {
      setFlashcards(newFlashcards);
      setCurrentIndex(0);
      setFlipped(false);
      setIsLoading(false);
      return;
    }

    const fetchFlashcards = async () => {
      setIsLoading(true);
      try {
        const response = await getFlashcards(notebookId);
        setFlashcards(response.data || []);
        setError('');
      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setError('Failed to load flashcards. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashcards();
  }, [notebookId, newFlashcards]);

  const handleFlipCard = () => {
    setFlipped(!flipped);
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const handleNextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const handleDeleteCard = async () => {
    if (isDeleting || !flashcards[currentIndex]) return;

    if (!window.confirm('Are you sure you want to delete this flashcard?')) {
      return;
    }

    const flashcardId = flashcards[currentIndex].id;
    setIsDeleting(true);

    try {
      await deleteFlashcard(flashcardId);
      const updatedFlashcards = [...flashcards];
      updatedFlashcards.splice(currentIndex, 1);
      setFlashcards(updatedFlashcards);
      if (currentIndex >= updatedFlashcards.length && updatedFlashcards.length > 0) {
        setCurrentIndex(updatedFlashcards.length - 1);
      }
      setFlipped(false);
      if (onFlashcardDeleted) {
        onFlashcardDeleted();
      }
    } catch (err) {
      console.error('Error deleting flashcard:', err);
      setError('Failed to delete flashcard. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flashcards-container loading">
        <LoadingIndicator />
        <p>Loading flashcards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flashcards-container error">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flashcards-container empty">
        <p>No flashcards available. Generate some flashcards to start studying!</p>
      </div>
    );
  }

  const currentFlashcard = flashcards[currentIndex];

  return (
    <div className="flashcards-container">
      <div className="flashcard-controls">
        <button 
          className="prev-card-btn" 
          onClick={handlePrevCard}
          disabled={currentIndex === 0 || isDeleting}
        >
          ← Previous Card
        </button>
        <span className="flashcard-counter">
          Card {currentIndex + 1} of {flashcards.length}
        </span>
        <button 
          className="next-card-btn" 
          onClick={handleNextCard}
          disabled={currentIndex === flashcards.length - 1 || isDeleting}
        >
          Next Card →
        </button>
      </div>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={handleFlipCard}>
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
          onClick={handleDeleteCard}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Card'}
        </button>
      </div>
    </div>
  );
}

export default FlashcardView;
