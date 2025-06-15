
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Language } from '@/types/chat';
import { Search, ExternalLink, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRepositoryAccess } from '@/hooks/useRepositoryAccess';
import ConnectionTypeSelector from './ConnectionTypeSelector';
import RepositoryList from './RepositoryList';
import SelectedRepositoryDisplay from './SelectedRepositoryDisplay';

interface QuickRepositoryAccessProps {
  language: Language;
  isOpen: boolean;
  onToggle: () => void;
}

const QuickRepositoryAccess: React.FC<QuickRepositoryAccessProps> = ({
  language,
  isOpen,
  onToggle
}) => {
  const {
    searchTerm,
    setSearchTerm,
    repositories,
    isLoading,
    selectedRepository,
    selectedConnectionType,
    showConnectionSelection,
    handleSelectRepository,
    handleConnectionTypeSelect,
    handleBackToConnectionSelection,
    fetchRepositories
  } = useRepositoryAccess();

  if (showConnectionSelection) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200">
        <ConnectionTypeSelector
          language={language}
          onSelectConnectionType={handleConnectionTypeSelect}
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToConnectionSelection}
              className="p-2"
            >
              {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </Button>
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'ar' ? 'اختيار مستودع' : 'Select Repository'}
            </h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchRepositories} 
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Connection Type Display */}
        {selectedConnectionType && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
            <span className="font-medium">
              {language === 'ar' ? 'نوع الاتصال:' : 'Connection Type:'}
            </span>
            <span className="text-blue-600">
              {selectedConnectionType === 'github' && 'GitHub'}
              {selectedConnectionType === 'bitbucket' && 'Bitbucket'}
              {selectedConnectionType === 'devops' && 'Azure DevOps'}
              {selectedConnectionType === 'devops-user' && (language === 'ar' ? 'مستخدم DevOps' : 'DevOps User')}
              {selectedConnectionType === 'security' && (language === 'ar' ? 'مستخدم الأمان' : 'Security User')}
            </span>
          </div>
        )}

        {/* Selected Repository Display */}
        {selectedRepository && (
          <SelectedRepositoryDisplay
            language={language}
            selectedRepository={selectedRepository}
          />
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={language === 'ar' ? 'البحث في المستودعات...' : 'Search repositories...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Repository List */}
        <div className="max-h-80 overflow-y-auto">
          <RepositoryList
            language={language}
            repositories={repositories}
            isLoading={isLoading}
            selectedRepository={selectedRepository}
            onSelectRepository={handleSelectRepository}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickRepositoryAccess;
