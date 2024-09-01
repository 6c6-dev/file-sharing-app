import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // Import UUID
import { db, storage } from './firebase';

interface EditFileModalProps {
    file: {
        id: string;
        name: string;
        path: string;
        folderId: string | null;
        metadata: { [key: string]: any };
    };
    folders: { id: string; name: string }[];
    onClose: () => void;
    onSave: () => void;
}

const EditFileModal: React.FC<EditFileModalProps> = ({ file, folders, onClose, onSave }) => {
    const [newName, setNewName] = useState(file.name);
    const [newFolderId, setNewFolderId] = useState<string | null>(file.folderId);
    const [metadata, setMetadata] = useState<{ [key: string]: any }>(file.metadata);

    const handleSave = async () => {
        try {
            const oldPath = file.path;
            const fileExtension = oldPath.split('.').pop();
            const newFileName = `${newName}_${uuidv4()}.${fileExtension}`; // Use UUID in filename
            const newFilePath = newFolderId
                ? `uploads/${newFolderId}/${newFileName}`
                : `uploads/${newFileName}`;

            console.log(`Old path: ${oldPath}`);
            console.log(`New path: ${newFilePath}`);

            // If the file is moved to a new folder or the name is changed
            if (newFilePath !== oldPath) {
                const oldFileRef = ref(storage, oldPath);
                const newFileRef = ref(storage, newFilePath);

                // Move file to the new path
                const fileSnapshot = await getDownloadURL(oldFileRef);
                const response = await fetch(fileSnapshot);
                const blob = await response.blob();

                await uploadBytes(newFileRef, blob);
                await deleteObject(oldFileRef);

                // Update Firestore with the new path and name
                await updateDoc(doc(db, 'files', file.id), {
                    name: newFileName,
                    path: newFilePath,
                    folderId: newFolderId,
                    metadata,
                });
            } else {
                // Update Firestore with the new metadata and name
                await updateDoc(doc(db, 'files', file.id), {
                    name: newFileName,
                    metadata,
                });
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Edit File</h2>
                <label>
                    File Name:
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </label>
                <label>
                    Move to Folder:
                    <select
                        value={newFolderId || ''}
                        onChange={(e) => setNewFolderId(e.target.value || null)}
                    >
                        <option value="">Root</option>
                        {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Metadata (JSON format):
                    <textarea
                        value={JSON.stringify(metadata, null, 2)}
                        onChange={(e) => setMetadata(JSON.parse(e.target.value))}
                    />
                </label>
                <button onClick={handleSave}>Save</button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default EditFileModal;
