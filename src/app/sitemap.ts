import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://signal.app", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://signal.app/analyze", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://signal.app/dashboard", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
