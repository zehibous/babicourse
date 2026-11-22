import type { Metadata } from "next";
import CadreCompte from "@/components/CadreCompte";
import Questionnaire from "./Questionnaire";

export const metadata: Metadata = { title: "Essayer BabiCourse" };

export default function PageEssai() {
  return (
    <CadreCompte large>
      <Questionnaire />
    </CadreCompte>
  );
}
