// src/FolderStructure.tsx
import React, { useState, useEffect } from 'react';
import { db, storage } from './firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, getDownloadURL, uploadBytes } from 'firebase/storage';
import { useAuth } from './AuthProvider';
import EditFileModal from './EditFileModal';  // New modal for editing files
import ViewFileModal from './ViewFileModal';

interface FolderStructureProps {
    currentFolderId: string | null;
    onFolderClick: (folderId: string | null) => void;
    viewMode: 'table' | 'folder';
    refreshTrigger: number;
}

interface FolderData {
    id: string;
    name: string;
    parent: string | null;
}

interface FileData {
    id: string;
    name: string;
    path: string;
    folderId: string | null;
    metadata: { [key: string]: any };
}

const FolderStructure: React.FC<FolderStructureProps> = ({ currentFolderId, onFolderClick, viewMode,refreshTrigger }) => {
    const { user } = useAuth();
    const [folders, setFolders] = useState<FolderData[]>([]);
    const [files, setFiles] = useState<FileData[]>([]);
    const [currentFolder, setCurrentFolder] = useState<FolderData | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [viewFile, setViewFile] = useState<{ fileName: string, fileUrl: string, fileType: string } | null>(null);

    useEffect(() => {
        const fetchFoldersAndFiles = async () => {
            if (user) {
                const folderQuery = query(collection(db, 'folders'), where('parent', '==', currentFolderId || null), where('owner', '==', user.uid));
                const fileQuery = query(collection(db, 'files'), where('folderId', '==', currentFolderId || null), where('owner', '==', user.uid));

                const folderSnapshot = await getDocs(folderQuery);
                const fileSnapshot = await getDocs(fileQuery);

                const folderData = folderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FolderData));
                const fileData = fileSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileData));

                setFolders(folderData);
                setFiles(fileData);

                if (currentFolderId) {
                    const currentFolderDoc = await getDocs(query(collection(db, 'folders'), where('__name__', '==', currentFolderId)));
                    setCurrentFolder(currentFolderDoc.docs.map(doc => ({ id: doc.id, ...doc.data() } as FolderData))[0]);
                } else {
                    setCurrentFolder(null);
                }
            }
        };

        fetchFoldersAndFiles();
    }, [currentFolderId, user,refreshTrigger]);

    const handleDeleteFile = async (fileId: string, filePath: string) => {
        try {
            await deleteDoc(doc(db, 'files', fileId));
            await deleteObject(ref(storage, filePath));
            setFiles(files.filter(file => file.id !== fileId));
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        try {
            await deleteDoc(doc(db, 'folders', folderId));
            setFolders(folders.filter(folder => folder.id !== folderId));
            // Additional logic needed to delete all files within the folder
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };

    const handleFileClick = (file: FileData) => {
        setSelectedFile(file);  // This is for editing the file
        setViewFile(null);      // Ensure view modal is not open
    };

    const handleViewFile = async (file: FileData) => {
        try {
            const fileUrl = await getDownloadURL(ref(storage, file.path));
            setViewFile({
                fileName: file.name,
                fileUrl: fileUrl,
                fileType: file.metadata?.type || ''
            });
            setSelectedFile(null);  // Ensure edit modal is not open
        } catch (error) {
            console.error('Error fetching file URL:', error);
        }
    };

    const handleCloseModal = () => {
        setSelectedFile(null);
        setViewFile(null);
    };

    const handleSaveChanges = async () => {
        if (!user) {
            console.error('User is not authenticated');
            return;
        }

        try {
            // Re-fetch files to update the display after changes
            const fileQuery = query(collection(db, 'files'), where('folderId', '==', currentFolderId || null), where('owner', '==', user.uid));
            const fileSnapshot = await getDocs(fileQuery);
            const fileData = fileSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileData));
            setFiles(fileData);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    return (
        <div>
            {currentFolder && (
                <button onClick={() => onFolderClick(currentFolder.parent)}>
                    Back to {currentFolder.parent ? "Parent Folder" : "Root"}
                </button>
            )}
            {viewMode === 'table' ? (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {folders.map(folder => (
                            <tr key={folder.id}>
                                <td onClick={() => onFolderClick(folder.id)} style={{ cursor: 'pointer' }}>{folder.name}</td>
                                <td><button onClick={() => handleDeleteFolder(folder.id)}>Delete</button></td>
                            </tr>
                        ))}
                        {files.map(file => (
                            <tr key={file.id}>
                                <td onClick={() => handleFileClick(file)} style={{ cursor: 'pointer' }}>{file.name}</td>
                                <td>
                                    <button onClick={() => handleViewFile(file)} className="view-button">View</button>
                                    <button onClick={() => handleFileClick(file)}>Edit</button>
                                    <button onClick={() => handleDeleteFile(file.id, file.path)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div>
                    <ul>
                        {folders.map(folder => (
                            <li key={folder.id} onClick={() => onFolderClick(folder.id)} style={{ cursor: 'pointer' }}>
                                📁 {folder.name}
                            </li>
                        ))}
                        {files.map(file => (
                            <li key={file.id}>
                                📄 {file.name}
                                <div className="actions">
                                    <button onClick={() => handleViewFile(file)} className="view-button">View</button>
                                    <button onClick={() => handleFileClick(file)}>Edit</button>
                                    <button onClick={() => handleDeleteFile(file.id, file.path)}>Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {selectedFile && (
                <EditFileModal
                    file={selectedFile}
                    folders={folders}  // Pass the available folders to the modal
                    onClose={handleCloseModal}
                    onSave={handleSaveChanges}
                />
            )}

            {viewFile && (
                <ViewFileModal
                    fileName={viewFile.fileName}
                    fileUrl={viewFile.fileUrl}
                    fileType={viewFile.fileType}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default FolderStructure;
