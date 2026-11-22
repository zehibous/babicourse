import { Suspense } from "react";
import Navigation from "@/components/Navigation";

export default function LayoutGerant({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row">
      <Suspense
        fallback={<div className="h-14 border-b border-bord bg-surface lg:h-screen lg:w-60 lg:border-b-0 lg:border-r" />}
      >
        <Navigation />
      </Suspense>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
