"use client";

import { useUser, useClerk } from "@clerk/nextjs";

export default function UserGreeting() {
  const { user, isSignedIn } = useUser();
  const { openSignIn, signOut } = useClerk();

  return (
    <div className="flex items-center gap-3">
      {/* Greeting */}
      {isSignedIn && (
        <p className="font-semibold">
          Hi, {user?.firstName ?? user?.username}
        </p>
      )}

      {/* Button */}
      {isSignedIn ? (
        <button
          onClick={() => signOut()}
          className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 hover:text-black"
        >
          Log out
        </button>
      ) : (
        <button
          onClick={() => openSignIn()}
          className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 hover:text-black"
        >
          Sign in
        </button>
      )}
    </div>
  );
}
