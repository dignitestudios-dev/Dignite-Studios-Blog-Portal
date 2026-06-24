import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

interface SeoPayload {
  title: string;
  excerpt: string;
  contentText: string;
  focusKeyword: string;
  field?: "seoTitle" | "metaDescription" | "schema" | "excerpt";
}

const SYSTEM_FULL = `You are an expert SEO strategist. Given a blog post's details, generate optimized SEO metadata.
Return ONLY a valid JSON object with these exact keys:
{
  "seoTitle": "string (STRICTLY max 60 chars, compelling, includes keyword)",
  "metaDescription": "string (STRICTLY max 160 chars, actionable, includes keyword)",
  "keywords": ["array", "of", "5-8", "relevant", "keywords"],
  "ogTitle": "string (engaging social title, max 70 chars)",
  "ogDescription": "string (engaging social description, max 200 chars)",
  "twitterTitle": "string (concise Twitter-friendly title, max 60 chars)",
  "twitterDescription": "string (concise Twitter description, max 150 chars)"
}
CRITICAL: seoTitle MUST be under 60 characters. metaDescription MUST be under 160 characters. Count carefully.
Do not include any explanation, markdown, or code fences. Return only the JSON.`;

const SYSTEM_TITLE = `You are an SEO expert. Generate a single optimized SEO title for the given blog post. CRITICAL: It MUST be under 60 characters — count carefully. Return ONLY a valid JSON: {"seoTitle": "..."}. No explanation, no markdown.`;

const SYSTEM_DESC = `You are an SEO expert. Generate a single optimized meta description for the given blog post. CRITICAL: It MUST be under 160 characters — count carefully. Make it action-oriented. Return ONLY a valid JSON: {"metaDescription": "..."}. No explanation, no markdown.`;

const SYSTEM_SCHEMA = `You are an SEO expert. Generate a short article description (2-3 sentences, max 200 chars) and a compelling headline for the given blog post for use in JSON-LD structured data. Return ONLY a valid JSON: {"description": "...", "headline": "..."}. No explanation, no markdown.`;

const SYSTEM_EXCERPT = `You are a professional blog editor. Write a concise, engaging excerpt/summary (1-2 sentences, max 160 characters) for the given blog post that would appear in blog listing cards. CRITICAL: It MUST be under 160 characters — count carefully. Return ONLY a valid JSON: {"excerpt": "..."}. No explanation, no markdown.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenRouter API key not configured." }, { status: 500 });
  }

  const body: SeoPayload = await req.json();
  const { title, excerpt, contentText, focusKeyword, field } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Post title is required." }, { status: 400 });
  }

  const contentPreview = contentText?.replace(/<[^>]*>/g, " ").trim().slice(0, 600) ?? "";
  const userMessage = [
    `Blog Post Title: ${title}`,
    focusKeyword ? `Focus Keyword: ${focusKeyword}` : "",
    excerpt ? `Excerpt: ${excerpt}` : "",
    contentPreview ? `Content Preview: ${contentPreview}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt =
    field === "seoTitle" ? SYSTEM_TITLE :
    field === "metaDescription" ? SYSTEM_DESC :
    field === "schema" ? SYSTEM_SCHEMA :
    field === "excerpt" ? SYSTEM_EXCERPT :
    SYSTEM_FULL;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: field ? 200 : 600,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://dignitestudios.com",
          "X-OpenRouter-Title": "Dignite Studios Blog CMS",
        },
      }
    );

    const raw: string = response.data.choices?.[0]?.message?.content ?? "";

    let parsed: Record<string, unknown>;
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Please retry." }, { status: 502 });
    }

    // Hard-truncate to enforce character limits regardless of AI output
    if (typeof parsed.seoTitle === "string" && parsed.seoTitle.length > 60) {
      parsed.seoTitle = parsed.seoTitle.slice(0, 57) + "…";
    }
    if (typeof parsed.metaDescription === "string" && parsed.metaDescription.length > 160) {
      parsed.metaDescription = parsed.metaDescription.slice(0, 157) + "…";
    }
    if (typeof parsed.excerpt === "string" && parsed.excerpt.length > 160) {
      parsed.excerpt = parsed.excerpt.slice(0, 157) + "…";
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    const errMsg = error?.response?.data?.error?.message || error.message || "Unknown AI Error";
    console.error("AI Generation Error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
