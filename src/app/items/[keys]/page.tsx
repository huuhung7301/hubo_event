"use client";

import { ShoppingBag, Loader2, DollarSign } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { useCart } from "~/store/useCart";

export default function ItemDetailPage() {
  const params = useParams();
  const itemKey = params?.keys as string | undefined;

  const addItem = useCart((s) => s.addItem);

  // If no param is present (rare, but safe guard)
  if (!itemKey) {
    return (
      <div className="p-10 text-center text-red-600">Invalid item key.</div>
    );
  }

  const {
    data: item,
    isLoading,
    error,
    isError,
  } = api.stock.getByKey.useQuery({ key: itemKey });

  // ---------------------------
  // LOADING STATE
  // ---------------------------
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
        <p className="ml-4 text-xl font-medium text-gray-700">
          Loading Item Details...
        </p>
      </div>
    );
  }

  // ---------------------------
  // ERROR STATE
  // ---------------------------
  if (isError) {
    return (
      <div className="m-8 rounded-lg border border-red-200 bg-red-50 p-10 text-center text-red-500">
        Error loading item: {error.message}
      </div>
    );
  }

  // ---------------------------
  // NOT FOUND
  // ---------------------------
  if (!item) {
    return (
      <div className="m-8 rounded-lg border border-gray-300 bg-gray-100 p-10 text-center text-gray-600">
        <h1 className="mb-4 text-3xl font-bold">Item Not Found (404)</h1>
        <p>
          The item with key <strong>{itemKey}</strong> could not be found.
        </p>
        <Link
          href="/items"
          className="mt-4 inline-block text-indigo-600 transition hover:text-indigo-800"
        >
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  // ---------------------------
  // PRICE AFTER item exists
  // ---------------------------
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(item.basePrice);

  // ---------------------------
  // ADD TO CART
  // ---------------------------
  const handleAdd = () => {
    const fullCart = useCart.getState().items;
    console.log("Full cart:", fullCart);

    addItem({
      key: item.key,
      name: item.name,
      imageUrl: item.imageUrl ?? undefined,
      price: item.basePrice,
      quantity: 1,
    });
  };

  const placeholderImage =
    "https://placehold.co/800x600/9CA3AF/FFFFFF?text=No+Image+Available";

  // ---------------------------
  // RENDER ITEM PAGE
  // ---------------------------
  return (
    <div className="min-h-screen bg-white">
      {/* ====================== NAVBAR ====================== */}
      <header className="sticky top-0 z-20 mx-auto flex w-[95%] items-center justify-between border-b bg-white py-4 lg:w-[80%]">
        <h1 className="text-xl font-bold">Hubo Events</h1>

        <Link
          href="/items"
          className="rounded-full border px-4 py-1 text-sm text-indigo-600 transition hover:bg-gray-100"
        >
          ← Back to Catalog
        </Link>
      </header>

      {/* ====================== DETAIL CONTENT ====================== */}
      <div className="mx-auto px-6 py-12 sm:px-10 lg:w-[80%]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* --- IMAGE --- */}
          <div className="overflow-hidden rounded-2xl border bg-gray-100 shadow-2xl">
            <img
              src={item.imageUrl || placeholderImage}
              alt={item.name}
              className="h-auto max-h-[600px] w-full object-cover"
            />
          </div>

          {/* --- DETAILS --- */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-800">
                {item.category?.name ?? "Uncategorized"}
              </span>

              <h2 className="text-5xl leading-tight font-extrabold text-gray-900">
                {item.name}
              </h2>

              <p className="text-lg text-gray-600">
                Rent by the {item.unit ?? "Each (EA)"} for your event setup.
              </p>
            </div>

            <div className="flex items-center gap-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <DollarSign size={32} className="text-indigo-600" />
              <span className="text-4xl font-extrabold text-indigo-800">
                {price}
              </span>
              <span className="text-lg font-medium text-indigo-600">
                per {item.unit ?? "EA"}
              </span>
            </div>

            {/* KEY INFO */}
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-gray-800">
                Key Information
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex justify-between border-b pb-2">
                  <span className="font-medium">Inventory Key:</span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-gray-900">
                    {item.key}
                  </code>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="font-medium">Rental Unit:</span>
                  <span>{item.unit ?? "Each (EA)"}</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="font-medium">Category:</span>
                  <span>{item.category?.name ?? "N/A"}</span>
                </li>
                <li className="pt-2 text-sm text-gray-500 italic">
                  * Stock availability must be confirmed upon reservation.
                </li>
              </ul>
            </div>

            {/* ====================== BUTTONS ====================== */}
            <div className="flex flex-col gap-4">
              <button
                onClick={handleAdd}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-indigo-700"
              >
                <ShoppingBag size={24} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
