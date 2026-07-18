import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">DevLens AI</h1>
      <p className="text-gray-500">Understand any codebase, explained like you're new here.</p>

      <SignedOut>
        <SignInButton mode="modal" />
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-3">
          <UserButton />
          <Link href="/dashboard" className="underline">
            Go to dashboard
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
