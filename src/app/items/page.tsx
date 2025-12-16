"use client";

import Link from "next/link";
import { ShoppingBag, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { api } from "~/trpc/react";
import { ItemCard } from "./itemCard";
import { useCart } from "~/store/useCart";

// --- TYPE DEFINITIONS ---
export interface ItemCategory {
  id: number;
  name: string;
}

export interface ItemListing {
  id: number;
  key: string;
  name: string;
  basePrice: number;
  unit: string | null;
  imageUrl: string | null;
  categoryId: number | null;
  category: ItemCategory | null;
}

// --- PAGE ---
export default function ItemListingPage() {
  const items = useCart((state) => state.items);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  // --- Filter State ---
  const [keyword, setKeyword] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  // --- TRPC Data Fetching (FIXED) ---

  // 1. Fetch Categories
  const categoriesQuery = api.stock.getCategories.useQuery();
  const categories = categoriesQuery.data ?? [];
  const isLoadingCategories = categoriesQuery.isLoading;
  const categoriesError = categoriesQuery.error;

  // 2. Fetch ALL Items from the server (empty input means fetch all)
  const allItemsQuery = api.stock.getAll.useQuery({});
  const allItems = allItemsQuery.data as ItemListing[] | undefined;
  const isLoadingItems = allItemsQuery.isLoading;
  const itemsError = allItemsQuery.error;

  // 3. Client-Side Filtering with useMemo
  const filteredItems = useMemo(() => {
    if (!allItems) return [];

    let tempItems = allItems;

    // Filter by Keyword (case-insensitive on name and key)
    if (keyword) {
      const lowerCaseKeyword = keyword.toLowerCase();
      tempItems = tempItems.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerCaseKeyword) ||
          item.key.toLowerCase().includes(lowerCaseKeyword),
      );
    }

    // Filter by Category
    if (selectedCategoryId !== null) {
      tempItems = tempItems.filter(
        (item) => item.categoryId === selectedCategoryId,
      );
    }

    return tempItems;
  }, [allItems, keyword, selectedCategoryId]);

  // Handler for category filter button
  const toggleCategory = (categoryId: number) => {
    // Toggles between the selected category ID and null (All Items)
    setSelectedCategoryId((prevId) =>
      prevId === categoryId ? null : categoryId,
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ====================== NAVBAR ====================== */}
      <header className="sticky top-0 z-20 mx-auto flex w-[95%] items-center justify-between border-b bg-white py-4 lg:w-[80%]">
        <h1 className="text-xl font-bold">Hubo Events</h1>

        <nav className="hidden gap-8 text-sm md:flex">
          <Link href="/" className="hover:text-indigo-600">
            Decoration packages
          </Link>
          <Link
            href="/items"
            className="font-semibold text-indigo-600 hover:text-indigo-600"
          >
            Rent
          </Link>
          <Link href="/purchase" className="hover:text-indigo-600">
            Purchase
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="relative rounded-full border px-3 py-1 text-sm transition hover:bg-gray-100"
          >
            <ShoppingBag size={20} className="inline-block text-indigo-600" />
            {totalCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {totalCount}
              </span>
            )}
          </Link>

          <Link
            href="/reserve"
            className="rounded-full border px-4 py-1 text-sm transition hover:bg-gray-100"
          >
            Order decorations
          </Link>
        </div>
      </header>

      {/* ====================== PAGE CONTENT ====================== */}
      <div className="mx-auto px-6 py-10 sm:px-10 lg:w-[80%]">
        <h1 className="mb-8 flex items-center gap-3 text-4xl font-extrabold text-gray-900">
          Inventory & Rental Catalog
        </h1>

        {/* ====================== FILTER SECTION ====================== */}
        <div className="mb-12 rounded-xl border bg-gray-50 p-6">
          <h2 className="mb-4 text-2xl font-bold">Filter Inventory</h2>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search
              size={20}
              className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
            />
            <input
              placeholder="Search by name or unique key..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="text-md w-full rounded-full border-gray-300 py-3 pr-4 pl-10 shadow-sm transition focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Categories Filter Buttons */}
          <h3 className="mb-3 text-lg font-semibold text-gray-700">
            Filter by Category:
          </h3>
          {isLoadingCategories ? (
            <div className="text-sm text-gray-500">Loading categories...</div>
          ) : categoriesError ? (
            <div className="text-sm text-red-500">
              Error loading categories.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {/* "All" button to clear selection */}
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  selectedCategoryId === null
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                All Items
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    selectedCategoryId === cat.id
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {categories.length === 0 && selectedCategoryId === null && (
                <p className="text-sm text-gray-500">
                  No categories found in the database.
                </p>
              )}
            </div>
          )}
        </div>
        {/* ====================== END FILTER SECTION ====================== */}

        {/* ====================== GRID ====================== */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoadingItems ? (
            <div className="col-span-full p-10 text-center text-xl font-medium text-indigo-600">
              Loading Inventory...
            </div>
          ) : itemsError ? (
            <p className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-500 shadow-inner">
              Error fetching items: {itemsError.message}
            </p>
          ) : filteredItems.length > 0 ? (
            // Use filteredItems for rendering
            filteredItems.map((item) => <ItemCard key={item.id} item={item} />)
          ) : (
            <p className="col-span-full rounded-2xl border bg-gray-50 p-10 text-center text-gray-500 italic shadow-inner">
              No inventory items found matching your current filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
