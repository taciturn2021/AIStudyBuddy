import React, { useEffect } from 'react';
import PDFUploader from './PDFUploader';

function UploadModal({ notebookId, isOpen, onClose, onUploadSuccess }) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUploadSuccess = (data) => {
    if (onUploadSuccess) {
      onUploadSuccess(data);
    }
    onClose();
  };

  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleModalContentClick}>
        <div className="modal-header">
          <h2>Upload PDF Document</h2>
          <button className="modal-close-btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <PDFUploader 
            notebookId={notebookId} 
            onUploadSuccess={handleUploadSuccess}
            onUploadError={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

export default UploadModal; 