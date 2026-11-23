import type { MetadataRoute } from "next";

// Permet d'« installer » BabiCourse sur le téléphone (Ajouter à l'écran d'accueil) :
// l'appli s'ouvre alors en plein écran et apparaît comme une vraie appli dans les applis récentes,
// ce qui facilite le retour après un passage par WhatsApp.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BabiCourse – Suivi des livreurs",
    short_name: "BabiCourse",
    description: "Suivez vos livreurs en direct sur la carte, jusqu'à la destination.",
    start_url: "/espace",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f5f2",
    theme_color: "#ea580c",
    lang: "fr",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
