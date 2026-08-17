import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "For Marwan — Happy Birthday" },
      { name: "description", content: "A secret birthday PWA built for Marwan." },
      { property: "og:title", content: "For Marwan — Happy Birthday" },
      { property: "og:description", content: "A secret birthday PWA built for Marwan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#2d1a2e" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/app.html");
  }, []);
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2d1a2e",
        color: "#f0e6f0",
        fontFamily: "monospace",
      }}
    >
      Loading...
    </div>
  );
}
