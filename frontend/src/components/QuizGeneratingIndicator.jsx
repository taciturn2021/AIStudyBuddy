import React from 'react';
import LoadingIndicator from './LoadingIndicator';
import './QuizGeneratingIndicator.css';

function QuizGeneratingIndicator({ title }) {
  const generationSteps = [
    'Reading documents...',
    'Analyzing content...',
    'Creating questions...',
    'Generating answer options...',
    'Finalizing quiz...'
  ];
  
  const [activeStep, setActiveStep] = React.useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % generationSteps.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="quiz-generating-indicator">
      <div className="quiz-generating-content">
        <div className="quiz-generating-header">
          <div className="generating-icon">
            <div className="generating-spinner"></div>
          </div>
          <h2>Generating Quiz</h2>
        </div>
        
        <div className="document-info">
          <p>Creating quiz from selected documents</p>
          {title && <p className="quiz-title-generating">{title}</p>}
        </div>
        
        <div className="generation-progress">
          <LoadingIndicator />
          <p className="current-step">{generationSteps[activeStep]}</p>
          <p className="wait-message">This may take a minute or two. Please wait...</p>
        </div>
        
        <div className="ai-info">
          <p>The AI is carefully analyzing your documents to create relevant quiz questions.</p>
        </div>
      </div>
    </div>
  );
}

export default QuizGeneratingIndicator;
