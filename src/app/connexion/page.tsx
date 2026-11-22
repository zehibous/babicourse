import { Suspense } from "react";
import CadreCompte from "@/components/CadreCompte";
import FormulaireConnexion from "./FormulaireConnexion";

export default function PageConnexion() {
  return (
    <CadreCompte>
      <Suspense>
        <FormulaireConnexion />
      </Suspense>
    </CadreCompte>
  );
}
