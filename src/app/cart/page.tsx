"use client";

import Link from "next/link";
import { useCart } from "~/store/useCart";
import type { CartItem } from "~/store/useCart";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useMemo } from "react";

export default function CartPage() {
  const { items, addItem, removeItem, clear } = useCart();

  const totalPrice = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
        <ShoppingBag size={48} className="text-indigo-600 mb-4" />
        <p className="text-xl text-gray-700 mb-4">Your cart is empty.</p>
        <Link
          href="/items"
          className="text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          Browse Items
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Your Cart</h1>

      <div className="space-y-6">
        {items.map((item: CartItem) => (
          <div
            key={item.key}
            className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border"
          >
            <img
              src={item.imageUrl ?? "https://placehold.co/100x100/9CA3AF/FFFFFF?text=No+Image"}
              alt={item.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
              <p className="text-sm text-gray-500">
                Key: <span className="font-mono">{item.key}</span>
              </p>
              <p className="text-indigo-600 font-bold mt-1">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => addItem({ ...item, quantity: -1 })}
                >
                  <Minus size={16} />
                </button>
                <span className="px-2">{item.quantity}</span>
                <button
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => addItem({ ...item, quantity: 1 })}
                >
                  <Plus size={16} />
                </button>

                <button
                  className="ml-4 text-red-600 hover:text-red-800"
                  onClick={() => removeItem(item.key)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end gap-4">
        <p className="text-xl font-bold text-gray-900">
          Total: ${totalPrice.toFixed(2)}
        </p>
        <div className="flex gap-4">
          <button
            className="rounded-lg bg-red-600 px-6 py-2 text-white font-semibold hover:bg-red-700 transition"
            onClick={clear}
          >
            Clear Cart
          </button>
          <button className="rounded-lg bg-indigo-600 px-6 py-2 text-white font-semibold hover:bg-indigo-700 transition">
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
