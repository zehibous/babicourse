import { Suspense } from "react";
import Navigation from "@/components/Navigation";

export default function LayoutGerant({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-[57px] border-b border-bord bg-surface" />}>
        <Navigation />
      </Suspense>
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
