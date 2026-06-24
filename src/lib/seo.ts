export function generateArticleJsonLd({
  title,
  slug,
  seo,
  author,
}: {
  title: string;
  slug: string;
  seo: {
    seoTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
  author?: { name?: string };
}): object {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://dignitestudios.com";
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: seo.seoTitle ?? title,
    description: seo.metaDescription ?? "",
    image: seo.ogImage ? [seo.ogImage] : [],
    author: {
      "@type": "Person",
      name: author?.name ?? "Dignite Studios",
    },
    publisher: {
      "@type": "Organization",
      name: "Dignite Studios",
      logo: {
        "@type": "ImageObject",
        url: `${websiteUrl}/logo.png`,
      },
    },
    url: `${websiteUrl}/blog/${slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${websiteUrl}/blog/${slug}`,
    },
  };
}

export function generateBreadcrumbJsonLd(slug: string, title: string): object {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://dignitestudios.com";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: websiteUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${websiteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: title, item: `${websiteUrl}/blog/${slug}` },
    ],
  };
}
