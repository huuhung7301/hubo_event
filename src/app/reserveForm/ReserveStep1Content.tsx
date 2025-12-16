"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
// Assuming ItemDisplayComponent is now defined locally or imported
import { ItemDisplayComponent } from "./itemDisplayComponent";
import type { Step1Data } from "../reserve/page";
import { api } from "~/trpc/react";
// We don't need useQueries anymore

// --------------------------------------------------------------------------
// 1. DATA TYPES & CONFIGURATION
// --------------------------------------------------------------------------

// Defines the raw item data returned by the API
interface ItemData {
  id: number;
  key: string;
  name: string;
  basePrice: number;
  unit: string | null;
  imageUrl: string | null;
  category: { name: string } | null;
}

// Defines the simplified structure used by the frontend components
export interface SelectionItem {
  id: number;
  key: string;
  src: string;
  title: string;
  category: string;
  price: number;
}

interface CategoryConfig {
  id: number; 
  name: string; 
  stateKey: string; 
  selectionType: "single" | "multi"; 
  isRequired: boolean; 
}

// Static Category Configuration 
const CATEGORY_CONFIG: CategoryConfig[] = [
  { id: 2, name: "Backdrops", stateKey: "backdrops", selectionType: "single", isRequired: true },
  { id: 3, name: "Baloons", stateKey: "baloons", selectionType: "multi", isRequired: false },
  { id: 4, name: "Flowers", stateKey: "flowers", selectionType: "multi", isRequired: false },
  { id: 5, name: "Plinth", stateKey: "plinth", selectionType: "single", isRequired: false },
  { id: 6, name: "Platform", stateKey: "platform", selectionType: "single", isRequired: false },
];


// Helper function to transform raw Item data into frontend SelectionItem
const mapItemToSelectionItem = (item: ItemData): SelectionItem => ({
  id: item.id,
  key: item.key,
  src: item.imageUrl ?? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9cSGzVkaZvJD5722MU5A-JJt_T5JMZzotcw&s",
  title: item.name,
  category: item.category?.name ?? "Uncategorized",
  price: item.basePrice,
});


// --------------------------------------------------------------------------
// 2. ITEM DISPLAY COMPONENT (Kept as previously defined placeholder)
// --------------------------------------------------------------------------

interface ItemDisplayProps {
  item: SelectionItem;
  selected: boolean;
  onSelect: (item: SelectionItem) => void;
}

// --------------------------------------------------------------------------
// 3. SCROLL GRID COMPONENT (Kept as previously defined)
// --------------------------------------------------------------------------
const ItemDisplay = React.memo(ItemDisplayComponent);

type ScrollKey = string; 

interface ScrollGridProps {
  items: SelectionItem[];
  selectedCheck: (item: SelectionItem) => boolean;
  onSelect: (item: SelectionItem) => void;
  innerRef?: React.RefObject<HTMLDivElement | null>;
  scrollKey: ScrollKey;
  handleScroll: (
    key: ScrollKey,
    e: React.UIEvent<HTMLDivElement>,
  ) => void;
  scrollPositions: React.MutableRefObject<Record<string, number>>;
}

