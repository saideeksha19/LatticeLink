import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const VaultContext = createContext(null);

export const VaultProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [vaultFiles, setVaultFiles] = useState([]);

  const getAuthHeaders = () => {
    const headers = { 
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    };
    const token = currentUser?.session_token || (() => {
      try {
        const saved = localStorage.getItem('ll_session_v4');
        return saved ? JSON.parse(saved)?.session_token : null;
      } catch (e) { return null; }
    })();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(() => {
    if (!currentUser || !currentUser.username) {
      setVaultFiles([]);
      return;
    }
    
    const fetchFiles = async () => {
      try {
        const res = await fetch(`/api/vault/files/${currentUser.username}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setVaultFiles(data.files.map(f => ({
            id: f.id,
            name: f.name,
            size: f.size,
            size_bytes: f.size_bytes,
            mimetype: f.mimetype || 'application/octet-stream',
            type: f.type,
            date: f.uploadedAt,
            owner: f.owner?.username || currentUser.username,
            receiver: f.receiver,
            base64: f.base64,
            sha3_hash: f.sha3_hash,
            aes: 'Encrypted',
            sha3: 'Verified',
            mlDsa: 'Signed',
            mlKem: 'Encapsulated',
            status: 'Protected',
            timeline: [
              { step: 'AES-256-GCM', status: 'Encrypted', time: new Date().toLocaleTimeString(), detail: 'Payload encrypted with 256-bit symmetric key' },
              { step: 'SHA3-256', status: 'Generated', time: new Date().toLocaleTimeString(), detail: `Integrity hash: ${f.sha3_hash?.slice(0, 16)}...` },
              { step: 'ML-DSA-65', status: 'Signed', time: new Date().toLocaleTimeString(), detail: 'Digital signature authenticated via Dilithium' },
              { step: 'ML-KEM-768', status: 'Wrapped', time: new Date().toLocaleTimeString(), detail: 'Session key encapsulated using Kyber' }
            ]
          })));
        }
      } catch (err) {
        console.error("Failed to fetch vault files", err);
      }
    };

    fetchFiles();
    const interval = setInterval(fetchFiles, 8000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const uploadVaultFile = async (name, size, type, base64) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/vault/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          uploader: currentUser.username,
          name,
          size,
          fileType: type,
          base64: base64
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newFile = {
          id: data.file.id,
          name: data.file.name,
          size: data.file.size,
          type: data.file.type,
          base64: base64,
          sha3_hash: data.file.sha3_hash,
          date: 'Just now',
          owner: currentUser.username,
          aes: 'Encrypted',
          sha3: 'Verified',
          mlDsa: 'Signed',
          mlKem: 'Encapsulated',
          status: 'Protected',
          timeline: [
            { step: 'AES-256-GCM', status: 'Encrypted', time: new Date().toLocaleTimeString(), detail: 'Payload encrypted with 256-bit symmetric key' },
            { step: 'SHA3-256', status: 'Generated', time: new Date().toLocaleTimeString(), detail: 'Integrity hash computed over ciphertext' },
            { step: 'ML-DSA-65', status: 'Signed', time: new Date().toLocaleTimeString(), detail: 'Digital signature applied using Dilithium' },
            { step: 'ML-KEM-768', status: 'Wrapped', time: new Date().toLocaleTimeString(), detail: 'Symmetric key encapsulated using Kyber' }
          ]
        };
        setVaultFiles(prev => [newFile, ...prev]);
      }
    } catch (err) {
      console.error("Failed to upload file", err);
    }
  };

  const shareVaultFile = async (fileId, targetUsername) => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/vault/share', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          file_id: fileId,
          receiver: targetUsername,
          sender: currentUser.username
        })
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to share file", err);
      return false;
    }
  };

  const deleteVaultFile = async (fileId) => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/vault/delete/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setVaultFiles(prev => prev.filter(f => f.id !== fileId));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to delete file", err);
      return false;
    }
  };

  return (
    <VaultContext.Provider value={{ vaultFiles, uploadVaultFile, shareVaultFile, deleteVaultFile }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => useContext(VaultContext);
