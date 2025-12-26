import type { FC } from "react";
import type { ItemListing } from "./page";
import Link from "next/link";
import { useCart } from "~/store/useCart";
import Image from "next/image";

export const ItemCard: FC<{ item: ItemListing }> = ({ item }) => {
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(item.basePrice);
  const addItem = useCart((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({
      key: item.key,
      name: item.name,
      price: item.basePrice,
      imageUrl: item.imageUrl ?? undefined,
      quantity: 1,
    });
  };

  return (
    <div className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:border-indigo-400 hover:shadow-xl">
      <Link href={`/items/${item.key}`} className="block">
        <div className="h-48 overflow-hidden">
          <Image
            src={
              item.imageUrl ??
              "https://placehold.co/600x400/9CA3AF/FFFFFF?text=No+Image"
            }
            alt={item.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            width={600}
            height={400}
          />
        </div>
      </Link>

      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-md truncate font-semibold text-gray-900">
            {item.name}
          </p>

          {item.category && (
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs whitespace-nowrap text-indigo-800">
              {item.category.name}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500">
          <span className="font-mono text-gray-700">{item.key}</span> • per{" "}
          {item.unit ?? "EA"}
        </p>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xl font-medium">{price}</span>

          <div className="flex gap-2">
            <button
              className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-800 transition hover:bg-gray-300"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
