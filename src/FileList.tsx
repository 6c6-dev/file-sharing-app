// src/FileList.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface FileData {
    id: string;
    name: string;
    path: string;
}

const FileList: React.FC = () => {
    const { user } = useAuth();
    const [files, setFiles] = useState<FileData[]>([]);

    useEffect(() => {
        const fetchFiles = async () => {
            if (user) {
                const q = query(collection(db, 'files'), where('owner', '==', user.uid));
                const querySnapshot = await getDocs(q);
                const filesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FileData[];
                setFiles(filesData);
            }
        };

        fetchFiles();
    }, [user]);

    return (
        <div>
            <h2>Your Files</h2>
            <ul>
                {files.map(file => (
                    <li key={file.id}>{file.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default FileList;
