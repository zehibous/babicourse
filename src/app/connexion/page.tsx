import { Suspense } from "react";
import FormulaireConnexion from "./FormulaireConnexion";

export default function PageConnexion() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-fond p-4">
      <Suspense>
        <FormulaireConnexion />
      </Suspense>
    </div>
  );
}
