"use client";

import { useState, useEffect } from "react";
import MobileOverlay from "./mobileOverlay";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import PackageModal from "./packageModal";
import DesktopOverlay from "./desktopOverlay";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export interface PackageItem {
  name: string;
  key: string;
  quantity: number;
  price: number;
}
interface PackageCardProps {
  src: string;
  title: string;
  categories: string[];
  items: PackageItem[];
  optionalItems?: PackageItem[];
  totalPrice: number;
  notes?: string;
}

export default function PackageCard({
  src,
  title,
  categories = [],
  items,
  optionalItems = [],
  totalPrice,
  notes,
}: PackageCardProps) {
  const [open, setOpen] = useState(false);

  const [isDesktop, setIsDesktop] = useState(true);
  console.log("items", items);
  console.log("optionalItems", optionalItems);
  console.log("totalPrice", totalPrice);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return (
    <>
      {/* Card */}
      <div
        onClick={() => setOpen(true)}
        className="group relative cursor-pointer overflow-hidden rounded-lg shadow-md"
      >
        <img
          src={src}
          alt={title}
          className="h-48 sm:h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute bottom-0 left-0 w-full translate-y-full bg-black/70 p-4 text-white transition-transform duration-500 ease-out group-hover:translate-y-0">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </div>

      {/* Desktop Modal */}
      {isDesktop && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="!max-w-[70vw] rounded-2xl shadow-lg border-0 ">
            <DialogTitle className="">
              <VisuallyHidden> {title}</VisuallyHidden>
            </DialogTitle>

            <DesktopOverlay
              onClose={() => setOpen(false)}
              title={title}
              src={src}
              categories={categories}
              items={items}
              optionalItems={optionalItems}
              totalPrice={totalPrice}
              notes={notes}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile Sheet */}
      {!isDesktop && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="h-[100vh] rounded-t-sm">
            <SheetHeader className="pb-0">
              <SheetTitle className="text-lg sm:text-2xl md:text-3xl">
                {title}
              </SheetTitle>
            </SheetHeader>

            <MobileOverlay
              onClose={() => setOpen(false)}
              title={title}
              src={src}
              categories={categories}
              items={items}
              optionalItems={optionalItems}
              totalPrice={totalPrice}
              notes={notes}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
