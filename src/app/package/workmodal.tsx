"use client";

import React, { useState, useCallback, useMemo } from "react";
import { X, Upload } from "lucide-react";
import type { WorkInputDTO, Category, Item } from "./page";
import { ItemListManager } from "./itemListManager";
import { api } from "~/trpc/react";

interface WorkModalProps {
  work: WorkInputDTO | null;
  categories: Category[];
  availableItems: Item[];
  onSave: (data: WorkInputDTO) => void;
  onClose: () => void;
}

const newWorkInitialState: WorkInputDTO = {
  id: null,
  title: "",
  imageUrl: "",
  notes: "",
  categoryIds: [],
  requiredItems: [],
  optionalItems: [],
};

export const WorkModal: React.FC<WorkModalProps> = ({
  work,
  categories,
  availableItems,
  onSave,
  onClose,
}) => {
  const initialFormData = useMemo(() => {
    return work || newWorkInitialState;
  }, [work]);

  const [formData, setFormData] = useState<WorkInputDTO>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ---- tRPC mutation for file upload ----
  const uploadImageMutation = api.stock.uploadImage.useMutation();

  // ---- Upload Image Handler ----
  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);

    try {
      const base64 = await toBase64(file);
      const { url } = await uploadImageMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        base64,
      });

      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // ---- General field updates ----
  const handleInputChange = useCallback(
    (
      field: keyof Omit<
        WorkInputDTO,
        "id" | "requiredItems" | "optionalItems" | "categoryIds"
      >,
      value: string
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // ---- Category toggle ----
  const handleCategoryToggle = useCallback((categoryId: number) => {
    setFormData((prev) => {
      const isSelected = prev.categoryIds.includes(categoryId);
      return {
        ...prev,
        categoryIds: isSelected
          ? prev.categoryIds.filter((id) => id !== categoryId)
          : [...prev.categoryIds, categoryId],
      };
    });
  }, []);

  // ---- Required / Optional item handlers ----
  const createItemHandlers = (field: "requiredItems" | "optionalItems") => ({
    onAdd: (itemId: number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], { itemId, quantity: 1 }],
      }));
    },
    onChange: (index: number, quantity: number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].map((item, i) =>
          i === index ? { ...item, quantity: Math.max(1, quantity) } : item
        ),
      }));
    },
    onRemove: (index: number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    },
  });

  const requiredItemHandlers = createItemHandlers("requiredItems");
  const optionalItemHandlers = createItemHandlers("optionalItems");

  // ---- Save Form ----
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) {
      alert("Title and image are required.");
      return;
    }

    setIsSaving(true);
    await new Promise((res) => setTimeout(res, 300));
    onSave(formData);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex justify-center items-start pt-10 pb-10">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 transition-all transform duration-300">
        <div className="p-6 border-b flex justify-between items-center bg-white z-10 rounded-t-xl">
          <h3 className="text-2xl font-bold text-gray-800">
            {formData.id ? "Edit Work" : "Create New Work"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Title & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full rounded-lg border-gray-300 p-3"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Image <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-col gap-2">
                {/* Current Preview */}
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="preview"
                    className="w-full h-40 object-cover rounded-lg shadow"
                  />
                )}

                <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 justify-center hover:bg-indigo-700 transition">
                  <Upload size={18} />
                  {uploading ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border-gray-300 p-3"
            ></textarea>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-indigo-700">
              Categories (WorkCategory)
            </h3>
            <div className="flex flex-wrap gap-3 p-3 border rounded-lg bg-gray-50">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategoryToggle(c.id)}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    formData.categoryIds.includes(c.id)
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-indigo-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Required + Optional Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ItemListManager
              title="Required Items (WorkItem)"
              items={formData.requiredItems}
              availableItems={availableItems}
              {...requiredItemHandlers}
            />

            <ItemListManager
              title="Optional Items (WorkOptionalItem)"
              items={formData.optionalItems}
              availableItems={availableItems}
              {...optionalItemHandlers}
              isOptional={true}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-6 py-3"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-6 py-3 text-white shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
              disabled={!formData.title || !formData.imageUrl || isSaving}
            >
              {isSaving ? "Saving..." : formData.id ? "Save Changes" : "Create Work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
