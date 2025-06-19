// components/modals/AzureDevOpsTasksModal.tsx
import React, { useState } from 'react';
import { X, Upload, FileText, Settings, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getTranslations } from '@/utils/translations';
import { Language } from '@/types/chat';

interface AzureDevOpsTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AzureDevOpsTasksData) => Promise<void>; // Changed to Promise<void>
  language: Language;
}

interface AzureDevOpsTasksData {
  srsFile: File;
  organization: string;
  project: string;
  assignTo: string;
}

const AzureDevOpsTasksModal: React.FC<AzureDevOpsTasksModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  language
}) => {
  const [srsFile, setSrsFile] = useState<File | null>(null);
  const [organization, setOrganization] = useState('');
  const [project, setProject] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const t = getTranslations(language);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!srsFile || !organization || !project || !assignTo) {
    alert('Please fill in all required fields');
    return;
  }

  setIsProcessing(true);
  
  try {
    await onSubmit({
      srsFile,
      organization,
      project,
      assignTo
    });
  } catch (error) {
    console.error('Error creating tasks:', error);
  } finally {
    setIsProcessing(false);
  }
};


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSrsFile(file);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const resetForm = () => {
    setSrsFile(null);
    setOrganization('');
    setProject('');
    setAssignTo('');
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
            Upload SRS and Create Azure DevOps Tasks
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Upload SRS File */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Upload SRS File</h3>
              </div>
              
              <div>
                <label htmlFor="srsFileUpload" className="block text-sm font-medium text-gray-700 mb-2">
                  SRS File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    id="srsFileUpload"
                    type="file"
                    onChange={handleFileChange}
                    accept=".txt,.doc,.docx,.pdf,.md"
                    className="hidden"
                    //required
                    //{...(!srsFile && { required: true })}
                    disabled={isProcessing}
                  />
                  <label htmlFor="srsFileUpload" className="cursor-pointer">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {srsFile ? srsFile.name : 'Drop File Here\nor\nClick to Upload'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports: TXT, DOC, DOCX, PDF, MD
                    </p>
                  </label>
                </div>
                {srsFile && (
                  <div className="flex items-center space-x-2 mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">{srsFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSrsFile(null)}
                      className="ml-auto text-green-600 hover:text-green-800"
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Azure DevOps Configuration */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">Azure DevOps Configuration</h3>
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-white bg-purple-600 px-2 py-1 rounded-t-md">
                  Organization
                </label>
                <input
                  id="organization"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="your-org"
                  className="w-full px-3 py-2 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-100"
                  required
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label htmlFor="project" className="block text-sm font-medium text-white bg-purple-600 px-2 py-1 rounded-t-md">
                  Project
                </label>
                <input
                  id="project"
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="your-project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-100"
                  required
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label htmlFor="assignTo" className="block text-sm font-medium text-white bg-purple-600 px-2 py-1 rounded-t-md">
                  Assign To (Email)
                </label>
                <input
                  id="assignTo"
                  type="email"
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-100"
                  required
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">How it works:</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Upload your SRS document (generated or existing)</li>
                  <li>• AI will extract development tasks from the SRS content</li>
                  <li>• Tasks will be automatically created in your Azure DevOps project</li>
                  <li>• Each task will include title, description, and priority</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isProcessing ||
                !srsFile ||
                !organization ||
                !project ||
                !assignTo
              }
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center space-x-2"
            >
              {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isProcessing ? 'Creating Tasks...' : 'Extract Tasks & Create in Azure DevOps'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AzureDevOpsTasksModal;
