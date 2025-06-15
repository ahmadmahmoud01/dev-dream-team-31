
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Language } from '@/types/chat';
import { Search, ExternalLink, Loader2, Github, GitBranch, Settings, Database, Folder, Server, Shield } from 'lucide-react';
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

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'devops':
        return <Settings className="w-4 h-4" />;
      case 'devops-user':
        return <Server className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'bitbucket':
        return <GitBranch className="w-4 h-4" />;
      case 'jira':
      case 'clickup':
        return <Database className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  const getSourceName = (source: string) => {
    const names = {
      'ar': {
        'github': 'GitHub',
        'jira': 'Jira',
        'clickup': 'ClickUp',
        'devops': 'Azure DevOps',
        'devops-user': 'مستخدم DevOps',
        'security': 'مستخدم الأمان',
        'bitbucket': 'Bitbucket',
        'axure': 'Axure'
      },
      'en': {
        'github': 'GitHub',
        'jira': 'Jira',
        'clickup': 'ClickUp',
        'devops': 'Azure DevOps',
        'devops-user': 'DevOps User',
        'security': 'Security User',
        'bitbucket': 'Bitbucket',
        'axure': 'Axure'
      }
    };
    return names[language][source as keyof typeof names[typeof language]] || source;
  };

  if (showConnectionSelection) {
    return (
      <ConnectionTypeSelector
        language={language}
        onSelectConnectionType={handleConnectionTypeSelect}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToConnectionSelection}
            className="p-1"
          >
            ←
          </Button>
          <h3 className="text-lg font-semibold">
            {language === 'ar' ? 'اختيار مستودع' : 'Select Repository'}
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchRepositories} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
        </Button>
      </div>

      {selectedConnectionType && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          {getSourceIcon(selectedConnectionType)}
          <span>{getSourceName(selectedConnectionType)}</span>
        </div>
      )}

      {selectedRepository && (
        <SelectedRepositoryDisplay
          language={language}
          selectedRepository={selectedRepository}
        />
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={language === 'ar' ? 'البحث في المستودعات...' : 'Search repositories...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <RepositoryList
        language={language}
        repositories={repositories}
        isLoading={isLoading}
        selectedRepository={selectedRepository}
        onSelectRepository={handleSelectRepository}
      />
    </div>
  );
};

export default QuickRepositoryAccess;
