"use client";

import Link from "next/link";
import { ShoppingBag, Search } from "lucide-react";
import { useState, useMemo } from "react";
import type { FC } from "react";
// FIX: Use the client-side tRPC react client for state-dependent queries
import { api } from "~/trpc/react"; 

// --- TYPE DEFINITIONS ---
interface ItemCategory {
  id: number;
  name: string;
}

interface ItemListing {
  id: number;
  key: string;
  name: string;
  basePrice: number;
  unit: string | null;
  imageUrl: string | null;
  categoryId: number | null;
  category: ItemCategory | null;
}

// --- COMPONENT: Item Card ---
const ItemCard: FC<{ item: ItemListing }> = ({ item }) => {
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.basePrice);

  return (
    <Link
      href={`/items/${item.key}`}
      className="group block rounded-2xl bg-white border shadow-sm hover:shadow-xl hover:border-indigo-400 transition overflow-hidden"
    >
      <div className="h-48 overflow-hidden">
        {/* Fix: Use placeholder or null if imageUrl is falsy */}
        <img
          src={item.imageUrl || "https://placehold.co/600x400/9CA3AF/FFFFFF?text=No+Image"}
          alt={item.name}
          className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
        />
      </div>

      <div className="p-4 space-y-2">
        <div className="flex justify-between items-center gap-2">
          <p className="text-lg font-semibold text-gray-900 truncate">{item.name}</p>

          {item.category && (
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full whitespace-nowrap">
              {item.category.name}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500">
          <span className="font-mono text-gray-700">{item.key}</span> • per {item.unit ?? "EA"}
        </p>

        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-xl font-bold text-indigo-600">{price}</span>

          <span className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg group-hover:bg-indigo-700 transition">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
};


// --- PAGE ---
export default function ItemListingPage() {
  // --- Filter State ---
  const [keyword, setKeyword] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null); 

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
      tempItems = tempItems.filter((item) => item.categoryId === selectedCategoryId);
    }

    return tempItems;
  }, [allItems, keyword, selectedCategoryId]);


  // Handler for category filter button
  const toggleCategory = (categoryId: number) => {
    // Toggles between the selected category ID and null (All Items)
    setSelectedCategoryId((prevId) => (prevId === categoryId ? null : categoryId));
  };


  // --- Render ---
  const error = categoriesError || itemsError;
  const isLoading = isLoadingCategories || isLoadingItems;

  return (
    <div className="min-h-screen bg-white">

      {/* ====================== NAVBAR ====================== */}
      <header className="mx-auto flex w-[95%] items-center lg:w-[80%] justify-between border-b py-4 bg-white sticky top-0 z-20">
        <h1 className="text-xl font-bold">Hubo Events</h1>

        <nav className="hidden gap-8 text-sm md:flex">
          <Link href="/" className="hover:text-indigo-600">Decorations</Link>
          <Link href="/items" className="hover:text-indigo-600 text-indigo-600 font-semibold">Rent Items</Link>
          <Link href="/packages" className="hover:text-indigo-600">Packages</Link>
        </nav>

        <Link href="/reserve" className="rounded-full border px-4 py-1 text-sm hover:bg-gray-100">
          Order decorations
        </Link>
      </header>

      {/* ====================== PAGE CONTENT ====================== */}
      <div className="px-6 sm:px-10 py-10 lg:w-[80%] mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingBag size={32} className="text-indigo-600" />
          Inventory & Rental Catalog
        </h1>

        {/* ====================== FILTER SECTION ====================== */}
        <div className="mb-12 p-6 bg-gray-50 rounded-xl border">
          <h2 className="text-2xl font-bold mb-4">Filter Inventory</h2>
          
          {/* Search Input */}
          <div className="mb-6 relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by name or unique key..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full rounded-full border-gray-300 pl-10 pr-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 transition text-md shadow-sm"
            />
          </div>

          {/* Categories Filter Buttons */}
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Filter by Category:</h3>
          {isLoadingCategories ? (
            <div className="text-sm text-gray-500">Loading categories...</div>
          ) : categoriesError ? (
            <div className="text-sm text-red-500">Error loading categories.</div>
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
                  <p className="text-sm text-gray-500">No categories found in the database.</p>
              )}
            </div>
          )}
        </div>
        {/* ====================== END FILTER SECTION ====================== */}


        {/* ====================== GRID ====================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoadingItems ? (
            <div className="col-span-full p-10 text-center text-indigo-600 text-xl font-medium">Loading Inventory...</div>
          ) : itemsError ? (
            <p className="text-red-500 col-span-full p-10 text-center bg-red-50 rounded-2xl border border-red-200 shadow-inner">
              Error fetching items: {itemsError.message}
            </p>
          ) : filteredItems.length > 0 ? (
            // Use filteredItems for rendering
            filteredItems.map((item) => <ItemCard key={item.id} item={item} />)
          ) : (
            <p className="text-gray-500 italic col-span-full p-10 text-center bg-gray-50 rounded-2xl border shadow-inner">
              No inventory items found matching your current filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}