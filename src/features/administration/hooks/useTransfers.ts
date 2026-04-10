import { useCallback } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { TransferRequest } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useTransfers() {
  const [requests, setRequests] = useLocalStorage<TransferRequest[]>(
    STORAGE_KEYS.TRANSFER_REQUESTS,
    []
  );

  const addRequest = useCallback((request: Omit<TransferRequest, 'id' | 'appliedAt' | 'status'>) => {
    const newRequest: TransferRequest = {
      ...request,
      id: Date.now().toString(),
      appliedAt: new Date().toISOString(),
      status: 'Pending'
    };
    setRequests(prev => [newRequest, ...prev]);
  }, [setRequests]);

  const updateStatus = useCallback((id: string, status: TransferRequest['status']) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, [setRequests]);

  const removeRequest = useCallback((id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  }, [setRequests]);

  return {
    requests,
    addRequest,
    updateStatus,
    removeRequest,
  };
}
