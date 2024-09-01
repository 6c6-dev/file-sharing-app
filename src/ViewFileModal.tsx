// src/ViewFileModal.tsx
import React from 'react';

interface ViewFileModalProps {
    fileName: string;
    fileUrl: string;
    fileType: string;
    onClose: () => void;
}

const ViewFileModal: React.FC<ViewFileModalProps> = ({ fileName, fileUrl, fileType, onClose }) => {
    return (
        <div className="modal full-screen-modal">
            <div className="modal-content full-screen-content">
                <div className="modal-header">
                    <h2>{fileName}</h2>
                    <button onClick={onClose} className="close-button">Close</button>
                </div>
                <div className="file-viewer full-screen-viewer">
                    {fileType.startsWith('image/') ? (
                        <img src={fileUrl} alt={fileName} className="file-image full-screen-image" />
                    ) : fileType === 'application/pdf' ? (
                        <iframe src={fileUrl} title={fileName} className="file-pdf full-screen-pdf"></iframe>
                    ) : (
                        <p>Unsupported file type</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewFileModal;
