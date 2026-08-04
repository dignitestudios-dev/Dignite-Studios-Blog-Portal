/**
 * CTA banner block tool.
 *
 * Renders a live, editable replica of the banner that ships on the public site:
 * heading, paragraph and button label are edited in place, while the link
 * target sits in a settings strip below the preview.
 *
 * Serialization lives in `cta.ts` so the editor preview and the saved HTML can
 * never drift apart.
 */
import type {
  BlockTool,
  BlockToolConstructorOptions,
  ToolboxConfig,
} from "@editorjs/editorjs";
import {
  CTA_BUTTON_MAX_LENGTH,
  CTA_STYLES,
  normalizeCta,
  type CtaData,
} from "./cta";

const ICON =
  '<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3.5h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 7.5h5M11 6.2h2.2v2.6H11z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

const STRIP_STYLE =
  "display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:-28px 0 40px;padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px";
const FIELD_STYLE =
  "flex:1;min-width:180px;padding:6px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;background:#fff;color:#111827;outline:none";
const LABEL_STYLE =
  "font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280";
const COUNTER_STYLE =
  "font-size:11px;font-weight:600;color:#9ca3af;white-space:nowrap";

export default class CtaTool implements BlockTool {
  static get toolbox(): ToolboxConfig {
    return { title: "CTA Banner", icon: ICON };
  }

  static get isReadOnlySupported(): boolean {
    return true;
  }

  /** Keep Editor.js from splitting the block when Enter is pressed inside it. */
  static get enableLineBreaks(): boolean {
    return true;
  }

  /** Every field is plain text — strip any markup that gets pasted in. */
  static get sanitize() {
    return {
      heading: false,
      paragraph: false,
      buttonText: false,
      buttonHref: false,
    };
  }

  private readOnly: boolean;
  private data: CtaData;

  private wrapper!: HTMLElement;
  private headingEl!: HTMLElement;
  private paragraphEl!: HTMLElement;
  private buttonTextEl!: HTMLElement;
  private hrefField!: HTMLInputElement;
  private counterEl!: HTMLElement;

  constructor({ data, readOnly }: BlockToolConstructorOptions<Partial<CtaData>>) {
    this.readOnly = readOnly ?? false;
    this.data = normalizeCta(data);
  }

  /** Trims a contenteditable back to `max` characters, keeping the caret sane. */
  private clampLength(el: HTMLElement, max: number) {
    const text = el.textContent ?? "";
    if (text.length <= max) return false;

    el.textContent = text.slice(0, max);

    // Put the caret at the end rather than letting it jump to position 0.
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  }

  private updateCounter() {
    if (!this.counterEl) return;
    const used = (this.buttonTextEl?.textContent ?? "").length;
    this.counterEl.textContent = `${used}/${CTA_BUTTON_MAX_LENGTH}`;
    this.counterEl.style.color =
      used >= CTA_BUTTON_MAX_LENGTH ? "#ef4444" : "#9ca3af";
  }

  /**
   * Editable text node styled to match its rendered counterpart.
   * `maxLength` caps input at the source, so an over-long label can never
   * reach the banner in the first place.
   */
  private editable(
    tag: string,
    style: string,
    value: string,
    multiline: boolean,
    maxLength?: number
  ) {
    const el = document.createElement(tag);
    el.setAttribute("style", style);
    el.textContent = value;

    if (this.readOnly) return el;

    el.contentEditable = "true";
    el.spellcheck = true;

    // Editor.js binds global shortcuts; keep them out of these fields.
    el.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Enter") event.preventDefault();

      if (maxLength && (el.textContent ?? "").length >= maxLength) {
        const isEditingKey =
          event.key.length === 1 && !event.ctrlKey && !event.metaKey;
        const hasSelection = !window.getSelection()?.isCollapsed;
        if (isEditingKey && !hasSelection) event.preventDefault();
      }
    });

    el.addEventListener("input", () => {
      if (maxLength) this.clampLength(el, maxLength);
      this.updateCounter();
    });

    // Paste as plain text so the banner can never inherit foreign markup.
    el.addEventListener("paste", (event: ClipboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const pasted = (event.clipboardData?.getData("text/plain") ?? "").replace(
        /\s*\n\s*/g,
        " "
      );
      let text = pasted;
      if (maxLength) {
        const room = maxLength - (el.textContent ?? "").length;
        text = room > 0 ? pasted.slice(0, room) : "";
      }
      if (text) document.execCommand("insertText", false, text);
      this.updateCounter();
    });

    return el;
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("cta-tool");

    // ── Live preview ──────────────────────────────────────────────────────
    const banner = document.createElement("div");
    banner.setAttribute("style", CTA_STYLES.wrapper);

    this.headingEl = this.editable("h2", CTA_STYLES.heading, this.data.heading, false);
    this.paragraphEl = this.editable(
      "p",
      CTA_STYLES.paragraph,
      this.data.paragraph,
      true
    );

    const group = document.createElement("div");
    group.setAttribute("style", CTA_STYLES.buttonGroup);

    this.buttonTextEl = this.editable(
      "span",
      CTA_STYLES.buttonLabel,
      this.data.buttonText,
      false,
      CTA_BUTTON_MAX_LENGTH
    );

    const arrow = document.createElement("span");
    arrow.setAttribute("style", CTA_STYLES.buttonArrow);
    arrow.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';

    group.append(this.buttonTextEl, arrow);
    banner.append(this.headingEl, this.paragraphEl, group);

    // ── Settings strip ────────────────────────────────────────────────────
    const strip = document.createElement("div");
    strip.setAttribute("style", STRIP_STYLE);

    const hrefRow = document.createElement("label");
    hrefRow.setAttribute(
      "style",
      "display:flex;align-items:center;gap:8px;flex:1;min-width:240px"
    );

    const hrefLabel = document.createElement("span");
    hrefLabel.setAttribute("style", LABEL_STYLE);
    hrefLabel.textContent = "Button URL";

    this.hrefField = document.createElement("input");
    this.hrefField.type = "text";
    this.hrefField.value = this.data.buttonHref;
    this.hrefField.placeholder = "https://…";
    this.hrefField.disabled = this.readOnly;
    this.hrefField.setAttribute("style", FIELD_STYLE);
    this.hrefField.addEventListener("keydown", (e) => e.stopPropagation());
    this.hrefField.addEventListener("focus", () => {
      this.hrefField.style.borderColor = "#F15C20";
    });
    this.hrefField.addEventListener("blur", () => {
      this.hrefField.style.borderColor = "#e5e7eb";
    });

    hrefRow.append(hrefLabel, this.hrefField);

    this.counterEl = document.createElement("span");
    this.counterEl.setAttribute("style", COUNTER_STYLE);
    this.counterEl.title = `Button label limit: ${CTA_BUTTON_MAX_LENGTH} characters`;

    strip.append(hrefRow, this.counterEl);
    this.updateCounter();

    this.wrapper.append(banner, strip);
    return this.wrapper;
  }

  save(): CtaData {
    const text = (el?: HTMLElement) => (el?.textContent ?? "").trim();

    return normalizeCta({
      heading: text(this.headingEl),
      paragraph: text(this.paragraphEl),
      buttonText: text(this.buttonTextEl),
      buttonHref: this.hrefField?.value.trim() || "#",
    });
  }

  /** A CTA with no heading and no button label is treated as empty. */
  validate(data: CtaData): boolean {
    return !!(data.heading?.trim() || data.buttonText?.trim());
  }
}