const ScrollGridComponent = ({
  items,
  selectedCheck,
  onSelect,
  innerRef,
  scrollKey,
  handleScroll,
  scrollPositions,
}: ScrollGridProps) => {
  useEffect(() => {
    if (innerRef?.current) {
      innerRef.current.scrollLeft = scrollPositions.current[scrollKey] || 0;
    }
  }, [innerRef, scrollKey, scrollPositions]);

  return (
    <div
      ref={innerRef ?? null}
      onScroll={(e) => handleScroll(scrollKey, e)}
      className="flex snap-x snap-mandatory space-x-4 overflow-x-auto pb-2"
    >
      <div className="auto-cols grid grid-flow-col grid-rows-2 gap-4"> 
        {items.map((item) => (
          <div key={item.key} className="snap-start w-full">
            <ItemDisplay 
              item={item}
              selected={selectedCheck(item)}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ScrollGrid = React.memo(ScrollGridComponent);


// --------------------------------------------------------------------------
// 4. MAIN COMPONENT (ReserveStep1Content)
// --------------------------------------------------------------------------

interface ReserveStep1ContentProps {
  data: Step1Data;
  onSubmit: (data: Step1Data) => void;
}

export default function ReserveStep1Content({
  data,
  onSubmit,
}: ReserveStep1ContentProps) {

  // Array to hold the results of all queries (manually defined for simplicity with static config)
  const queryResults = CATEGORY_CONFIG.map(config => {
    // 👈 This is the required useQuery structure:
    const { data: rawItems, isLoading } = api.stock.getByCategory.useQuery(
      { categoryId: config.id }, 
      {
        staleTime: 5 * 60 * 1000, // Optional: cache for 5 minutes
        enabled: true, // Always run, as configuration is static
      }
    );

    return {
      config,
      rawItems,
      isLoading,
    };
  });
  
  const isLoading = queryResults.some(res => res.isLoading);

  // --- Process and Organize Item Data ---
  const itemMap = useMemo(() => {
    const map: Record<string, SelectionItem[]> = {};
    
    queryResults.forEach(res => {
      if (res.rawItems) {
        map[res.config.stateKey] = res.rawItems.map(mapItemToSelectionItem);
      }
    });
    return map;
  }, [queryResults]); // Depend on queryResults array

  // --- STATE MANAGEMENT ---
  
  const initialSelectionState = useMemo(() => {
    const state: Record<string, string | string[] | null> = {};
    
    CATEGORY_CONFIG.forEach(config => {
      const initialValue = data[config.stateKey as keyof Step1Data]; 
      
      if (config.selectionType === "single") {
        state[config.stateKey] = (initialValue as SelectionItem)?.key ?? null;
      } else {
        state[config.stateKey] = (initialValue as SelectionItem[])?.map(d => d.key) ?? [];
      }
    });
    
    return state;
  }, [data]);

  const [selections, setSelections] = useState<Record<string, string | string[] | null>>(initialSelectionState);
  const [message, setMessage] = useState(data.message ?? "");

  // --- SCROLL STATE & HANDLERS (Unchanged) ---
  const scrollPositions = useRef<Record<string, number>>(
    Object.fromEntries(CATEGORY_CONFIG.map(c => [c.stateKey, 0]))
  );
  
  const categoryRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>(
    Object.fromEntries(CATEGORY_CONFIG.map(c => [c.stateKey, React.createRef()]))
  );
  
  const handleScroll = (key: string, e: React.UIEvent<HTMLDivElement>) => {
    scrollPositions.current[key] = e.currentTarget.scrollLeft;
  };

  const handleSelection = (item: SelectionItem, config: CategoryConfig) => {
    const key = config.stateKey;
    
    setSelections(prev => {
      const currentValue = prev[key];
      
      if (config.selectionType === "single") {
        return {
          ...prev,
          [key]: currentValue === item.key ? null : item.key,
        };
      } else {
        const currentArray = (currentValue || []) as string[];
        const isSelected = currentArray.includes(item.key);
        
        return {
          ...prev,
          [key]: isSelected
            ? currentArray.filter(k => k !== item.key)
            : [...currentArray, item.key],
        };
      }
    });
  };

  // --- SUBMIT HANDLER ---
  const handleNext = () => {
    const finalSetup = CATEGORY_CONFIG.reduce((acc, config) => {
        const selectedKeys = selections[config.stateKey];
        const items = itemMap[config.stateKey] || [];
        
        if (config.selectionType === "single" && typeof selectedKeys === 'string' && selectedKeys) {
            const selectedItem = items.find(i => i.key === selectedKeys);
            (acc as Record<string, any>)[config.stateKey] = selectedItem;
        } else if (config.selectionType === "multi" && Array.isArray(selectedKeys)) {
            const selectedItems = items.filter(i => selectedKeys.includes(i.key));
            (acc as Record<string, any>)[config.stateKey] = selectedItems;
        }
        
        return acc;
    }, { message } as Step1Data); 

    onSubmit(finalSetup);
  };
  
  const requiredCategory = CATEGORY_CONFIG.find(c => c.isRequired);
  const isRequiredSelected = requiredCategory 
    ? (selections[requiredCategory.stateKey] !== null && selections[requiredCategory.stateKey] !== undefined && selections[requiredCategory.stateKey] !== "")
    : true; 

  // --------------------------------------------------------------------------
  // 🖥️ RENDER
  // --------------------------------------------------------------------------
  
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="animate-pulse text-lg text-gray-500">Loading item catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {CATEGORY_CONFIG.map(config => {
        const items = itemMap[config.stateKey] || [];
        const isSingle = config.selectionType === "single";
        const selectedKeys = selections[config.stateKey];
        const isRequired = config.isRequired;

        return (
          <section key={config.stateKey}>
            <h2 className="mb-4 text-lg font-semibold">
              Choose {config.name} {isRequired ? "(Required)" : "(Optional)"}
            </h2>
            
            {items.length > 0 ? (
              <ScrollGrid
                items={items}
                selectedCheck={(i) => 
                  isSingle 
                    ? i.key === selectedKeys 
                    : Array.isArray(selectedKeys) && selectedKeys.includes(i.key)
                }
                onSelect={(i) => handleSelection(i, config)}
                innerRef={categoryRefs.current[config.stateKey]}
                scrollKey={config.stateKey}
                handleScroll={handleScroll}
                scrollPositions={scrollPositions}
              />
            ) : (
                <div className="text-gray-500 italic">No {config.name.toLowerCase()} available yet.</div>
            )}
          </section>
        );
      })}

      {/* Custom Message */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">
          Custom Message (Optional)
        </h2>
        <input
          type="text"
          placeholder="e.g., Happy Birthday"
          className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </section>

      {/* Next Button */}
      <div className="text-right">
        <button
          onClick={handleNext}
          disabled={!isRequiredSelected || isLoading}
          className={`rounded-lg px-6 py-3 font-semibold text-white transition-colors ${
            isRequiredSelected && !isLoading
              ? "bg-blue-600 hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-400"
          }`}
        >
          Next Step
        </button>
      </div>
    </div>
  );
}