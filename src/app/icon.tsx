import { ImageResponse } from "next/og";

// Icône de l'application (onglet du navigateur et écran d'accueil du téléphone) :
// un repère de carte blanc sur fond orange BabiCourse.
export function generateImageMetadata() {
  return [
    { id: "192", contentType: "image/png", size: { width: 192, height: 192 } },
    { id: "512", contentType: "image/png", size: { width: 512, height: 512 } },
  ];
}

export function dessinIcone(taille: number) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ea580c",
      }}
    >
      <svg width={taille * 0.58} height={taille * 0.58} viewBox="0 0 24 24">
        <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Z" fill="#ffffff" />
        <circle cx="12" cy="9" r="2.8" fill="#ea580c" />
      </svg>
    </div>
  );
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const taille = Number(await id);
  return new ImageResponse(dessinIcone(taille), { width: taille, height: taille });
}
