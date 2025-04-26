import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/documentService';
import { getAvailableModels } from '../services/chatService';
import {
  generateQuiz,
  getQuizzes,
  getQuiz,
  submitQuizAttempt,
  gradeQuiz,
  deleteQuiz
} from '../services/quizService';
import LoadingIndicator from '../components/LoadingIndicator';
import QuizGeneratingIndicator from '../components/QuizGeneratingIndicator';
import './QuizPage.css';

const QuizPage = ({ notebookId }) => {
  // Document and model selection
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [numMCQs, setNumMCQs] = useState(5);
  const [numShortAnswer, setNumShortAnswer] = useState(0);
  
  // UI and loading states
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingQuizId, setGeneratingQuizId] = useState(null);
  const [generatingQuizTitle, setGeneratingQuizTitle] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGenerateMode, setIsGenerateMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Quiz lists
  const [ongoingQuizzes, setOngoingQuizzes] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);

  // Selected quiz details
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');

  // Initial data fetch
  useEffect(() => {
    if (!notebookId) return;
    setIsLoadingDocs(true);
    setIsLoadingModels(true);
    setIsLoadingQuizzes(true);
    setError('');

    const fetchDocs = getDocuments(notebookId)
      .then(res => setDocuments(res.data.filter(d => d.processed)))
      .catch(() => setError(prev => prev ? `${prev}. Failed to load documents.` : 'Failed to load documents.'))
      .finally(() => setIsLoadingDocs(false));

    const fetchModels = getAvailableModels()
      .then(res => {
        const mods = res.data;
        setAvailableModels(mods);
        if (mods.length) setSelectedModel(mods[0].id);
      })
      .catch(() => setError(prev => prev ? `${prev}. Failed to load AI models.` : 'Failed to load AI models.'))
      .finally(() => setIsLoadingModels(false));

    const fetchQuizzes = getQuizzes(notebookId)
      .then(res => {
        setOngoingQuizzes(res.data.ongoing || []);
        setCompletedQuizzes(res.data.completed || []);
      })
      .catch(() => setError(prev => prev ? `${prev}. Failed to load quizzes.` : 'Failed to load quizzes.'))
      .finally(() => setIsLoadingQuizzes(false));

    Promise.all([fetchDocs, fetchModels, fetchQuizzes]).catch(err => {
      console.error("Error loading data:", err);
    });
  }, [notebookId]);
  // Poll backend for quiz readiness
  const pollQuizReady = (quizId) => {
    const interval = setInterval(() => {
      getQuiz(quizId).then(res => {
        const q = res.data;
        if (['ongoing','completed','error'].includes(q.status)) {
          clearInterval(interval);
          setIsGenerating(false);
          setGeneratingQuizId(null);
          
          if (q.status === 'ongoing') {
            setSelectedQuizId(quizId);
            setSelectedQuiz(q);
            setSuccess('Quiz generated successfully!');
            setTimeout(() => setSuccess(''), 3000);
          } else if (q.status === 'error') {
            setError('Quiz generation failed. Please try again.');
          }
          // refresh lists
          getQuizzes(notebookId).then(r => {
            setOngoingQuizzes(r.data.ongoing || []);
            setCompletedQuizzes(r.data.completed || []);
          });
        }
      }).catch(() => {
        clearInterval(interval);
        setIsGenerating(false);
        setGeneratingQuizId(null);
        setError('Failed to check quiz generation status. Please try again.');
      });
    }, 2000);
  };

  // Handlers
  const toggleDoc = (docId) => {
    setSelectedDocIds(prev => {
      const s = new Set(prev);
      s.has(docId) ? s.delete(docId) : s.add(docId);
      return s;
    });
  };
  
  const handleGenerate = () => {
    if (selectedDocIds.size === 0) { 
      setError('Please select at least one document.'); 
      return; 
    }
    
    setError(''); 
    setSuccess(''); 
    setIsGenerating(true);
    
    const payload = { 
      selectedDocumentIds: Array.from(selectedDocIds), 
      model: selectedModel, 
      numMCQs, 
      numShortAnswer 
    };
      generateQuiz(notebookId, payload)
      .then(res => {
        setIsGenerateMode(false);
        setGeneratingQuizId(res.data.quizId);
        
        // Create a title from selected documents
        const selectedDocs = documents.filter(doc => selectedDocIds.has(doc._id));
        const title = selectedDocs.length > 0 
          ? `Quiz on ${selectedDocs.map(d => d.originalFilename || d.title).join(', ')}`
          : 'New Quiz';
        setGeneratingQuizTitle(title.length > 60 ? title.substring(0, 57) + '...' : title);
        
        pollQuizReady(res.data.quizId);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
        setIsGenerating(false);
      });
  };

  const selectQuiz = (id) => {
    setSelectedQuizId(id);
    setQuizError('');
    setError('');
  };
  useEffect(() => {
    if (!selectedQuizId) {
      setSelectedQuiz(null);
      return;
    }
    
    setIsLoadingQuiz(true);
    getQuiz(selectedQuizId)
      .then(res => setSelectedQuiz(res.data))
      .catch(() => {
        setQuizError('Failed to load quiz details. Please try again.');
        setSelectedQuiz(null);
      })
      .finally(() => setIsLoadingQuiz(false));
  }, [selectedQuizId]);

  // Auto-save quiz answers every 30 seconds
  useEffect(() => {
    if (!selectedQuiz || selectedQuiz.status !== 'ongoing') {
      return; // Only auto-save ongoing quizzes
    }

    // Set up autosave timer
    const autoSaveInterval = setInterval(() => {
      // Check if there are any answers to save
      const hasAnswers = selectedQuiz.questions.some(q => q.userAnswer !== null && q.userAnswer !== '');
      
      if (hasAnswers) {
        const answers = {};
        selectedQuiz.questions.forEach((q, i) => answers[i] = q.userAnswer || '');
        
        submitQuizAttempt(selectedQuizId, answers)
          .then(() => {
            console.log('Quiz auto-saved successfully');
            // Show a subtle notification that can disappear quickly
            setSuccess('Auto-saved');
            setTimeout(() => setSuccess(''), 1000);
          })
          .catch(err => {
            console.error('Quiz auto-save failed:', err);
          });
      }
    }, 30000); // 30 seconds

    // Clean up interval on unmount or when quiz changes
    return () => clearInterval(autoSaveInterval);
  }, [selectedQuiz, selectedQuizId]);

  const handleAnswerChange = (idx, val) => {
    setSelectedQuiz(prev => {
      const updated = { ...prev };
      updated.questions[idx].userAnswer = val;
      return updated;
    });
  };
  
  const saveQuizProgress = () => {
    const answers = {};
    selectedQuiz.questions.forEach((q, i) => answers[i] = q.userAnswer || '');
    
    setQuizError('');
    submitQuizAttempt(selectedQuizId, answers)
      .then(() => {
        setSuccess('Quiz progress saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch(() => setQuizError('Failed to save quiz progress. Please try again.'));
  };
    const submitForGrading = () => {
    if (!window.confirm('Are you sure you want to submit this quiz for grading? You won\'t be able to change your answers after submission.')) {
      return;
    }
    
    setQuizError('');
    
    // Save answers before submitting for grading
    const answers = {};
    selectedQuiz.questions.forEach((q, i) => answers[i] = q.userAnswer || '');
    
    submitQuizAttempt(selectedQuizId, answers)
      .then(() => {
        // After saving, submit for grading
        return gradeQuiz(selectedQuizId);
      })
      .then(() => getQuiz(selectedQuizId).then(r => {
        setSelectedQuiz(r.data);
        setSuccess('Quiz graded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }))
      .then(() => getQuizzes(notebookId).then(r => {
        setOngoingQuizzes(r.data.ongoing || []);
        setCompletedQuizzes(r.data.completed || []);
      }))
      .catch((err) => {
        console.error('Error during grading:', err);
        setQuizError('Failed to grade quiz. Please try again.');
      });
  };
  
  const handleDeleteQuiz = (id, event) => {
    event?.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }
    
    deleteQuiz(id).then(() => {
      setOngoingQuizzes(prev => prev.filter(q => q._id !== id));
      setCompletedQuizzes(prev => prev.filter(q => q._id !== id));
      
      if (selectedQuizId === id) {
        setSelectedQuizId(null);
        setSelectedQuiz(null);
      }
      
      setSuccess('Quiz deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Failed to delete quiz. Please try again.');
    });
  };

  // Render functions
  const renderGenerateForm = () => {
    return (
      <div className="generate-area">
        <h2>Create New Quiz</h2>
        
        <div className="generate-form-section">
          <h3>1. Select Documents</h3>
          <p className="form-instruction">Choose documents to generate quiz questions from:</p>
          
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
                      onChange={() => toggleDoc(doc._id)}
                      disabled={isGenerating}
                    />
                    {doc.originalFilename || doc.title}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="generate-form-section">
          <h3>2. Select AI Model</h3>
          <p className="form-instruction">Choose which AI model to use for quiz generation:</p>
          {availableModels.length === 0 ? (
            <div className="model-list-empty">
              <p>No AI models available. Please check your API key in account settings.</p>
            </div>
          ) : (
            <div className="form-group">
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isGenerating || isLoadingModels}
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name || model.id}
                  </option>
                ))}
              </select>
              {isLoadingModels && <span className="model-loading">Loading models...</span>}
            </div>
          )}
        </div>

        <div className="generate-form-section">
          <h3>3. Configure Quiz Questions</h3>
          
          <div className="form-group">
            <label htmlFor="mcqSelect">Number of Multiple-Choice Questions:</label>
            <select 
              id="mcqSelect"
              value={numMCQs} 
              onChange={(e) => setNumMCQs(parseInt(e.target.value))}
              disabled={isGenerating}
            >
              {[5, 10, 15, 20].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="shortAnswerSelect">Number of Short Answer Questions:</label>
            <select 
              id="shortAnswerSelect"
              value={numShortAnswer} 
              onChange={(e) => setNumShortAnswer(parseInt(e.target.value))}
              disabled={isGenerating}
            >
              {[0, 1, 2, 3, 5].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="quiz-alert alert-danger">
            {error}
          </div>
        )}
        
        <div className="form-buttons">
          
          <button 
            className={`btn-generate ${isGenerating ? 'generating' : ''}`}
            onClick={handleGenerate}
            disabled={isGenerating || selectedDocIds.size === 0 || !selectedModel || isLoadingDocs || isLoadingModels}
          >
            {isGenerating ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      </div>
    );
  };

  const renderQuizView = () => {
    if (isLoadingQuiz) {
      return (
        <div className="empty-state">
          <LoadingIndicator />
          <p>Loading quiz...</p>
        </div>
      );
    }

    if (quizError) {
      return (
        <div className="quiz-alert alert-danger">
          {quizError}
          <button className="btn-back-to-quizzes" onClick={() => setSelectedQuizId(null)}>
            Back to Quizzes
          </button>
        </div>
      );
    }

    if (!selectedQuiz) {
      return (
        <div className="empty-state">
          <h3>Quiz not found</h3>
          <button className="btn-back-to-quizzes" onClick={() => setSelectedQuizId(null)}>
            Back to Quizzes
          </button>
        </div>
      );
    }

    return (
      <div className="quiz-view">
        <h2>{selectedQuiz.title}</h2>
        
        {success && (
          <div className="quiz-alert alert-success">
            {success}
          </div>
        )}
        
        {selectedQuiz.status === 'ongoing' && (
          <>
            {selectedQuiz.questions.map((question, index) => (
              <div key={index} className="question">
                <div className="question-text">
                  {index + 1}. {question.questionText}
                </div>
                
                {question.type === 'mcq' ? (
                  <div className="question-options">
                    {question.options.map((option) => (
                      <label key={option} className="option-label">
                        <input 
                          type="radio" 
                          name={`question-${index}`} 
                          checked={question.userAnswer === option}
                          onChange={() => handleAnswerChange(index, option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea 
                    value={question.userAnswer || ''} 
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Type your answer here..."
                  />
                )}
              </div>
            ))}
              <div className="quiz-actions">
              <button className="btn-save" onClick={saveQuizProgress}>
                Save Progress
              </button>
              <button className="btn-submit" onClick={submitForGrading}>
                Submit for Grading
              </button>
              <div className="auto-save-info">
                <small>Your answers are automatically saved every 30 seconds</small>
              </div>
            </div>
          </>
        )}
        
        {selectedQuiz.status === 'completed' && (
          <>
            <div className="quiz-info">
              <div className="quiz-score">
                Score: {selectedQuiz.score}%
              </div>
            </div>
            
            {selectedQuiz.feedback && (
              <div className="quiz-feedback">
                <strong>Feedback:</strong> {selectedQuiz.feedback}
              </div>
            )}
            
            {selectedQuiz.questions.map((question, index) => (
              <div key={index} className="question">
                <div className="question-text">
                  {index + 1}. {question.questionText}
                </div>
                  {question.type === 'mcq' ? (
                  <div className={`results-answer ${question.userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase() ? 'correct' : 'incorrect'}`}>
                    <p>
                      <span className="answer-status">
                        {question.userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase() ? '✅ Correct' : '❌ Incorrect'}
                      </span>
                    </p>
                    <p><strong>Your Answer:</strong> {question.userAnswer}</p>
                    <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>
                  </div>
                ) : (
                  <div className="results-answer short-answer">                    <p>
                      <span className="answer-status ai-graded">
                        AI Graded
                      </span>
                    </p>
                    <p><strong>Your Answer:</strong> {question.userAnswer}</p>
                    <p><strong>Model Answer:</strong> {question.correctAnswer}</p>                    <p className="grading-note">
                      <em>Note: Short answers are evaluated by an AI model that understands context, meaning, and synonyms - not just exact text matching. Your answer was considered as part of the overall quiz score.</em>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        
        <button className="btn-back-to-quizzes" onClick={() => {
          setSelectedQuizId(null);
          setSelectedQuiz(null);
        }}>
          Back to Quizzes
        </button>
      </div>
    );
  };
  const renderEmptyQuizzes = () => {
    return (
      <div className="empty-state">
        <h3>No Quizzes Available</h3>
        <p>Create a new quiz to start testing your knowledge!</p>
        <button 
          className="btn-create-quiz"
          onClick={() => setIsGenerateMode(true)}
          disabled={isLoadingDocs || isLoadingModels}
        >
          Create New Quiz
        </button>
      </div>
    );
  };
  
  const renderGeneratingState = () => {
    return <QuizGeneratingIndicator title={generatingQuizTitle} />;
  };
  
  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <Link to={`/notebook/${notebookId}`} className="btn-back">
          ← Back to Notebook
        </Link>
        <h1>Quizzes</h1>
      </div>
      
      <div className="quiz-body">
        <div className={`quiz-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="quiz-section-header">
            <h4>Actions</h4>
          </div>
          
          <button 
            onClick={() => setIsGenerateMode(true)} 
            className="btn-create-quiz" 
            disabled={isGenerating || isLoadingDocs || isLoadingModels}
          >
            + Create New Quiz
          </button>
          
          <hr />
          
          <div className="quiz-lists">
            {isLoadingQuizzes ? (
              <div className="loading-container">
                <LoadingIndicator />
                <p>Loading quizzes...</p>
              </div>
            ) : (
              <>
                <div className="quiz-list">
                  <h3>Ongoing Quizzes</h3>
                  {ongoingQuizzes.length === 0 ? (
                    <p>No ongoing quizzes</p>
                  ) : (
                    ongoingQuizzes.map(quiz => (
                      <div 
                        key={quiz._id} 
                        className={`quiz-list-item ${selectedQuizId === quiz._id ? 'selected' : ''}`}
                        onClick={() => selectQuiz(quiz._id)}
                      >
                        <span className="quiz-title">{quiz.title}</span>
                        {quiz.status === 'generating' && (
                          <span className="quiz-status-indicator">⏳</span>
                        )}
                        {quiz.status === 'error' && (
                          <span className="quiz-status-indicator">❌</span>
                        )}                        <button 
                          className="quiz-delete-btn"
                          onClick={(e) => handleDeleteQuiz(quiz._id, e)}
                          title="Delete Quiz"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="quiz-list">
                  <h3>Completed Quizzes</h3>
                  {completedQuizzes.length === 0 ? (
                    <p>No completed quizzes</p>
                  ) : (
                    completedQuizzes.map(quiz => (                      <div 
                        key={quiz._id} 
                        className={`quiz-list-item ${selectedQuizId === quiz._id ? 'selected' : ''}`}
                        onClick={() => selectQuiz(quiz._id)}
                      >
                        <span className="quiz-title">{quiz.title || "Untitled Quiz"}</span>
                        
                        <button 
                          className="quiz-delete-btn"
                          onClick={(e) => handleDeleteQuiz(quiz._id, e)}
                          title="Delete Quiz"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          
          {error && (
            <div className="quiz-alert alert-danger">
              {error}
            </div>
          )}
        </div>
        
        <div className="quiz-main">          <div className="quiz-stage">
            {isGenerating && generatingQuizId ? (
              renderGeneratingState()
            ) : isGenerateMode ? (
              renderGenerateForm()
            ) : selectedQuizId ? (
              renderQuizView()
            ) : ongoingQuizzes.length === 0 && completedQuizzes.length === 0 && !isLoadingQuizzes ? (
              renderEmptyQuizzes()
            ) : (
              <div className="empty-state">
                <h3>Select a Quiz</h3>
                <p>Choose a quiz from the sidebar to view or continue.</p>
              </div>
            )}
            
            {success && !isGenerateMode && !selectedQuizId && (
              <div className="quiz-alert alert-success">
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <button 
        className="btn-toggle-sidebar"
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        {isSidebarCollapsed ? '≫' : '≪'}
      </button>
    </div>
  );
}

export default QuizPage;