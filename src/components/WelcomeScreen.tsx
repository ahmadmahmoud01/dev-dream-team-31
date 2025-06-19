// WelcomeScreen.tsx (Fixed)
import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getRoleConfig } from '@/config/roleConfig';
import { getTranslations } from '@/utils/translations';
import { AIRole, Language } from '@/types/chat';
import SRSModal from '@/components/modals/SRSModal';
import AzureDevOpsTasksModal from '@/components/modals/AzureDevOpsTasksModal';
import TestCasesModal from '@/components/modals/TestCasesModal';
import { azureDevOpsService } from '@/services/azureDevOpsService';
import { testCasesService } from '@/services/testCasesService';

interface WelcomeScreenProps {
  selectedRole: AIRole;
  language: Language;
  onExampleClick: (example: string) => void;
  onSRSGenerate?: (data: { projectDescription?: string; file?: File }) => void;
}

// Updated interfaces to match your service (removed personalAccessToken since it's hardcoded)
interface AzureDevOpsTasksData {
  srsFile: File; // Required, not optional
  organization: string;
  project: string;
  assignTo: string;
}

interface TestCasesData {
  srsFile: File; // Required, not optional
  organization: string;
  project: string;
  assignToTester: string;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  selectedRole,
  language,
  onExampleClick,
  onSRSGenerate,
}) => {
  const [isSRSModalOpen, setIsSRSModalOpen] = useState(false);
  const [isAzureTasksModalOpen, setIsAzureTasksModalOpen] = useState(false);
  const [isTestCasesModalOpen, setIsTestCasesModalOpen] = useState(false);
  
  const t = getTranslations(language);
  const roleConfig = getRoleConfig(language);
  const currentRole = roleConfig[selectedRole];
  const RoleIcon = currentRole.icon;

  const handleExampleClick = (example: string) => {
    const lowerExample = example.toLowerCase();
    
    // Check if this is the SRS generation example
    if (selectedRole === 'generate-srs' && 
        lowerExample.includes('software requirements specification')) {
      setIsSRSModalOpen(true);
    }
    // Check if this is the Azure DevOps tasks creation example
    else if (selectedRole === 'generate-srs' && 
             lowerExample.includes('create tasks from generated srs')) {
      setIsAzureTasksModalOpen(true);
    }
    // Check if this is the test cases creation example
    else if (selectedRole === 'generate-srs' && 
             lowerExample.includes('create testcases from generated srs')) {
      setIsTestCasesModalOpen(true);
    }
    else {
      onExampleClick(example);
    }
  };

  const handleSRSSubmit = (data: { projectDescription?: string; file?: File }) => {
    if (onSRSGenerate) {
      onSRSGenerate(data);
    }
    setIsSRSModalOpen(false);
  };

  // Fixed Azure DevOps Tasks handler - now actually calls the service
  const handleAzureTasksSubmit = async (data: AzureDevOpsTasksData) => {
    console.log('handleAzureTasksSubmit called with:', data);
    
    try {
      // Actually call the service here
      const result = await azureDevOpsService.createTasksFromSRS(data);
      console.log('Service result:', result);
      
      if (result.success) {
        alert(result.message);
        if (result.details) {
          console.log('Task creation details:', result.details);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error in handleAzureTasksSubmit:', error);
      alert('An error occurred while creating tasks: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    setIsAzureTasksModalOpen(false);
  };

  // Fixed Test Cases handler - now actually calls the service
  const handleTestCasesSubmit = async (data: TestCasesData) => {
    console.log('handleTestCasesSubmit called with:', data);
    
    try {
      // Actually call the service here
      const result = await testCasesService.createTestCasesFromSRS(data);
      console.log('Test cases service result:', result);
      
      if (result.success) {
        alert(result.message);
        if (result.details) {
          console.log('Test case creation details:', result.details);
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error in handleTestCasesSubmit:', error);
      alert('An error occurred while creating test cases: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    
    setIsTestCasesModalOpen(false);
  };

  return (
    <>
      <div className="text-center py-8">
        <div className={`inline-flex p-4 rounded-full ${currentRole.color} text-white mb-4`}>
          <RoleIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t.hello} {currentRole.name}
        </h3>
        <p className="text-gray-600 mb-6">{currentRole.description}</p>
        
        {/* Examples Section */}
        <div className="bg-gray-50 rounded-lg p-6 mb-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h4 className="text-md font-medium text-gray-800">{t.examples}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentRole.examples.map((example, index) => (
              <Card
                key={index}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500 bg-white"
                onClick={() => handleExampleClick(example)}
              >
                <p className="text-sm text-gray-700 text-right">{example}</p>
              </Card>
            ))}
          </div>
        </div>
        
        <p className="text-sm text-gray-500">
          {t.getStarted}
        </p>
      </div>

      {/* SRS Modal */}
      <SRSModal
        isOpen={isSRSModalOpen}
        onClose={() => setIsSRSModalOpen(false)}
        onSubmit={handleSRSSubmit}
        language={language}
      />

      {/* Azure DevOps Tasks Modal */}
      <AzureDevOpsTasksModal
        isOpen={isAzureTasksModalOpen}
        onClose={() => setIsAzureTasksModalOpen(false)}
        onSubmit={handleAzureTasksSubmit}
        language={language}
      />

      {/* Test Cases Modal */}
      <TestCasesModal
        isOpen={isTestCasesModalOpen}
        onClose={() => setIsTestCasesModalOpen(false)}
        onSubmit={handleTestCasesSubmit}
        language={language}
      />
    </>
  );
};

export default WelcomeScreen;
