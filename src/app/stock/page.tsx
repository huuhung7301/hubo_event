"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "~/trpc/react";
import Image from "next/image";

interface ItemCategory {
  id: number;
  name: string;
}

interface Item {
  id: number;
  key: string;
  name: string;
  basePrice: number;
  unit?: string | null;
  categoryId?: number | null;
  imageUrl?: string | null;
  category?: ItemCategory | null;
}

export default function AdminStockPage() {
  // TRPC
  const categoriesQuery = api.stock.getCategories.useQuery();

  // 1. Fetch ALL items without any filtering parameters.
  const allItemsQuery = api.stock.getAll.useQuery({});
  const allItems = allItemsQuery.data; // The full, unfiltered list

  // Local state for filtering
  const [filterCategory, setFilterCategory] = useState<number | "">("");
  const [filterKeyword, setFilterKeyword] = useState("");

  const createItem = api.stock.create.useMutation();
  const updateItem = api.stock.update.useMutation();
  const deleteItem = api.stock.delete.useMutation();
  const uploadImage = api.stock.uploadImage.useMutation();

  // Local state for form (unchanged)
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    basePrice: 0,
    unit: "",
    categoryId: undefined as number | undefined,
    imageFile: undefined as File | undefined,
    imageUrl: "",
  });

  // Update formData when editing (unchanged)
  useEffect(() => {
    // ... (omitted for brevity - same as original)
    if (editingItem) {
      setFormData({
        key: editingItem.key,
        name: editingItem.name,
        basePrice: editingItem.basePrice,
        unit: editingItem.unit ?? "",
        categoryId: editingItem.categoryId ?? undefined,
        imageUrl: editingItem.imageUrl ?? "",
        imageFile: undefined,
      });
    } else {
      setFormData({
        key: "",
        name: "",
        basePrice: 0,
        unit: "",
        categoryId: undefined,
        imageUrl: "",
        imageFile: undefined,
      });
    }
  }, [editingItem]);

  // Image preview (unchanged)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      imageUrl: URL.createObjectURL(file),
    }));
  };

  // Submit create/update (refetches ALL items)
  const handleSubmit = async () => {
    let uploadedImageUrl = formData.imageUrl;

    if (formData.imageFile) {
      const base64 = await fileToBase64(formData.imageFile);
      const result = await uploadImage.mutateAsync({
        fileName: formData.imageFile.name,
        fileType: formData.imageFile.type,
        base64,
      });
      uploadedImageUrl = result.url;
    }

    if (editingItem) {
      await updateItem.mutateAsync({
        id: editingItem.id,
        key: formData.key,
        name: formData.name,
        basePrice: formData.basePrice,
        unit: formData.unit,
        categoryId: formData.categoryId,
        imageUrl: uploadedImageUrl,
      });
    } else {
      await createItem.mutateAsync({
        key: formData.key,
        name: formData.name,
        basePrice: formData.basePrice,
        unit: formData.unit,
        categoryId: formData.categoryId,
        imageUrl: uploadedImageUrl,
      });
    }

    setEditingItem(null);
    await allItemsQuery.refetch(); // Refetch all items after mutation
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this item?")) return;
    await deleteItem.mutateAsync({ id });
    await allItemsQuery.refetch(); // Refetch all items after mutation
  };

  // Helper: File → Base64 (unchanged)
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file as Base64"));
    });

  // 2. Local Filtering Logic (The FIX)
  const filteredItems = useMemo(() => {
    if (!allItems) return [];

    let tempItems = allItems;

    // Filter by Keyword (case-insensitive)
    if (filterKeyword) {
      const keyword = filterKeyword.toLowerCase();
      tempItems = tempItems.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.key.toLowerCase().includes(keyword),
      );
    }

    // Filter by Category
    if (filterCategory !== "") {
      const categoryId = Number(filterCategory);
      tempItems = tempItems.filter((item) => item.categoryId === categoryId);
    }

    return tempItems;
  }, [allItems, filterKeyword, filterCategory]); // Re-run only when data or filters change

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Admin Stock Management</h1>

      {/* Form (unchanged) */}
      <div className="mb-6 rounded-lg border bg-gray-50 p-4">
        {/* ... (Form inputs and buttons remain the same) */}
        <h2 className="mb-2 font-semibold">
          {editingItem ? "Edit Item" : "Add New Item"}
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            placeholder="Key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            className="rounded border p-2"
          />

          <input
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="rounded border p-2"
          />

          <input
            type="number"
            placeholder="Base Price"
            value={formData.basePrice}
            onChange={(e) =>
              setFormData({ ...formData, basePrice: Number(e.target.value) })
            }
            className="rounded border p-2"
          />

          <input
            placeholder="Unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="rounded border p-2"
          />

          <select
            value={formData.categoryId ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                categoryId: Number(e.target.value) || undefined,
              })
            }
            className="rounded border p-2"
          >
            <option value="">-- Select Category --</option>
            {categoriesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex flex-col">
            <label className="mb-1 font-medium">Upload Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {formData.imageUrl && (
              <Image
                src={formData.imageUrl}
                alt="Preview"
                className="mt-2 h-24 w-24 rounded border object-cover"
                width={96}
                height={96}
              />
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-3">
          <button
            onClick={handleSubmit}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {editingItem ? "Update Item" : "Add Item"}
          </button>

          {editingItem && (
            <button
              onClick={() => setEditingItem(null)}
              className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Filters (unchanged, but now only update local state) */}
      <div className="mb-4 flex flex-col items-center gap-3 md:flex-row">
        <input
          placeholder="Search by name or key"
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          className="flex-1 rounded border p-2"
        />

        <select
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(
              e.target.value === "" ? "" : Number(e.target.value),
            )
          }
          className="rounded border p-2"
        >
          <option value="">-- All Categories --</option>
          {categoriesQuery.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Item List: Renders filteredItems */}
      <div className="space-y-2">
        {allItemsQuery.isLoading && <p>Loading items...</p>}
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded border bg-white p-2 shadow-sm"
          >
            <div className="flex items-center gap-4">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-16 w-16 rounded object-cover"
                  width={64}
                  height={64}
                />
              )}
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  Key: {item.key} | Price: ${item.basePrice} | Unit:{" "}
                  {item.unit ?? "-"} | Category: {item.category?.name ?? "-"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem(item)}
                className="rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && !allItemsQuery.isLoading && (
          <p className="text-gray-500">No items match your filter criteria.</p>
        )}
      </div>
    </div>
  );
}
