import { ReactNode } from "react";
import { signOut } from "@/auth";

interface AppShellProps {
  username: string;
  children: ReactNode;
}

export default function AppShell({ username, children }: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <span className="text-xs font-semibold tracking-tight">FBR</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900 sm:text-base">
                Digital Invoicing
              </div>
              <div className="hidden text-xs text-slate-500 sm:block">
                FBR / PRAL DI API client
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              Signed in as <span className="font-medium text-slate-700">{username}</span>
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
          PRAL Digital Invoicing API · Tokens stay on the server when configured via environment
          variables.
        </div>
      </footer>
    </div>
  );
}
