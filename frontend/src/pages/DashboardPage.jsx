import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Get a personalized greeting based on time of day
  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    };
    
    // Simulate loading effect
    setTimeout(() => {
      setGreeting(getGreeting());
      setIsLoading(false);
    }, 600);
    
    // Check if user is logged in
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    // Add slight delay for better UX
    setIsLoading(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      navigate('/login');
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="dashboard-container loading-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading your study dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>AI Study Buddy</h1>
        <button onClick={handleLogout} className="header-logout-btn">
          Logout
        </button>
      </div>
      
      <div className="greeting-card">
        <h2>{greeting}, Scholar!</h2>
        <p>Your personalized learning journey awaits.</p>
      </div>
      
      <div className="dashboard-features">
        <div className="feature-card">
          <h3>Content Ingestion</h3>
          <p>Upload or paste learning materials to get started</p>
        </div>
        
        <div className="feature-card">
          <h3>Flashcards</h3>
          <p>Create smart flashcards from your content</p>
        </div>
        
        <div className="feature-card">
          <h3>Interactive Q&A</h3>
          <p>Ask questions about your study materials</p>
        </div>
        
        <div className="feature-card">
          <h3>Quiz Generator</h3>
          <p>Test your knowledge with custom quizzes</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
