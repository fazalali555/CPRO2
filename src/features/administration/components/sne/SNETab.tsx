import React, { useState } from 'react';
import { Button, Badge, TextField } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useSNEData } from '../../hooks/useSNEData';
import { SanctionedPost } from '../../types';
import { StatCard } from '../shared/StatCard';

export const SNETab: React.FC = () => {
  const { t, isUrdu } = useLanguage();
  const { posts, statistics, addPost } = useSNEData();
  
  const [designation, setDesignation] = useState('');
  const [bps, setBps] = useState('');
  const [sanctioned, setSanctioned] = useState('');

  const handleAddPost = () => {
    if (!designation.trim() || !bps || !sanctioned) return;
    
    addPost({
      designation: designation.trim(),
      bps: Number(bps),
      sanctioned: Number(sanctioned),
    });
    
    setDesignation('');
    setBps('');
    setSanctioned('');
  };

  const columns: Column<SanctionedPost>[] = [
    {
      key: 'designation',
      header: t.admin.designation,
      render: (post) => <span className="font-medium">{post.designation}</span>,
    },
    {
      key: 'bps',
      header: t.admin.bps,
      render: (post) => <span className="font-mono text-on-surface-variant">BPS-{post.bps}</span>,
    },
    {
      key: 'sanctioned',
      header: t.admin.totalSanctioned,
      render: (post) => <span className="font-mono">{post.sanctioned}</span>,
      className: 'text-center',
    },
    {
      key: 'filled',
      header: t.admin.totalFilled,
      render: (post) => <span className="font-mono">{post.filled}</span>,
      className: 'text-center',
    },
    {
      key: 'vacant',
      header: t.admin.totalVacant,
      render: (post) => <span className="font-mono font-bold text-error">{post.vacant}</span>,
      className: 'text-center',
    },
    {
      key: 'status',
      header: t.admin.status,
      render: (post) => (
        post.vacant > 0 ? (
          <Badge variant="error" label={t.admin.recruitmentNeeded} />
        ) : (
          <Badge variant="success" label={t.admin.optimal} />
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {t.admin.sneStrength}
        </h3>
        <Button 
          variant="filled" 
          label={t.admin.addSanctionedPost} 
          icon="add_business" 
          onClick={handleAddPost} 
        />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        <TextField 
          label={t.admin.designation} 
          icon="work" 
          value={designation} 
          onChange={e => setDesignation(e.target.value)} 
        />
        <TextField 
          label={t.admin.bps} 
          icon="grade" 
          type="number" 
          value={bps} 
          onChange={e => setBps(e.target.value)} 
        />
        <TextField 
          label={t.admin.totalSanctioned} 
          icon="inventory" 
          type="number" 
          value={sanctioned} 
          onChange={e => setSanctioned(e.target.value)} 
        />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        <StatCard 
          label={t.admin.totalSanctioned} 
          value={statistics.totalSanctioned.toString()} 
          icon="inventory" 
          color="text-primary" 
        />
        <StatCard 
          label={t.admin.totalFilled} 
          value={statistics.totalFilled.toString()} 
          icon="person_check" 
          color="text-success" 
        />
        <StatCard 
          label={t.admin.totalVacant} 
          value={statistics.totalVacant.toString()} 
          icon="person_remove" 
          color="text-error" 
        />
      </div>

      <DataTable
        data={posts}
        columns={columns}
        emptyState={{
          icon: 'business',
          title: 'No SNE records found',
          description: 'Add sanctioned posts to start monitoring.',
        }}
      />

      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
        <AppIcon name="auto_awesome" className="text-primary mt-1" />
        <div className={isUrdu ? 'text-right' : ''}>
          <h5 className="font-bold text-primary text-sm">{t.admin.automatedTracking}</h5>
          <p className="text-xs text-on-surface-variant">
            SNE strength is automatically calculated based on employee records.
          </p>
        </div>
      </div>
    </div>
  );
};
