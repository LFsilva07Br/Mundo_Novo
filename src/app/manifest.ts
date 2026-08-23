import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mundo Novo — App de Campo",
    short_name: "Mundo Novo",
    description:
      "App de campo do consultor — checklists de certificação que funcionam offline.",
    start_url: "/campo",
    display: "standalone",
    background_color: "#122B1F",
    theme_color: "#122B1F",
    orientation: "portrait",
    icons: [
      {
        src: "/icone.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icone-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
