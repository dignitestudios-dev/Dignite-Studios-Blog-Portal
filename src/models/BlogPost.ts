import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISeoData {
  focusKeyword: string;
  seoTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterCard: "summary" | "summary_large_image";
  canonicalUrl: string;
  robots: { index: boolean; follow: boolean };
  jsonLd: object;
  seoScore: number;
  readabilityScore: number;
  seoChecks: { id: string; status: "pass" | "warn" | "fail"; message: string }[];
}

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  content: object;
  contentHtml: string;
  excerpt: string;
  featuredImage: { url: string; alt: string };
  categories: string[];
  tags: string[];
  author: { name: string; avatar: string };
  status: "draft" | "published" | "scheduled";
  publishedAt: Date | null;
  scheduledAt: Date | null;
  seo: ISeoData;
  readTime: number;
  isTrashed: boolean;
  trashedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SeoSchema = new Schema<ISeoData>(
  {
    focusKeyword: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
    ogTitle: { type: String, default: "" },
    ogDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterTitle: { type: String, default: "" },
    twitterDescription: { type: String, default: "" },
    twitterImage: { type: String, default: "" },
    twitterCard: { type: String, enum: ["summary", "summary_large_image"], default: "summary_large_image" },
    canonicalUrl: { type: String, default: "" },
    robots: {
      index: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
    },
    jsonLd: { type: Schema.Types.Mixed, default: {} },
    seoScore: { type: Number, default: 0 },
    readabilityScore: { type: Number, default: 0 },
    seoChecks: [
      {
        id: String,
        status: { type: String, enum: ["pass", "warn", "fail"] },
        message: String,
      },
    ],
  },
  { _id: false }
);

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: Schema.Types.Mixed, default: {} },
    contentHtml: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    featuredImage: {
      url: { type: String, default: "" },
      alt: { type: String, default: "" },
    },
    categories: [{ type: String }],
    tags: [{ type: String }],
    author: {
      name: { type: String, default: "" },
      avatar: { type: String, default: "" },
    },
    status: { type: String, enum: ["draft", "published", "scheduled"], default: "draft" },
    publishedAt: { type: Date, default: null },
    scheduledAt: { type: Date, default: null },
    seo: { type: SeoSchema, default: () => ({}) },
    readTime: { type: Number, default: 1 },
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ status: 1, publishedAt: -1 });

const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost ?? mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
