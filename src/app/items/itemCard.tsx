import type { FC } from "react";
import type { ItemListing } from "./page";
import Link from "next/link";
import { useCart } from "~/store/useCart";

export const ItemCard: FC<{ item: ItemListing }> = ({ item }) => {
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.basePrice);
  const addItem = useCart((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({
      key: item.key,
      name: item.name,
      price: item.basePrice,
      imageUrl: item.imageUrl ?? undefined,
      quantity: 1,
    });

    // Log the entire cart
    console.log("Current cart:", useCart.getState().items);
  };

  return (
    <div className="group rounded-2xl bg-white border shadow-sm hover:shadow-xl hover:border-indigo-400 transition overflow-hidden">
      <Link href={`/items/${item.key}`} className="block">
        <div className="h-48 overflow-hidden">
          <img
            src={item.imageUrl ?? "https://placehold.co/600x400/9CA3AF/FFFFFF?text=No+Image"}
            alt={item.name}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
      </Link>

      <div className="p-4 space-y-2">
        <div className="flex justify-between items-center gap-2">
          <p className="text-md font-semibold text-gray-900 truncate">{item.name}</p>

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
          <span className="text-xl font-medium ">{price}</span>

          <div className="flex gap-2">
            <button
              className="text-sm bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition"
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
