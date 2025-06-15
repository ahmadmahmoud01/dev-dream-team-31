
import { useState, useCallback } from 'react';
import { Project } from '@/types/integrations';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface RepositoryConnectionState {
  status: ConnectionStatus;
  selectedRepository: { source: string; project: Project } | null;
  lastConnected: Date | null;
  error: string | null;
}

export const useRepositoryConnection = () => {
  const [connectionState, setConnectionState] = useState<RepositoryConnectionState>({
    status: 'disconnected',
    selectedRepository: null,
    lastConnected: null,
    error: null
  });

  const connect = useCallback(async (repository: { source: string; project: Project }) => {
    setConnectionState(prev => ({ 
      ...prev, 
      status: 'connecting',
      selectedRepository: repository,
      error: null 
    }));

    try {
      // محاكاة عملية الاتصال
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // محاكاة نجاح أو فشل الاتصال بشكل عشوائي
      const isSuccess = Math.random() > 0.2; // 80% success rate
      
      if (isSuccess) {
        setConnectionState(prev => ({
          ...prev,
          status: 'connected',
          lastConnected: new Date(),
          error: null
        }));
        
        // حفظ حالة الاتصال في localStorage
        localStorage.setItem('repository-connection', JSON.stringify({
          repository,
          connectedAt: new Date().toISOString()
        }));
        
        console.log('Successfully connected to repository:', repository);
      } else {
        throw new Error('Connection failed - Invalid credentials or network error');
      }
    } catch (error) {
      console.error('Repository connection error:', error);
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown connection error'
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnectionState({
      status: 'disconnected',
      selectedRepository: null,
      lastConnected: null,
      error: null
    });
    
    // إزالة حالة الاتصال من localStorage
    localStorage.removeItem('repository-connection');
    console.log('Repository disconnected');
  }, []);

  const refresh = useCallback(async () => {
    if (!connectionState.selectedRepository) return;
    
    setConnectionState(prev => ({ ...prev, status: 'connecting', error: null }));
    
    try {
      // محاكاة تحديث الاتصال
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConnectionState(prev => ({
        ...prev,
        status: 'connected',
        lastConnected: new Date(),
        error: null
      }));
      
      console.log('Repository connection refreshed');
    } catch (error) {
      console.error('Repository refresh error:', error);
      setConnectionState(prev => ({
        ...prev,
        status: 'error',
        error: 'Failed to refresh connection'
      }));
    }
  }, [connectionState.selectedRepository]);

  const setSelectedRepository = useCallback((repository: { source: string; project: Project } | null) => {
    setConnectionState(prev => ({
      ...prev,
      selectedRepository: repository,
      status: repository ? prev.status : 'disconnected'
    }));
  }, []);

  return {
    ...connectionState,
    connect,
    disconnect,
    refresh,
    setSelectedRepository
  };
};
