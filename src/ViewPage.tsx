// src/ViewPage.tsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

interface FileData {
    id: string;
    name: string;
    path: string;
    metadata: { [key: string]: any };
  }
  
  interface FileDataWithUrl extends FileData {
    url: string;
  }
  const ViewPage: React.FC = () => {
    const [files, setFiles] = useState<FileDataWithUrl[]>([]);  // Use the new type
    
    useEffect(() => {
      const fetchFiles = async () => {
        const filesCollection = collection(db, 'files');
        const fileSnapshot = await getDocs(filesCollection);
        const filesData = await Promise.all(
          fileSnapshot.docs.map(async (doc) => {
            const data = doc.data() as FileData;
            const fileUrl = await getDownloadURL(ref(storage, data.path));
            return { ...data, id: doc.id, url: fileUrl };
          })
        );
        setFiles(filesData);
      };
  
      fetchFiles();
    }, []);
  
    return (
      <Box sx={{ flexGrow: 1, padding: 3 }}>
        <Typography variant="h4" gutterBottom>
          View Content
        </Typography>
        <Grid container spacing={3}>
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={3} key={file.id}>
              <Box
                sx={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  textAlign: 'center',
                  padding: 2,
                  backgroundColor: '#fafafa',
                }}
              >
                <img
                  src={file.url}  // Now TypeScript knows that 'url' exists on 'FileDataWithUrl'
                  alt={file.name}
                  style={{ width: '100%', height: 'auto', marginBottom: '10px' }}
                />
                <Typography variant="body1" noWrap>
                  {file.name}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };
  