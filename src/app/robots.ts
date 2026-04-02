import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/portal/"],
      },
    ],
    sitemap: "https://skawk.io/sitemap.xml",
    host: "https://skawk.io",
  };
}
