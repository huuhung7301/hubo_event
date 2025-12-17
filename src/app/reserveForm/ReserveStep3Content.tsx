"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
// Assuming ItemDisplayComponent is now defined locally or imported
// ⚠️ Adjust path as necessary if ItemDisplayComponent is used here
import { ItemDisplayComponent } from "./itemDisplayComponent";
import type { SelectionItem } from "./ReserveStep1Content";
import { api } from "~/trpc/react";

// --------------------------------------------------------------------------
// 1. DATA TYPES & CONFIGURATION
// --------------------------------------------------------------------------

// Defines the raw item data returned by the API (same as Step 1)
interface ItemData {
  id: number;
  key: string;
  name: string;
  basePrice: number;
  unit: string | null;
  imageUrl: string | null;
  category: { name: string } | null;
}

// Helper function to transform raw Item data into frontend SelectionItem (same as Step 1)
const mapItemToSelectionItem = (item: ItemData): SelectionItem => ({
  id: item.id,
  key: item.key,
  src:
    item.imageUrl ??
    "https://ralfvanveen.com/wp-content/uploads/2021/06/Placeholder-_-Glossary.svg",
  title: item.name,
  category: item.category?.name ?? "Other",
  price: item.basePrice,
});

// --------------------------------------------------------------------------
// 2. SCROLL GRID AND ITEM DISPLAY (Re-used structure from Step 1)
// --------------------------------------------------------------------------

// Re-using the structure for ItemDisplay (assuming it accepts props like Step 1)
interface ItemDisplayProps {
  item: SelectionItem;
  selected: boolean;
  onSelect: (item: SelectionItem) => void;
}
const ItemDisplay = React.memo(ItemDisplayComponent);

// Scroll Grid definition from Step 1, adapted for category name keys
type ScrollKey = string;

