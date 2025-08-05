import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserDocumentsPage = () => {
  const [records, setRecords] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState(null);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch user's medical records
  useEffect(() => {
    axios.get('/api/documents', {
      headers: { Authorization: `Bearer ${localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : ''}` }
    })
      .then(res => setRecords(Array.isArray(res.data.records) ? res.data.records : []))
      .catch(() => setRecords([]));
  }, [uploading]);

  // Upload new document
  const handleUpload = async e => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file.');
      return;
    }
    if (!docType.trim()) {
      setMessage('Please enter the document type.');
      return;
    }
    setUploading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL || '';
      const response = await axios.post(`${apiBase}/api/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : ''}`
        }
      });
      if (response.data && response.data.success) {
        setMessage('File uploaded successfully!');
        setFile(null);
        setDocType('');
      } else {
        setMessage(response.data && response.data.message ? response.data.message : 'Error uploading file.');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error uploading file.');
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  // Delete document

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-4 bg-gradient-to-br from-teal-100 via-blue-50 to-indigo-100 animate-bg-fade">
      <h2 className="text-3xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 drop-shadow-lg animate-fade-in-up" style={{animationDelay: '0ms'}}>
        Mera Health Record
      </h2>
      <form onSubmit={handleUpload} className="flex gap-2 mb-8 items-center animate-fade-in-up backdrop-blur-md bg-white/60 rounded-xl shadow-lg px-4 py-3" style={{animationDelay: '80ms'}}>
        <input
          type="text"
          value={docType}
          onChange={e => setDocType(e.target.value)}
          placeholder="Document type (e.g. Prescription, Lab Report)"
          className="border p-2 rounded w-48"
        />
        <input type="file" onChange={e => setFile(e.target.files[0])} className="border p-2 rounded" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        <button type="submit" className="bg-teal-500 text-white px-4 py-2 rounded font-semibold hover:bg-teal-600" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload New Report'}</button>
      </form>
      {message && <div className="mb-4 text-base font-semibold text-blue-700 animate-fade-in-up" style={{animationDelay: '160ms'}}>{message}</div>}
    <style>{`
      @keyframes fade-in-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.4,0,0.2,1) both; }
    `}</style>
      <div className="w-full max-w-5xl mx-auto bg-white/40 rounded-3xl shadow-2xl p-6 mt-2 backdrop-blur-md animate-fade-in-up">
        <h3 className="text-xl font-bold mb-6 text-indigo-700 tracking-wide animate-fade-in-up">Your Uploaded Documents</h3>
        {records.length === 0 ? (
          <div className="text-gray-500">No records found.</div>
        ) : (
          <div className="flex flex-wrap justify-center gap-10">
            {records.map((record, idx) => (
              <div
                key={record.public_id}
                className="flex flex-col items-center bg-white/70 rounded-2xl shadow-2xl border border-indigo-100 p-6 w-64 transition-transform duration-300 hover:scale-105 cursor-pointer animate-fade-in-up glass-card"
                style={{ animationDelay: `${idx * 80}ms` }}
                onClick={() => { setModalImg(record.url); setModalOpen(true); }}
              >
                <img
                  src={record.url}
                  alt={record.fileName}
                  className="w-44 h-44 object-cover rounded-xl mb-4 border-2 border-indigo-200 shadow-lg animate-zoom-in"
                  style={{ animationDelay: `${idx * 80 + 100}ms` }}
                />
                <span className="block text-xs text-indigo-500 mb-1 font-semibold">{record.docType ? record.docType : 'No type specified'}</span>
                <span className="text-xs text-gray-700 mt-2 font-medium">{record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    {/* Modal for big image view (pure React, no transition-group) */}
    {modalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900/80 via-blue-900/70 to-teal-800/80 animate-fade-in" onClick={() => setModalOpen(false)}>
        <div className="bg-white/90 rounded-3xl shadow-2xl p-6 relative flex flex-col items-center animate-modal-pop glass-card" onClick={e => e.stopPropagation()}>
          <img src={modalImg} alt="Document" className="w-[400px] h-[400px] object-contain rounded-2xl mb-4 animate-zoom-in" />
          <button className="absolute top-2 right-2 text-gray-700 text-2xl font-bold hover:text-red-500 bg-white/70 rounded-full px-3 py-1 shadow" onClick={() => setModalOpen(false)}>&times;</button>
          <button
            className="mt-2 px-6 py-2 bg-gradient-to-r from-red-500 via-pink-500 to-yellow-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform duration-200 animate-fade-in-up"
            style={{animationDelay: '120ms'}}
            onClick={async () => {
              setUploading(true);
              setMessage('');
              try {
                // Find the record by url to get public_id
                const recordToDelete = records.find(r => r.url === modalImg);
                if (!recordToDelete) {
                  setMessage('Document not found.');
                  setUploading(false);
                  setModalOpen(false);
                  return;
                }
                await axios.delete(`/api/documents/${encodeURIComponent(recordToDelete.public_id)}`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : ''}` }
                });
                setRecords(prev => prev.filter(r => r.public_id !== recordToDelete.public_id));
                setMessage('Document deleted successfully!');
              } catch {
                setMessage('Error deleting document.');
              }
              setUploading(false);
              setModalOpen(false);
            }}
            disabled={uploading}
          >
            {uploading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
        <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes zoom-in { from { transform: scale(0.8); opacity: 0.7; } to { transform: scale(1); opacity: 1; } }
          @keyframes fade-in-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes modal-pop { from { transform: scale(0.85); opacity: 0.7; } to { transform: scale(1); opacity: 1; } }
          @keyframes bg-fade { from { background-position: 0% 50%; } to { background-position: 100% 50%; }
          .animate-fade-in { animation: fade-in 0.3s; }
          .animate-zoom-in { animation: zoom-in 0.4s cubic-bezier(0.4,0,0.2,1); }
          .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.4,0,0.2,1) both; }
          .animate-modal-pop { animation: modal-pop 0.35s cubic-bezier(0.4,0,0.2,1); }
          .animate-bg-fade { animation: bg-fade 8s ease-in-out infinite alternate; background-size: 200% 200%; }
          .glass-card { backdrop-filter: blur(8px) saturate(1.2); background: rgba(255,255,255,0.7); }
        `}</style>
      </div>
    )}
    </div>
  );
};

export default UserDocumentsPage;
