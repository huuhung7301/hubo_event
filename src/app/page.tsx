import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { api, HydrateClient } from "~/trpc/server";
import FilteredArea from "./_components/filteredArea";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const works = await api.work.getAllWorks();
  const categories = await api.work.getAllCategories();
  console.log("aaa", works)
  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="flex min-h-screen flex-col font-sans">
          {/* Navbar */}
          <header className="mx-auto flex w-[95%] items-center justify-between border-b py-4 lg:w-[80%]">
            <h1 className="text-lg font-bold">Hubo Events</h1>
            <nav className="hidden gap-8 text-sm md:flex">
              <a href="#" className="hover:text-gray-600">
                Decorations
              </a>
              <a href="#" className="hover:text-gray-600">
                Rent
              </a>
              <a href="#" className="hover:text-gray-600">
                Package
              </a>
            </nav>
            <button className="rounded-full border px-4 py-1 text-sm hover:bg-gray-100">
              Order decorations
            </button>
          </header>

          {/* Works Section */}
          <section className="px-8 py-12">
            <FilteredArea works={works} categories={categories} />
          </section>
        </div>
      </main>
    </HydrateClient>
  );
}
