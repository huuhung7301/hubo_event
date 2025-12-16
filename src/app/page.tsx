
import Link from "next/link";
import UserGreeting from "./_components/userGreeting";
import { api, HydrateClient } from "~/trpc/server";
import FilteredArea from "./_components/filteredArea";

export default async function Home() {
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
            <nav className="text-sm flex-shrink-0">
              <UserGreeting />
            </nav>
            {/* <nav className="hidden gap-8 text-sm md:flex"> */}
              {/* <a href="/" className="font-semibold text-indigo-600 hover:text-indigo-600">
                Decoration Packages
              </a> */}
              {/* <a href="/items" className="hover:text-gray-600">
                Rent
              </a>
              <a href="/purchase" className="hover:text-indigo-600">
                Buy
              </a> */}
            {/* </nav> */}
            {/* <button className="rounded-full border px-4 py-1 text-sm hover:bg-gray-100">
              Order decorations
            </button> */}
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
