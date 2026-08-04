/**
 * CTA banner template.
 *
 * The markup here is a faithful port of the CTA node that shipped with the
 * previous editor: same inline styles, same `data-*` attributes, same DOM
 * shape. Keeping it identical means posts published before this editor existed
 * keep rendering exactly as they do today on the public site, and a CTA can be
 * round-tripped (HTML -> block -> HTML) without drift.
 *
 * All styling is inline on purpose — the public site renders `contentHtml`
 * through `dangerouslySetInnerHTML` inside `.blog-content`, which has no CTA
 * styles of its own.
 */
import { escapeAttr, escapeHtml } from "./escape";

export interface CtaData {
  heading: string;
  paragraph: string;
  buttonText: string;
  buttonHref: string;
}

/**
 * Max length of the button label. Beyond this the pill stops looking like a
 * button — it wraps out of the banner on narrow viewports.
 */
export const CTA_BUTTON_MAX_LENGTH = 55;

export const DEFAULT_CTA: CtaData = {
  heading: "Get Clear On Your Next Move",
  paragraph:
    "Choosing the right enterprise mobile app development services can define your project’s success. Let our experts help you plan, design and build a solution which truly meets the business needs.",
  buttonText: "Get Started Today",
  buttonHref: "#",
};

export const CTA_STYLES = {
  wrapper:
    "border-radius:20px;background-color:#F15C20;padding:40px 6% 36px;text-align:center;font-family:Arial,sans-serif;box-sizing:border-box;width:100%;overflow:hidden;margin-top:40px;margin-bottom:40px",
  heading:
    "margin:0 0 14px;font-size:30px;font-weight:700;line-height:1.25;color:#ffffff;word-break:break-word;overflow-wrap:break-word;text-align:center",
  paragraph:
    "margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.92);line-height:1.5;word-break:break-word;overflow-wrap:break-word",
  buttonGroup: "display:inline-flex;align-items:center;gap:0px",
  buttonLabel:
    "display:inline-flex;align-items:center;justify-content:center;background:#ffffff;color:#F15C20;text-decoration:none;font-size:14px;font-weight:600;padding:0 32px;border-radius:50px;white-space:nowrap;line-height:1;min-width:160px;height:52px;box-sizing:border-box",
  buttonArrow:
    "display:inline-flex;align-items:center;justify-content:center;background:#ffffff;color:#F15C20;text-decoration:none;width:52px;height:52px;border-radius:50px;flex-shrink:0;box-sizing:border-box",
} as const;

const ARROW_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right-icon lucide-arrow-up-right"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>';

/** Fills in any missing field with its default and enforces the button limit. */
export function normalizeCta(input?: Partial<CtaData> | null): CtaData {
  const data = input ?? {};
  return {
    heading: data.heading ?? DEFAULT_CTA.heading,
    paragraph: data.paragraph ?? DEFAULT_CTA.paragraph,
    buttonText: (data.buttonText ?? DEFAULT_CTA.buttonText).slice(
      0,
      CTA_BUTTON_MAX_LENGTH
    ),
    buttonHref: data.buttonHref || "#",
  };
}

/** Serializes CTA data to the exact banner markup the public site expects. */
export function buildCtaHtml(input: Partial<CtaData>): string {
  const { heading, paragraph, buttonText, buttonHref } = normalizeCta(input);

  const action =
    `<div style="${CTA_STYLES.buttonGroup}">` +
    `<a href="${escapeAttr(buttonHref)}" style="${CTA_STYLES.buttonLabel}">${escapeHtml(buttonText)}</a>` +
    `<a href="${escapeAttr(buttonHref)}" style="${CTA_STYLES.buttonArrow}">${ARROW_SVG}</a>` +
    `</div>`;

  return (
    `<div data-type="cta-banner" class="cta-banner not-prose"` +
    ` data-heading="${escapeAttr(heading)}"` +
    ` data-paragraph="${escapeAttr(paragraph)}"` +
    ` data-button-text="${escapeAttr(buttonText)}"` +
    ` data-button-href="${escapeAttr(buttonHref)}"` +
    ` data-cta-type="link"` +
    ` style="${CTA_STYLES.wrapper}">` +
    `<h2 style="${CTA_STYLES.heading}">${escapeHtml(heading)}</h2>` +
    `<p style="${CTA_STYLES.paragraph}">${escapeHtml(paragraph)}</p>` +
    action +
    `</div>`
  );
}

/** True when the element is a CTA banner produced by this editor or the old one. */
export function isCtaElement(el: Element): boolean {
  return (
    el.getAttribute("data-type") === "cta-banner" ||
    el.classList.contains("cta-banner")
  );
}

/**
 * Reads CTA data back out of rendered markup.
 *
 * Prefers the `data-*` attributes (always written by `buildCtaHtml`) and falls
 * back to reading the visible DOM, so a CTA that was hand-edited in the HTML
 * code view still imports cleanly.
 */
export function parseCtaElement(el: Element): CtaData {
  const attr = (name: string) => el.getAttribute(name) ?? undefined;

  const domHeading = el.querySelector("h2")?.textContent?.trim();
  const domParagraph = el.querySelector("p")?.textContent?.trim();
  // A legacy subscribe banner keeps its label on the submit <button>.
  const domButton = el.querySelector("a, button")?.textContent?.trim();
  const domHref = el.querySelector("a")?.getAttribute("href") ?? undefined;

  return normalizeCta({
    heading: attr("data-heading") ?? domHeading,
    paragraph: attr("data-paragraph") ?? domParagraph,
    buttonText: attr("data-button-text") ?? domButton,
    buttonHref: attr("data-button-href") ?? domHref,
  });
}
