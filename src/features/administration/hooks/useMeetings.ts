import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Meeting } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useMeetings() {
  const [meetings, setMeetings] = useLocalStorage<Meeting[]>(
    STORAGE_KEYS.MEETINGS,
    []
  );

  const addMeeting = useCallback((meeting: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = {
      ...meeting,
      id: Date.now().toString(),
    };
    setMeetings(prev => [newMeeting, ...prev]);
    return newMeeting;
  }, [setMeetings]);

  const updateMeeting = useCallback((id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, [setMeetings]);

  const deleteMeeting = useCallback((id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  }, [setMeetings]);

  const statistics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    return {
      total: meetings.length,
      today: meetings.filter(m => m.date === today).length,
      thisMonth: meetings.filter(m => m.date.startsWith(thisMonth)).length,
      totalParticipants: meetings.reduce((sum, m) => sum + m.participants.length, 0),
      totalActionItems: meetings.reduce((sum, m) => sum + m.actionItems.length, 0),
    };
  }, [meetings]);

  return {
    meetings,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    statistics,
  };
}
