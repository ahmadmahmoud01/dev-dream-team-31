
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Language } from '@/types/chat';
import { Search, ExternalLink, Loader2, Settings } from 'lucide-react';
import { useRepositoryAccess } from '@/hooks/useRepositoryAccess';
import { useRepositoryConnection } from '@/hooks/useRepositoryConnection';
import ConnectionTypeSelector from './ConnectionTypeSelector';
import CustomProviderConfig from './CustomProviderConfig';
import RepositoryList from './RepositoryList';
import RepositoryConnectionStatus from './RepositoryConnectionStatus';

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
    showCustomConfig,
    customProviders,
    handleSelectRepository,
    handleConnectionTypeSelect,
    handleShowConnectionSelection,
    handleBackToConnectionSelection,
    handleBackFromCustomConfig,
    saveCustomProvider,
    fetchRepositories
  } = useRepositoryAccess();

  const {
    status: connectionStatus,
    connect,
    disconnect,
    refresh,
    setSelectedRepository: setConnectionRepository
  } = useRepositoryConnection();

  // تحديث حالة الاتصال عند تغيير المستودع المحدد
  React.useEffect(() => {
    setConnectionRepository(selectedRepository);
  }, [selectedRepository, setConnectionRepository]);

  const handleConnect = async () => {
    if (selectedRepository) {
      await connect(selectedRepository);
    }
  };

  if (showCustomConfig) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200">
        <CustomProviderConfig
          language={language}
          onBack={handleBackFromCustomConfig}
          onSave={saveCustomProvider}
        />
      </div>
    );
  }

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
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'ar' ? 'ربط المستودع' : 'Repository Connection'}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowConnectionSelection}
              className="text-gray-600 hover:text-gray-700"
            >
              <Settings className="w-4 h-4" />
            </Button>
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
        </div>

        {/* Connection Status */}
        <RepositoryConnectionStatus
          language={language}
          selectedRepository={selectedRepository}
          connectionStatus={connectionStatus}
          onConnect={handleConnect}
          onDisconnect={disconnect}
          onRefresh={refresh}
        />

        {/* Current Connection Type Display */}
        {selectedConnectionType && (
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <span className="text-sm text-gray-600">
              {language === 'ar' ? 'نوع الاتصال:' : 'Connection Type:'} 
              <span className="font-medium ml-1">
                {selectedConnectionType === 'custom' 
                  ? (customProviders[0]?.name || (language === 'ar' ? 'مزود مخصص' : 'Custom Provider'))
                  : selectedConnectionType
                }
              </span>
            </span>
          </div>
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
