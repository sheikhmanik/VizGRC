
import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import Modal from './Modal';
import { Upload, File, Trash2, Search } from 'lucide-react';
import api from './api/AxiosInstance';

interface EvidenceModuleProps {
  addAuditEntry: (action: string, details: string) => void;
}

const EvidenceModule: React.FC<EvidenceModuleProps> = ({ addAuditEntry }) => {
  const [evidence, setEvidence] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('file', selectedFile);

    const uploadRes = await api.post("/upload/evidence", formData);
    const fileUrl = uploadRes.data.url;

    const item = {
      id: `E-${evidence.length + 1}`,
      title: newTitle,
      type: 'Manual',
      format: 'bin',
      fileUrl,
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    setEvidence([item, ...evidence]);

    const payload = {
      id: item.id,
      title: item.title,
      type: item.type,
      format: item.format,
      fileUrl: item.fileUrl,
      uploadedAt: item.uploadedAt
    }

    try {
      await api.post("/evidence/create-evidence", payload);
      console.log('Evidence metadata saved successfully:', payload);
    } catch (error) {
      console.error('Failed to save evidence metadata:', error);
      return null;
    }

    addAuditEntry('Upload Artifact', `Vault entry registered: ${item.id} - ${item.title}`);
    setIsModalOpen(false);
    setNewTitle('');
    setSelectedFile(null);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Permanently remove artifact ${title}?`)) return;
    setEvidence(prev => prev.filter(e => e.id !== id));
    addAuditEntry('Delete Artifact', `Vault entry purged: ${id} - ${title}`);
    await api.delete(`/evidence/delete-evidence/${id}`).then(() => console.log(`Evidence ${id} deleted successfully`));
  };

  useEffect(() => {
    try {
      const fetchEvidence = async () => {
        const response = await api.get("/evidence/get-evidences");
        setEvidence(response.data);
      };
      fetchEvidence();
    } catch (error) {
      console.error('Failed to fetch evidence:', error);
    }
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-light text-slate-900">Evidence Library</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Compliance artifacts repository</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-100">
          <Upload size={16} /> Upload Artifact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {evidence.map((ev) => (
          <GlassCard
            key={ev.id}
            className="flex flex-col items-center text-center bg-white group hover:border-blue-200 transition-all duration-300"
          >
            <div
              onClick={() => window.open(ev.fileUrl, '_blank')}
              className="w-16 h-16 bg-blue-50 rounded-2xl w-full flex items-center justify-center text-blue-600 mb-6 border border-blue-100 group-hover:scale-110 transition-transform hover:cursor-pointer">
              <File size={28} />
            </div>
            <h3 className="text-[13px] font-semibold text-slate-900 truncate w-full px-2">{ev.title}</h3>
            <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-bold tracking-widest">{ev.type} • {ev.format}</p>
            <div className="mt-6 pt-4 border-t border-slate-50 w-full flex justify-between items-center">
                <span className="text-[10px] text-slate-300 font-medium">{ev.uploadedAt.split("T")[0]}</span>
                <button onClick={() => handleDelete(ev.id, ev.title)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={14} />
                </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedFile(null)}} title="Upload Vault Entry">
        <form onSubmit={handleUpload} className="space-y-8">
          <label className="border-2 border-dashed border-slate-100 rounded-3xl p-12 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors mb-4">
                <Upload size={24} />
            </div>
            {selectedFile ? (
              <p className="text-sm text-slate-500 font-medium">{selectedFile.name}</p>
            ) : (
              <div>
                <p className="text-sm text-slate-500 font-medium">Drop artifacts here</p>
                <p className="text-[10px] text-slate-400 mt-2">Maximum file size 50MB</p>
              </div>
            )}
          </label>
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Document Title</label>
            <input required type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-blue-100">Confirm Upload</button>
        </form>
      </Modal>
    </div>
  );
};

export default EvidenceModule;
