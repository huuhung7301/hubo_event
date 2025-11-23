"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, Edit, Search } from "lucide-react";
import { WorkModal } from "./workmodal";
import { api } from "~/trpc/react";

// --- 1. TYPE DEFINITIONS (same as before) ---
export interface Category {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  key: string;
  name: string;
  basePrice: number;
  unit: string | null;
  imageUrl: string | null;
  categoryId: number | null;
}

export interface WorkCategoryRelation {
  categoryId: number;
  category: Category;
}

export interface WorkItemRelation {
  itemId: number;
  quantity: number;
  item: Item;
}

export interface WorkInputDTO {
  id: number | null;
  title: string;
  imageUrl: string;
  notes: string;
  categoryIds: number[];
  requiredItems: { itemId: number; quantity: number }[];
  optionalItems: { itemId: number; quantity: number }[];
}

interface Work {
  id: number;
  title: string;
  imageUrl: string;
  notes: string | null;

  categories: WorkCategoryRelation[];
  items: WorkItemRelation[];
  optionalItems: WorkItemRelation[];

  categoryIds: number[];
  requiredItemData: { itemId: number; quantity: number }[];
  optionalItemData: { itemId: number; quantity: number }[];
}

// --------------------------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------------------------
const App: React.FC = () => {
  // ============ FETCH DATA USING TRPC ============
  const { data: categories = [], isLoading: loadingCategories } =
    api.package.getWorkCategories.useQuery();

  const { data: items = [], isLoading: loadingItems } =
    api.stock.getAll.useQuery({});

  const {
    data: works = [],
    isLoading: loadingWorks,
    refetch: refetchWorks,
  } = api.package.getAll.useQuery();

  // ============ MUTATIONS ============
  const createWork = api.package.create.useMutation({
    onSuccess: () => refetchWorks(),
  });

  const updateWork = api.package.update.useMutation({
    onSuccess: () => refetchWorks(),
  });

  const deleteWorkMutation = api.package.delete.useMutation({
    onSuccess: () => refetchWorks(),
  });

  // ============ MODAL STATE ============
  const [currentWorkData, setCurrentWorkData] = useState<WorkInputDTO | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // FILTER STATE
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("");

  // ---------------------------------------------
  // SAVE WORK (calls tRPC)
  // ---------------------------------------------
  const handleSaveWork = useCallback(
    (data: WorkInputDTO) => {
      if (data.id) {
        updateWork.mutate(data);
      } else {
        createWork.mutate(data);
      }
    },
    [createWork, updateWork]
  );

  // ---------------------------------------------
  // DELETE WORK
  // ---------------------------------------------
  const handleDelete = (id: number, title: string) => {
    if (confirm(`Delete work "${title}"?`)) {
      deleteWorkMutation.mutate({ id });
    }
  };

  // ---------------------------------------------
  // OPEN/EDIT MODAL
  // ---------------------------------------------
  const handleOpenCreate = () => {
    setCurrentWorkData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (work: Work) => {
    setCurrentWorkData({
      id: work.id,
      title: work.title,
      imageUrl: work.imageUrl,
      notes: work.notes ?? "",
      categoryIds: work.categoryIds,
      requiredItems: work.requiredItemData,
      optionalItems: work.optionalItemData,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentWorkData(null);
  };

  // ---------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------
  const filteredWorks = useMemo(() => {
    if (!works) return [];

    let results = works;
    const keyword = filterKeyword.toLowerCase();
    const categoryId = Number(filterCategoryId);

    if (keyword) {
      results = results.filter(
        (w) =>
          w.title.toLowerCase().includes(keyword) ||
          w.notes?.toLowerCase().includes(keyword)
      );
    }

    if (categoryId) {
      results = results.filter((w) =>
        w.categories.some((c) => c.categoryId === categoryId)
      );
    }

    return results;
  }, [works, filterKeyword, filterCategoryId]);

  // LOADING STATE
  if (loadingCategories || loadingItems || loadingWorks) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  // --------------------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4 sm:mb-0">
          Work Catalog Management
        </h1>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white shadow-lg hover:bg-indigo-700 transition"
        >
          <Plus size={20} /> Add New Work
        </button>
      </header>

      {/* FILTERS */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 p-4 bg-white rounded-xl shadow-md border">
        <div className="relative flex-1">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search by Title or Notes..."
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            className="w-full rounded-lg border-gray-300 pl-10 pr-4 py-2"
          />
        </div>

        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(Number(e.target.value) || "")}
          className="rounded-lg border-gray-300 p-2"
        >
          <option value="">-- Filter by Category --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* WORK LIST */}
      <div className="space-y-4">
        {filteredWorks.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 italic text-lg">
              No works found matching your criteria.
            </p>
          </div>
        ) : (
          filteredWorks.map((work) => (
            <div
              key={work.id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 rounded-xl shadow-lg border"
            >
              <div className="flex items-start gap-4 flex-1">
                <img
                  src={work.imageUrl}
                  className="h-20 w-20 rounded-lg object-cover border"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/80x80?text=IMG";
                  }}
                />

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xl">{work.title}</p>
                  <p className="text-sm text-gray-500 mb-2">{work.notes}</p>

                  <div className="flex flex-wrap gap-2">
                    {work.categories.map((wc) => (
                      <span
                        key={wc.categoryId}
                        className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full"
                      >
                        {wc.category.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => handleEdit(work)}
                  className="flex items-center gap-1 bg-yellow-500 px-4 py-2 text-white rounded-lg"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(work.id, work.title)}
                  className="flex items-center gap-1 bg-red-500 px-4 py-2 text-white rounded-lg"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <WorkModal
          work={currentWorkData}
          categories={categories}
          availableItems={items}
          onSave={handleSaveWork}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default App;
