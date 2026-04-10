import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { InventoryItem } from '../types';
import { STORAGE_KEYS } from '../constants';

export function useInventory() {
  const [items, setItems] = useLocalStorage<InventoryItem[]>(
    STORAGE_KEYS.INVENTORY_ITEMS,
    []
  );

  const addItem = useCallback((item: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      updatedAt: new Date().toISOString(),
    };
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, [setItems]);

  const updateItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
    ));
  }, [setItems]);

  const adjustQuantity = useCallback((id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return { ...i, qty: newQty, updatedAt: new Date().toISOString() };
      }
      return i;
    }));
  }, [setItems]);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, [setItems]);

  const statistics = useMemo(() => {
    const lowStock = items.filter(i => i.qty <= i.reorder);
    const outOfStock = items.filter(i => i.qty === 0);
    const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

    return {
      total: items.length,
      totalItems,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      categories: Array.from(new Set(items.map(i => i.category))).length,
    };
  }, [items]);

  return {
    items,
    addItem,
    updateItem,
    adjustQuantity,
    deleteItem,
    statistics,
  };
}
