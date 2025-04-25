import React, { useEffect } from 'react';
import PDFUploader from './PDFUploader';

function UploadModal({ notebookId, isOpen, onClose, onUploadSuccess }) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup function to ensure the class is removed when the component unmounts
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
    // Prevent clicks inside modal content from closing the modal
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
            onUploadError={() => {}} // We'll handle errors in the uploader itself
          />
        </div>
      </div>
    </div>
  );
}

export default UploadModal; 