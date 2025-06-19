// components/modals/SRSModal.tsx
import React, { useState } from 'react';
import { X, Upload, FileText, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { srsService } from '@/services/srsService';
import { getTranslations } from '@/utils/translations';
import { Language } from '@/types/chat';

interface SRSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { projectDescription?: string; file?: File }) => void;
  language: Language;
}

const SRSModal: React.FC<SRSModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  language
}) => {
  const [projectDescription, setProjectDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSRS, setGeneratedSRS] = useState<string>('');
  
  const t = getTranslations(language);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsGenerating(true);
    
    try {
      let result;
      
      if (activeTab === 'text' && projectDescription.trim()) {
        result = await srsService.generateSRSFromDescription(projectDescription.trim());
      } else if (activeTab === 'file' && uploadedFile) {
        result = await srsService.generateSRSFromFile(uploadedFile);
      } else {
        alert('Please provide either a project description or upload a file.');
        setIsGenerating(false);
        return;
      }

      if (result.success && result.content) {
        setGeneratedSRS(result.content);
        onSubmit(activeTab === 'text' ? { projectDescription: projectDescription.trim() } : { file: uploadedFile! });
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSRS = async () => {
    if (!generatedSRS) return;
    
    const blob = await srsService.createWordDocument(generatedSRS);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SRS_Document_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const resetForm = () => {
    setProjectDescription('');
    setUploadedFile(null);
    setActiveTab('text');
    setGeneratedSRS('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Generate Software Requirements Specification
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isGenerating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'text'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={isGenerating}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Text Input
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'file'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={isGenerating}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                File Upload
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description
                  </label>
                  <textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe your software project in detail..."
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required={activeTab === 'text'}
                    disabled={isGenerating}
                  />
                </div>
              </div>
            )}

            {activeTab === 'file' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Project Document
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      id="fileUpload"
                      type="file"
                      onChange={handleFileChange}
                      accept=".txt,.docx"
                      className="hidden"
                      required={activeTab === 'file'}
                      disabled={isGenerating}
                    />
                    <label htmlFor="fileUpload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports: TXT, DOCX
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Generated SRS Preview */}
            {generatedSRS && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Generated SRS</h3>
                  <button
                    type="button"
                    onClick={downloadSRS}
                    className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto p-4 bg-gray-50 border rounded-md">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {generatedSRS}
                  </pre>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isGenerating ||
                  (activeTab === 'text' && !projectDescription.trim()) ||
                  (activeTab === 'file' && !uploadedFile)
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center space-x-2"
              >
                {isGenerating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isGenerating ? 'Generating...' : 'Generate SRS'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SRSModal;
