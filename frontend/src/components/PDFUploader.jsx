import React, { useState, useRef } from 'react';
import { uploadDocument } from '../services/documentService';

function PDFUploader({ notebookId, onUploadSuccess, onUploadError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    
    if (!selectedFile) {
      return;
    }
    
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          const newProgress = prevProgress + 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      const response = await uploadDocument(notebookId, file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setFile(null);
      setIsUploading(false);
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setIsUploading(false);
      setProgress(0);
      
      setError(err.response?.data?.message || 'Failed to upload file');
      
      if (onUploadError) {
        onUploadError(err);
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const clearFile = () => {
    setFile(null);
    setError('');
  };

  return (
    <div className="upload-pdf-container">
      {!file ? (
        <div 
          className={`upload-pdf-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h3 className="upload-pdf-title">Upload PDF Document</h3>
          <div className="upload-pdf-instructions">
            <p>Drag and drop your PDF here, or <button className="browse-btn" onClick={handleBrowseClick}>browse</button></p>
          </div>
          <p className="file-size-info">Maximum file size: 10MB</p>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="application/pdf"
            style={{ display: 'none' }}
          />
          <div className="alert alert-info" style={{ textAlign: 'left', fontSize: '0.85rem', marginTop: '1rem' }}>
            <strong>Note:</strong> Only text content will be extracted. Images and complex formatting may not be preserved for AI context.
          </div>
        </div>
      ) : (
        <div className="selected-file">
          <div className="file-preview">
            <div className="file-icon">📄</div>
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            {!isUploading && (
              <button className="close-btn" onClick={clearFile}>×</button>
            )}
          </div>
          
          {isUploading ? (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">{progress}% uploaded</div>
            </div>
          ) : (
            <button 
              className="upload-pdf-btn"
              onClick={handleUpload}
              disabled={isUploading}
            >
              Upload PDF
            </button>
          )}
        </div>
      )}
      
      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default PDFUploader; 