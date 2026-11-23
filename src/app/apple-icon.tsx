import { ImageResponse } from "next/og";
import { dessinIcone } from "./icon";

// Icône pour l'écran d'accueil des iPhone.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(dessinIcone(180), size);
}
