import React, { useState } from 'react';
import { CaseRecord } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card, Badge, Button, EmptyState } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { useNavigate } from 'react-router-dom';

import { useEmployeeContext } from '../contexts/EmployeeContext';

export const Calendar: React.FC = () => {
  const { cases } = useEmployeeContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'hearings' | 'deadlines'>('all');

  // Extract dates from cases
  const events = cases.flatMap(c => {
    const list = [];
    
    // Deadlines
    if (c.deadline) {
      list.push({
        id: `${c.id}_deadline`,
        caseId: c.id,
        title: `Deadline: ${c.title}`,
        date: c.deadline,
        type: 'deadline' as const,
        priority: c.priority,
        employeeId: c.employee_id
      });
    }

    // Court Hearings (stored in extras for court_case)
    if (c.case_type === 'court_case' && c.extras?.hearings) {
      const hearings = c.extras.hearings as { date: string; title: string }[];
      hearings.forEach((h, idx) => {
        list.push({
          id: `${c.id}_hearing_${idx}`,
          caseId: c.id,
          title: `Hearing: ${h.title || c.title}`,
          date: h.date,
          type: 'hearing' as const,
          priority: 'urgent' as const,
          employeeId: c.employee_id
        });
      });
    }

    return list;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredEvents = events.filter(e => {
    if (filter === 'hearings') return e.type === 'hearing';
    if (filter === 'deadlines') return e.type === 'deadline';
    return true;
  });

  const upcomingEvents = filteredEvents.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));
  const pastEvents = filteredEvents.filter(e => new Date(e.date) < new Date(new Date().setHours(0,0,0,0))).reverse();

  const renderEvent = (e: any) => (
    <Card 
      key={e.id} 
      variant="outlined" 
      className="mb-3 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer group"
      onClick={() => navigate(`/cases/${e.caseId}`)}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl shrink-0 ${
          e.type === 'hearing' ? 'bg-error-container/20 text-error' : 'bg-primary-container/20 text-primary'
        }`}>
          <AppIcon name={e.type === 'hearing' ? 'gavel' : 'event'} size={24} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-on-surface truncate group-hover:text-primary transition-colors">{e.title}</h4>
            <Badge label={new Date(e.date).toLocaleDateString()} color={e.type === 'hearing' ? 'error' : 'primary'} />
          </div>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1"><AppIcon name="person" size={14} /> ID: {e.employeeId}</span>
            <span className="flex items-center gap-1 uppercase font-bold tracking-tighter">
              <AppIcon name="priority_high" size={14} /> {e.priority}
            </span>
          </div>
        </div>
        
        <div className="self-center">
          <AppIcon name="chevron_right" className="text-outline-variant" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <PageHeader 
        title="Task Scheduler" 
        subtitle="Manage court dates, deadlines, and appointments"
      />

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <Button 
          variant={filter === 'all' ? 'filled' : 'tonal'} 
          label="All Events" 
          onClick={() => setFilter('all')} 
        />
        <Button 
          variant={filter === 'hearings' ? 'filled' : 'tonal'} 
          label="Court Hearings" 
          icon="gavel" 
          onClick={() => setFilter('hearings')} 
        />
        <Button 
          variant={filter === 'deadlines' ? 'filled' : 'tonal'} 
          label="Deadlines" 
          icon="timer" 
          onClick={() => setFilter('deadlines')} 
        />
      </div>

      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <EmptyState 
          icon="calendar_today" 
          title="No Scheduled Events" 
          description="Case deadlines and court hearings will appear here automatically."
          action={<Button variant="tonal" label="Go to Cases" onClick={() => navigate('/cases')} />}
        />
      ) : (
        <div className="space-y-8">
          {upcomingEvents.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 px-1">Upcoming Schedule</h3>
              {upcomingEvents.map(renderEvent)}
            </section>
          )}

          {pastEvents.length > 0 && (
            <section className="opacity-60">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4 px-1">Past Events</h3>
              {pastEvents.map(renderEvent)}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
