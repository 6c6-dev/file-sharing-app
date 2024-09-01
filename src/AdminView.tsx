// src/AdminView.tsx
import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { db, storage } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import FolderStructure from './FolderStructure';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import LinearProgressWithLabel from './LinearProgressWithLabel';
import { v4 as uuidv4 } from 'uuid';  // Import UUID

const AdminView: React.FC = () => {
    const { user, logout } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [folderName, setFolderName] = useState('');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'folder'>('folder');
    const [progress, setProgress] = useState(0);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const handleFileUpload = async () => {
        if (file && user) {
            const fileExtension = file.name.split('.').pop();
            const fileName = `${file.name}_${uuidv4()}.${fileExtension}`; // Add UUID to filename
            const filePath = currentFolderId ? `uploads/${currentFolderId}/${fileName}` : `uploads/${fileName}`;
            const storageRef = ref(storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Display upload progress
            let snackbarKey = enqueueSnackbar('Uploading...', { variant: 'info', persist: true });

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(progressValue);  // Update the progress state
                },
                (error) => {
                    closeSnackbar(snackbarKey);
                    enqueueSnackbar(`Upload failed: ${error.message}`, { variant: 'error' });
                },
                async () => {
                    closeSnackbar(snackbarKey);
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    await addDoc(collection(db, 'files'), {
                        name: fileName,
                        path: filePath,
                        folderId: currentFolderId || null,
                        owner: user.uid,
                        metadata: {
                            type: file.type,
                            size: file.size,
                            downloadURL,
                            uploadTime: new Date().toISOString()
                        }
                    });
                    enqueueSnackbar('Upload complete!', { variant: 'success' });
                    setProgress(0); // Reset progress
                    setFile(null);  // Clear the file input after upload
                    setRefreshCounter(prev => prev + 1);  // Increment refresh counter to trigger refresh
                }
            );
        }
    };

    const handleCreateFolder = async () => {
        if (folderName && user) {
            await addDoc(collection(db, 'folders'), {
                name: folderName,
                parent: currentFolderId || null,
                owner: user.uid,
            });
            setFolderName('');
            setRefreshCounter(prev => prev + 1);  // Increment refresh counter to trigger refresh
        }
    };

    const handleFolderClick = (folderId: string | null) => {
        setCurrentFolderId(folderId);
        setRefreshCounter(prev => prev + 1);  // Increment refresh counter to trigger refresh
    };

    return (
        <div className="admin-view">
            <h1>Admin View</h1>
            <button onClick={logout}>Logout</button>
            <div className="actions">
                <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                <button onClick={handleFileUpload}>Upload File</button>
                <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="New Folder Name"
                />
                <button onClick={handleCreateFolder}>Create Folder</button>
                <button onClick={() => setViewMode(viewMode === 'table' ? 'folder' : 'table')}>
                    Switch to {viewMode === 'table' ? 'Folder' : 'Table'} View
                </button>
            </div>
            {progress > 0 && (
                <Box sx={{ width: '100%', marginTop: '20px' }}>
                    <LinearProgressWithLabel value={progress} />
                </Box>
            )}
            <FolderStructure currentFolderId={currentFolderId} refreshTrigger={refreshCounter} onFolderClick={handleFolderClick} viewMode={viewMode}  />
        </div>
    );
};

export default AdminView;
