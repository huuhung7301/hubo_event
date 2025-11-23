import type { Item } from './page';
import React, { useState } from 'react';
import {ChevronUp, Plus, Trash2 } from 'lucide-react';

interface ItemListManagerProps {
    title: string;
    items: { itemId: number; quantity: number }[];
    availableItems: Item[];
    onChange: (index: number, quantity: number) => void;
    onAdd: (itemId: number) => void;
    onRemove: (index: number) => void;
    isOptional?: boolean;
}

export const ItemListManager: React.FC<ItemListManagerProps> = ({ 
    title, 
    items, 
    availableItems, 
    onChange,
    onAdd, 
    onRemove,
    isOptional = false 
}) => {
    // Determine the initial item ID for the select box.
    const [newItemId, setNewItemId] = useState<number | ''>(availableItems[0]?.id || '');
    const [showPicker, setShowPicker] = useState(false);

    const handleAdd = () => {
        if (newItemId) {
            onAdd(Number(newItemId));
            setNewItemId(''); // Clear selection after adding
            setShowPicker(false); // Close picker after adding
        }
    };

    const selectedItemIds = items.map(i => i.itemId);
    const unselectedItems = availableItems.filter(item => !selectedItemIds.includes(item.id));

    return (
        <div className="border rounded-lg p-3 bg-white/70 shadow-inner">
            <h4 className="font-semibold text-lg mb-2 flex justify-between items-center text-indigo-700">
                {title}
                <button 
                    type="button" 
                    onClick={() => setShowPicker(!showPicker)} 
                    className="text-indigo-500 hover:text-indigo-600 transition p-1"
                    aria-expanded={showPicker}
                >
                    {showPicker ? <ChevronUp size={20} /> : <Plus size={20} />}
                </button>
            </h4>
            
            {showPicker && (
                <div className="flex gap-2 mb-3 p-2 border-t pt-3">
                    <select
                        value={newItemId || ''}
                        onChange={(e) => setNewItemId(Number(e.target.value))}
                        className="flex-grow rounded border p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="" disabled>Select an Item</option>
                        {unselectedItems.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name} ({item.key})
                            </option>
                        ))}
                    </select>
                    <button 
                        type="button" 
                        onClick={handleAdd} 
                        disabled={!newItemId || unselectedItems.length === 0}
                        className="rounded bg-indigo-500 px-3 py-1 text-white hover:bg-indigo-600 disabled:bg-indigo-300 transition"
                    >
                        Add
                    </button>
                </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.length === 0 && <p className="text-sm text-gray-500 italic">No {isOptional ? 'optional' : 'required'} items added yet.</p>}
                {items.map((itemData, index) => {
                    const fullItem = availableItems.find(i => i.id === itemData.itemId);
                    if (!fullItem) return null;

                    return (
                        <div key={fullItem.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                            <span className="font-medium flex-grow text-sm truncate">{fullItem.name} ({fullItem.unit || 'EA'})</span>
                            <input
                                type="number"
                                min="1"
                                value={itemData.quantity}
                                onChange={(e) => onChange(index, Number(e.target.value))}
                                className="w-16 rounded border text-center p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button 
                                type="button" 
                                onClick={() => onRemove(index)}
                                className="text-red-500 hover:text-red-700 p-1 rounded transition"
                                title="Remove Item"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
