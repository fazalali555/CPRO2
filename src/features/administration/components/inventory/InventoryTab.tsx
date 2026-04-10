import React, { useState } from 'react';
import { Button, Badge, TextField, Card } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useInventory } from '../../hooks/useInventory';
import { InventoryItem } from '../../types';
import { StatCard } from '../shared/StatCard';

export const InventoryTab: React.FC = () => {
  const { isUrdu } = useLanguage();
  const { items, addItem, adjustQuantity, statistics } = useInventory();
  
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [qty, setQty] = useState('');
  const [reorder, setReorder] = useState('');
  const [unit, setUnit] = useState('');

  const handleAdd = () => {
    if (!name || !qty) {
      alert('Please fill required fields');
      return;
    }

    addItem({
      name,
      category,
      qty: Number(qty) || 0,
      reorder: Number(reorder) || 0,
      unit: unit || 'pcs',
    });

    setName('');
    setCategory('');
    setQty('');
    setReorder('');
    setUnit('');
    setShowForm(false);
  };

  const columns: Column<InventoryItem>[] = [
    {
      key: 'name',
      header: isUrdu ? 'آئٹم' : 'Item Name',
      render: (item) => (
        <div>
          <div className="font-medium">{item.name}</div>
          {item.category && (
            <div className="text-xs text-on-surface-variant">{item.category}</div>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: isUrdu ? 'اسٹاک' : 'Stock',
      render: (item) => (
        <div className="font-mono">
          <span className={`font-bold ${
            item.qty === 0 ? 'text-error' : 
            item.qty <= item.reorder ? 'text-warning' : 
            'text-success'
          }`}>
            {item.qty}
          </span>
          <span className="text-on-surface-variant"> {item.unit}</span>
        </div>
      ),
      className: 'text-center',
    },
    {
      key: 'reorder',
      header: isUrdu ? 'ری آرڈر' : 'Reorder Level',
      render: (item) => (
        <span className="font-mono text-sm">{item.reorder} {item.unit}</span>
      ),
      className: 'text-center',
    },
    {
      key: 'status',
      header: isUrdu ? 'حالت' : 'Status',
      render: (item) => {
        if (item.qty === 0) {
          return <Badge variant="error" label={isUrdu ? 'ختم' : 'Out of Stock'} />;
        }
        if (item.qty <= item.reorder) {
          return <Badge variant="warning" label={isUrdu ? 'کم' : 'Low Stock'} />;
        }
        return <Badge variant="success" label={isUrdu ? 'دستیاب' : 'Available'} />;
      },
    },
    {
      key: 'actions',
      header: isUrdu ? 'کارروائی' : 'Actions',
      render: (item) => (
        <div className="flex gap-1">
          <Button 
            variant="text" 
            label="+10" 
            onClick={() => adjustQuantity(item.id, 10)}
            className="h-7 text-[10px] px-2"
          />
          <Button 
            variant="text" 
            label="+1" 
            onClick={() => adjustQuantity(item.id, 1)}
            className="h-7 text-[10px] px-2"
          />
          <Button 
            variant="outlined" 
            label="-1" 
            onClick={() => adjustQuantity(item.id, -1)}
            className="h-7 text-[10px] px-2"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {isUrdu ? 'انوینٹری مینجمنٹ' : 'Inventory Management'}
        </h3>
        <div className="flex gap-2">
          <Button variant="outlined" label={isUrdu ? 'ایکسپورٹ' : 'Export'} icon="download" />
          <Button 
            variant="filled" 
            label={isUrdu ? 'نیا آئٹم' : 'New Item'} 
            icon="add" 
            onClick={() => setShowForm(!showForm)} 
          />
        </div>
      </div>

      {/* Statistics */}
      <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        <StatCard 
          label={isUrdu ? 'کل اقسام' : 'Total Types'} 
          value={statistics.total.toString()} 
          icon="inventory_2" 
          color="text-primary" 
        />
        <StatCard 
          label={isUrdu ? 'کل آئٹمز' : 'Total Items'} 
          value={statistics.totalItems.toString()} 
          icon="all_inbox" 
          color="text-blue-500" 
        />
        <StatCard 
          label={isUrdu ? 'کم اسٹاک' : 'Low Stock'} 
          value={statistics.lowStock.toString()} 
          icon="warning" 
          color="text-warning" 
        />
        <StatCard 
          label={isUrdu ? 'ختم' : 'Out of Stock'} 
          value={statistics.outOfStock.toString()} 
          icon="block" 
          color="text-error" 
        />
        <StatCard 
          label={isUrdu ? 'کیٹیگریز' : 'Categories'} 
          value={statistics.categories.toString()} 
          icon="category" 
          color="text-success" 
        />
      </div>

      {/* Add Item Form */}
      {showForm && (
        <Card variant="outlined" className="bg-surface p-4">
          <h4 className="font-bold mb-4">{isUrdu ? 'نیا آئٹم شامل کریں' : 'Add New Item'}</h4>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
            <TextField 
              label={isUrdu ? 'آئٹم کا نام' : 'Item Name'} 
              icon="inventory_2" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="e.g., A4 Paper, Pen, Register"
              required
            />
            <TextField 
              label={isUrdu ? 'کیٹیگری' : 'Category'} 
              icon="category" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g., Stationery, Forms"
            />
            <TextField 
              label={isUrdu ? 'مقدار' : 'Quantity'} 
              type="number" 
              icon="numbers" 
              value={qty} 
              onChange={e => setQty(e.target.value)}
              required
            />
            <TextField 
              label={isUrdu ? 'ری آرڈر لیول' : 'Reorder Level'} 
              type="number" 
              icon="warning" 
              value={reorder} 
              onChange={e => setReorder(e.target.value)}
              placeholder="Minimum stock level"
            />
            <TextField 
              label={isUrdu ? 'یونٹ' : 'Unit'} 
              icon="balance" 
              value={unit} 
              onChange={e => setUnit(e.target.value)}
              placeholder="pcs, box, ream, etc."
            />
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

      {/* Data Table */}
      <DataTable
        data={items}
        columns={columns}
        emptyState={{
          icon: 'inventory_2',
          title: isUrdu ? 'کوئی آئٹم نہیں' : 'No items found',
          description: isUrdu ? 'انوینٹری آئٹمز شامل کریں' : 'Add inventory items to track stock',
        }}
      />

      {/* Info Panel */}
      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
        <AppIcon name="tips_and_updates" className="text-primary mt-1" />
        <div className={isUrdu ? 'text-right' : ''}>
          <h5 className="font-bold text-primary text-sm">
            {isUrdu ? 'انوینٹری ٹپس' : 'Inventory Tips'}
          </h5>
          <ul className="text-xs text-on-surface-variant list-disc list-inside space-y-1 mt-1">
            <li>{isUrdu ? 'ری آرڈر لیول سیٹ کریں تاکہ کم اسٹاک کی خبر ملے' : 'Set reorder levels to get low stock alerts'}</li>
            <li>{isUrdu ? 'باقاعدگی سے اسٹاک چیک کریں' : 'Regularly check stock levels'}</li>
            <li>{isUrdu ? 'کیٹیگریز استعمال کریں بہتر تنظیم کے لیے' : 'Use categories for better organization'}</li>
            <li>{isUrdu ? 'ایکسپورٹ فیچر سے ماہانہ رپورٹ بنائیں' : 'Export monthly reports for record keeping'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