interface ScrollGridProps {
  items: SelectionItem[];
  selectedCheck: (item: SelectionItem) => boolean;
  onSelect: (item: SelectionItem) => void;
  innerRef?: React.RefObject<HTMLDivElement | null>;
  scrollKey: ScrollKey;
  handleScroll: (key: ScrollKey, e: React.UIEvent<HTMLDivElement>) => void;
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
      innerRef.current.scrollLeft = scrollPositions.current[scrollKey] ?? 0;
    }
  }, [innerRef, scrollKey, scrollPositions]);

  // Adjust grid-rows based on item count, using 2 rows if more than 5 items
  const rows = items.length <= 5 ? 1 : 2;

  return (
    <div
      ref={innerRef ?? null}
      onScroll={(e) => handleScroll(scrollKey, e)}
      className="flex snap-x snap-mandatory space-x-4 overflow-x-auto pb-2"
    >
      {/* ⚠️ Using auto-cols-min to ensure card width (w-full used for flexibility) */}
      <div
        className={`grid auto-cols-min grid-flow-col grid-rows-${rows} gap-4`}
      >
        {items.map((item) => (
          // Adjusted to ensure w-36 consistency with Step 1, if needed
          <div key={item.key} className="w-36 snap-start">
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
// 3. MAIN COMPONENT (ReserveStep3Content)
// --------------------------------------------------------------------------

// Step 3 Data structure from the parent component
interface ReserveStep3ContentProps {
  data: { addOns: SelectionItem[] };
  onSubmit: (data: { addOns: SelectionItem[] }) => void;
}

// We will use the sub-category name (item.category) as the grouping key
type AddOnCategoryKey = string;
const ADDON_CATEGORY_ID = 8; // ID for "Additional" or Add-ons category

export default function ReserveStep3Content({
  data,
  onSubmit,
}: ReserveStep3ContentProps) {
  // --- 1. DATA FETCHING ---
  // Fetch all items belonging to the general Add-ons Category ID (8)
  const { data: rawAddOns, isLoading } = api.stock.getByCategory.useQuery(
    { categoryId: ADDON_CATEGORY_ID },
    {
      staleTime: 5 * 60 * 1000,
      enabled: true,
    },
  );

  // --- 2. PROCESS, TRANSFORM, AND GROUP BY SUB-CATEGORY NAME ---
  const allAddOns = useMemo(() => {
    if (!rawAddOns) return [];
    return rawAddOns.map(mapItemToSelectionItem);
  }, [rawAddOns]);

  // Group items by their sub-category name (item.category)
  const categorizedItems = useMemo(() => {
    const map: Record<AddOnCategoryKey, SelectionItem[]> = {};
    allAddOns.forEach((item) => {
      const categoryKey = item.category; // Using the item's category name as the grouping key
      map[categoryKey] ??= [];
      map[categoryKey].push(item);
    });
    return map;
  }, [allAddOns]);

  const categories: AddOnCategoryKey[] = useMemo(
    () => Object.keys(categorizedItems),
    [categorizedItems],
  );

  // --- 3. STATE MANAGEMENT ---
  // We use a simplified state structure: an array of selected item keys
  const initialSelectionState = useMemo(() => {
    return data.addOns?.map((d) => d.key) ?? [];
  }, [data]);

  const [selectedAddOnKeys, setSelectedAddOnKeys] = useState<string[]>(
    initialSelectionState,
  );

  // --- 4. SCROLL STATE & HANDLERS ---
  const scrollPositions = useRef<Record<ScrollKey, number>>(
    Object.fromEntries(categories.map((c) => [c, 0])),
  );

  // Create refs for each sub-category scroll area
  const categoryRefs = useRef<
    Record<ScrollKey, React.RefObject<HTMLDivElement | null>>
  >(
    Object.fromEntries(
      categories.map(() => [
        Math.random().toString(36).substring(2, 9),
        React.createRef(),
      ]),
    ),
  );

  // Update refs to use category name keys (recreating the map ensures we cover all dynamic categories)
  useEffect(() => {
    // Dynamically populate refs based on current categories
    const newRefs: Record<
      ScrollKey,
      React.RefObject<HTMLDivElement | null>
    > = {};
    categories.forEach((cat) => {
      // Reuse existing ref if available, otherwise create a new one
      newRefs[cat] = categoryRefs.current[cat] ?? React.createRef();
    });
    categoryRefs.current = newRefs;

    // Dynamically populate scroll positions
    const newScrollPositions: Record<ScrollKey, number> = {};
    categories.forEach((cat) => {
      newScrollPositions[cat] = scrollPositions.current[cat] ?? 0;
    });
    scrollPositions.current = newScrollPositions;
  }, [categories]);

  const handleScroll = (key: ScrollKey, e: React.UIEvent<HTMLDivElement>) => {
    scrollPositions.current[key] = e.currentTarget.scrollLeft;
  };

  const handleSelection = useCallback((item: SelectionItem) => {
    setSelectedAddOnKeys((prevKeys) => {
      const isSelected = prevKeys.includes(item.key);
      if (isSelected) {
        return prevKeys.filter((k) => k !== item.key);
      } else {
        return [...prevKeys, item.key];
      }
    });
  }, []);

  // --- SUBMIT HANDLER ---
  const handleNext = () => {
    // Find all selected items from the combined list
    const selectedItems = selectedAddOnKeys
      .map((key) => allAddOns.find((item) => item.key === key))
      .filter((item): item is SelectionItem => item !== undefined);

    onSubmit({ addOns: selectedItems });
  };

  // --------------------------------------------------------------------------
  // 🖥️ RENDER
  // --------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="animate-pulse text-lg text-gray-500">
          Loading add-on catalog...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categories.length > 0 ? (
        categories.map((catKey) => {
          const items = categorizedItems[catKey] ?? [];
          const ref = categoryRefs.current[catKey]!;
          return (
            <section key={catKey}>
              <h2 className="mb-4 text-lg font-semibold">
                {catKey} (Optional)
              </h2>

              {items.length > 0 ? (
                <ScrollGrid
                  items={items}
                  selectedCheck={(i) => selectedAddOnKeys.includes(i.key)}
                  onSelect={handleSelection}
                  innerRef={ref}
                  scrollKey={catKey}
                  handleScroll={handleScroll}
                  scrollPositions={scrollPositions}
                />
              ) : (
                <div className="text-gray-500 italic">
                  No items available in this category.
                </div>
              )}
            </section>
          );
        })
      ) : (
        <div className="text-center text-gray-500 italic">
          No add-ons available at this time.
        </div>
      )}

      {/* Next Button */}
      <div className="text-right">
        <button
          onClick={handleNext}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
