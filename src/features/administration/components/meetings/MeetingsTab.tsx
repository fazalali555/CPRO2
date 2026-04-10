import React, { useState } from 'react';
import { Button, Badge, TextField, Card } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useMeetings } from '../../hooks/useMeetings';
import { Meeting } from '../../types';
import { StatCard } from '../shared/StatCard';

export const MeetingsTab: React.FC = () => {
  const { isUrdu } = useLanguage();
  const { meetings, addMeeting, statistics } = useMeetings();
  
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState('');
  const [agenda, setAgenda] = useState('');
  const [minutes, setMinutes] = useState('');
  const [actionItems, setActionItems] = useState('');

  const handleAdd = () => {
    if (!title || !date) {
      alert('Please fill required fields');
      return;
    }

    addMeeting({
      title,
      date,
      participants: participants.split(',').map(p => p.trim()).filter(Boolean),
      agenda,
      minutes,
      actionItems: actionItems.split('\n').map(a => a.trim()).filter(Boolean),
    });

    setTitle('');
    setDate('');
    setParticipants('');
    setAgenda('');
    setMinutes('');
    setActionItems('');
    setShowForm(false);
  };

  const columns: Column<Meeting>[] = [
    {
      key: 'meeting',
      header: isUrdu ? 'اجلاس' : 'Meeting',
      render: (meeting) => (
        <div>
          <div className="font-bold">{meeting.title}</div>
          <div className="text-xs text-on-surface-variant">
            {new Date(meeting.date).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      key: 'participants',
      header: isUrdu ? 'شرکاء' : 'Participants',
      render: (meeting) => (
        <Badge 
          variant="default" 
          label={`${meeting.participants.length} ${isUrdu ? 'شرکاء' : 'People'}`} 
        />
      ),
      className: 'text-center',
    },
    {
      key: 'actions',
      header: isUrdu ? 'ایکشن آئٹمز' : 'Action Items',
      render: (meeting) => (
        <span className="font-mono font-bold text-warning">
          {meeting.actionItems.length}
        </span>
      ),
      className: 'text-center',
    },
    {
      key: 'details',
      header: isUrdu ? 'تفصیل' : 'Details',
      render: (meeting) => (
        <div className="text-xs max-w-xs">
          {meeting.agenda && (
            <div className="truncate">
              <span className="font-semibold">Agenda:</span> {meeting.agenda}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'view',
      header: isUrdu ? 'کارروائی' : 'Actions',
      render: (meeting) => (
        <Button 
          variant="text" 
          label={isUrdu ? 'منٹس' : 'View'} 
          icon="visibility"
          className="h-7 text-xs"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {isUrdu ? 'اجلاس اور منٹس' : 'Meetings & Minutes'}
        </h3>
        <Button 
          variant="filled" 
          label={isUrdu ? 'نیا اجلاس' : 'New Meeting'} 
          icon="add" 
          onClick={() => setShowForm(!showForm)} 
        />
      </div>

      {/* Statistics */}
      <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        <StatCard 
          label={isUrdu ? 'کل اجلاس' : 'Total Meetings'} 
          value={statistics.total.toString()} 
          icon="event" 
          color="text-primary" 
        />
        <StatCard 
          label={isUrdu ? 'آج' : 'Today'} 
          value={statistics.today.toString()} 
          icon="today" 
          color="text-blue-500" 
        />
        <StatCard 
          label={isUrdu ? 'اس ماہ' : 'This Month'} 
          value={statistics.thisMonth.toString()} 
          icon="calendar_month" 
          color="text-green-500" 
        />
        <StatCard 
          label={isUrdu ? 'شرکاء' : 'Participants'} 
          value={statistics.totalParticipants.toString()} 
          icon="groups" 
          color="text-purple-500" 
        />
        <StatCard 
          label={isUrdu ? 'ایکشن آئٹمز' : 'Action Items'} 
          value={statistics.totalActionItems.toString()} 
          icon="task_alt" 
          color="text-warning" 
        />
      </div>

      {/* Add Meeting Form */}
      {showForm && (
        <Card variant="outlined" className="bg-surface p-4">
          <h4 className="font-bold mb-4">{isUrdu ? 'نیا اجلاس ریکارڈ' : 'New Meeting Record'}</h4>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
            <TextField 
              label={isUrdu ? 'عنوان' : 'Title'} 
              icon="title" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Monthly Review Meeting"
              required
            />
            <TextField 
              label={isUrdu ? 'تاریخ' : 'Date'} 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              required
            />
            <TextField 
              label={isUrdu ? 'شرکاء (کاما سے جدا)' : 'Participants (comma-separated)'} 
              icon="groups" 
              value={participants} 
              onChange={e => setParticipants(e.target.value)}
              placeholder="John Doe, Jane Smith, etc."
              className="md:col-span-2"
            />
            <TextField 
              label={isUrdu ? 'ایجنڈا' : 'Agenda'} 
              icon="list_alt" 
              value={agenda} 
              onChange={e => setAgenda(e.target.value)}
              placeholder="Meeting agenda/purpose"
              className="md:col-span-2"
            />
            <TextField 
              label={isUrdu ? 'منٹس' : 'Minutes'} 
              icon="description" 
              value={minutes} 
              onChange={e => setMinutes(e.target.value)}
              placeholder="Meeting minutes summary"
              className="md:col-span-2"
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                {isUrdu ? 'ایکشن آئٹمز (ہر لائن)' : 'Action Items (one per line)'}
              </label>
              <textarea
                className="w-full p-3 border border-outline rounded-lg bg-surface-variant/10 focus:outline-none focus:border-primary resize-y min-h-[100px]"
                value={actionItems}
                onChange={e => setActionItems(e.target.value)}
                placeholder="Action item 1&#10;Action item 2&#10;Action item 3"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button 
              variant="outlined" 
              label={isUrdu ? 'منسوخ' : 'Cancel'} 
              onClick={() => setShowForm(false)} 
            />
            <Button 
              variant="filled" 
              label={isUrdu ? 'محفوظ' : 'Save'} 
              icon="save" 
              onClick={handleAdd} 
            />
          </div>
        </Card>
      )}

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <Card variant="outlined" className="bg-surface p-12 text-center">
          <AppIcon name="event" size={64} className="mx-auto mb-4 opacity-20" />
          <h4 className="font-bold text-lg mb-2">
            {isUrdu ? 'کوئی اجلاس ریکارڈ نہیں' : 'No Meeting Records'}
          </h4>
          <p className="text-sm text-on-surface-variant mb-4">
            {isUrdu 
              ? 'اجلاس کے ریکارڈ یہاں ظاہر ہوں گے'
              : 'Start by adding your first meeting record'
            }
          </p>
        </Card>
      ) : (
        <>
          <DataTable
            data={meetings}
            columns={columns}
            emptyState={{
              icon: 'event',
              title: isUrdu ? 'کوئی اجلاس نہیں' : 'No meetings',
              description: isUrdu ? 'اجلاس کے ریکارڈ یہاں ظاہر ہوں گے' : 'Meeting records will appear here',
            }}
          />

          {/* Recent Meetings Detail Cards */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-on-surface-variant">
              {isUrdu ? 'حالیہ اجلاسات کی تفصیلات' : 'Recent Meeting Details'}
            </h4>
            {meetings.slice(0, 3).map(meeting => (
              <Card key={meeting.id} variant="outlined" className="bg-surface p-4">
                <div className={`flex justify-between items-start mb-3 ${isUrdu ? 'flex-row-reverse text-right' : ''}`}>
                  <div>
                    <h5 className="font-bold">{meeting.title}</h5>
                    <div className="text-xs text-on-surface-variant mt-1">
                      {new Date(meeting.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge 
                    variant="primary" 
                    label={`${meeting.participants.length} ${isUrdu ? 'شرکاء' : 'Participants'}`} 
                  />
                </div>
                
                {meeting.participants.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold mb-1">
                      {isUrdu ? 'شرکاء:' : 'Participants:'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {meeting.participants.map((p, i) => (
                        <span key={i} className="text-xs bg-surface-variant px-2 py-1 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {meeting.actionItems.length > 0 && (
                  <div className={isUrdu ? 'text-right' : ''}>
                    <div className="text-xs font-semibold mb-2">
                      {isUrdu ? 'ایکشن آئٹمز:' : 'Action Items:'}
                    </div>
                    <ul className="space-y-1">
                      {meeting.actionItems.map((item, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <AppIcon name="check_circle" size={14} className="text-success mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Info Panel */}
      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
        <AppIcon name="tips_and_updates" className="text-primary mt-1" />
        <div className={isUrdu ? 'text-right' : ''}>
          <h5 className="font-bold text-primary text-sm">
            {isUrdu ? 'اجلاس ٹپس' : 'Meeting Management Tips'}
          </h5>
          <ul className="text-xs text-on-surface-variant list-disc list-inside space-y-1 mt-1">
            <li>{isUrdu ? 'اجلاس کے فوراً بعد منٹس ریکارڈ کریں' : 'Record minutes immediately after meeting'}</li>
            <li>{isUrdu ? 'ایکشن آئٹمز واضح اور قابل عمل بنائیں' : 'Make action items clear and actionable'}</li>
            <li>{isUrdu ? 'شرکاء کی فہرست مکمل رکھیں' : 'Keep complete participant lists'}</li>
            <li>{isUrdu ? 'اگلے اجلاس میں فالو اپ کریں' : 'Follow up in next meeting'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
