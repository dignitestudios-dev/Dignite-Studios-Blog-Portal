/**
 * Inline link tool with target / rel controls.
 *
 * Replaces Editor.js's built-in link inline tool, which can only set `href`.
 * This one exposes:
 *   - the URL
 *   - "open in new tab"  -> `target="_blank"` (+ `noopener noreferrer`)
 *   - "nofollow"         -> `rel="nofollow"`
 *
 * `noopener noreferrer` is attached automatically whenever a link opens in a new
 * tab — it is a security requirement, not an editorial choice, so it is not a
 * separate toggle.
 *
 * The panel is deliberately NOT returned from `renderActions()`. Editor.js lays
 * the inline toolbar out as a fixed 38px-tall horizontal flex row with
 * `overflow:hidden`, so anything taller than one row gets clipped and gains a
 * scrollbar. Instead the panel is attached to <body> and positioned against the
 * current selection, which keeps it fully visible at its natural size.
 */
import type { API, InlineTool } from "@editorjs/editorjs";

/**
 * The link glyph from Editor.js's own icon set (`@codexteam/icons`), inlined so
 * it renders at exactly the same size and weight as the bold/italic buttons
 * beside it.
 */
const ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M7.69998 12.6L7.67896 12.62C6.53993 13.7048 6.52012 15.5155 7.63516 16.625V16.625C8.72293 17.7073 10.4799 17.7102 11.5712 16.6314L13.0263 15.193C14.0703 14.1609 14.2141 12.525 13.3662 11.3266L13.22 11.12"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16.22 11.12L16.3564 10.9805C17.2895 10.0265 17.3478 8.5207 16.4914 7.49733V7.49733C15.5691 6.39509 13.9269 6.25143 12.8271 7.17675L11.3901 8.38588C10.0935 9.47674 9.95706 11.4241 11.0888 12.6852L11.12 12.72"/></svg>';

const PANEL_WIDTH = 320;
const PANEL_GAP = 10;
const VIEWPORT_MARGIN = 12;

/** Adds a scheme to bare domains; leaves anchors, paths and mailto/tel alone. */
function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(value)) return value;
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(value)) return `mailto:${value}`;
  return `https://${value}`;
}

export default class LinkTool implements InlineTool {
  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return "Link";
  }

  static get shortcut(): string {
    return "CMD+K";
  }

  /** Whitelists the attributes this tool writes so Editor.js keeps them on save. */
  static get sanitize() {
    return { a: { href: true, target: true, rel: true } };
  }

  private api: API;
  private button!: HTMLButtonElement;

  private panel: HTMLElement | null = null;
  private urlInput!: HTMLInputElement;
  private newTabInput!: HTMLInputElement;
  private nofollowInput!: HTMLInputElement;
  private removeButton!: HTMLButtonElement;

  /** Selection captured when the tool was opened, restored on apply. */
  private savedRange: Range | null = null;
  /** The anchor being edited, when the caret sits inside one. */
  private currentAnchor: HTMLAnchorElement | null = null;
  private open = false;

  private onDocumentPointerDown = (event: MouseEvent) => {
    if (!this.open || !this.panel) return;
    if (this.panel.contains(event.target as Node)) return;
    this.closePanel();
  };

  private onWindowChange = () => {
    if (this.open) this.position();
  };

  constructor({ api }: { api: API }) {
    this.api = api;
  }

  render(): HTMLElement {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.innerHTML = ICON;
    return this.button;
  }

  // ── Panel construction ────────────────────────────────────────────────────

  private buildPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "ds-link-panel";
    panel.setAttribute(
      "style",
      [
        "position:fixed",
        "z-index:2147483000",
        `width:${PANEL_WIDTH}px`,
        "box-sizing:border-box",
        "display:flex",
        "flex-direction:column",
        "gap:10px",
        "padding:12px",
        "background:#fff",
        "border:1px solid #e5e7eb",
        "border-radius:10px",
        "box-shadow:0 8px 28px -6px rgba(16,24,40,0.22)",
        "font-family:inherit",
      ].join(";")
    );

    this.urlInput = document.createElement("input");
    this.urlInput.type = "text";
    this.urlInput.placeholder = "Paste or type a URL";
    this.urlInput.setAttribute(
      "style",
      "width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;outline:none;color:#111827;background:#fff"
    );
    this.urlInput.addEventListener("focus", () => {
      this.urlInput.style.borderColor = "#F15C20";
      this.urlInput.style.boxShadow = "0 0 0 1px #F15C20";
    });
    this.urlInput.addEventListener("blur", () => {
      this.urlInput.style.borderColor = "#e5e7eb";
      this.urlInput.style.boxShadow = "none";
    });

    const checks = document.createElement("div");
    checks.setAttribute("style", "display:flex;gap:16px;flex-wrap:wrap");

    const newTab = this.checkbox("Open in new tab");
    this.newTabInput = newTab.input;
    const nofollow = this.checkbox("Nofollow");
    this.nofollowInput = nofollow.input;
    checks.append(newTab.row, nofollow.row);

    const buttons = document.createElement("div");
    buttons.setAttribute("style", "display:flex;gap:8px");

    const apply = document.createElement("button");
    apply.type = "button";
    apply.textContent = "Apply";
    apply.setAttribute(
      "style",
      "flex:1;padding:8px 10px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;background:#F15C20;color:#fff"
    );
    apply.addEventListener("click", () => this.applyLink());

    this.removeButton = document.createElement("button");
    this.removeButton.type = "button";
    this.removeButton.textContent = "Remove";
    this.removeButton.setAttribute(
      "style",
      "padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;color:#6b7280"
    );
    this.removeButton.addEventListener("click", () => this.removeLink());

    buttons.append(apply, this.removeButton);

    // Keep Editor.js keyboard handling out of the panel.
    panel.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        this.applyLink();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        this.closePanel();
      }
    });
    // Stop clicks from collapsing the editor selection.
    panel.addEventListener("mousedown", (event) => event.stopPropagation());

    panel.append(this.urlInput, checks, buttons);
    return panel;
  }

  private checkbox(labelText: string) {
    const row = document.createElement("label");
    row.setAttribute(
      "style",
      "display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;cursor:pointer;user-select:none;white-space:nowrap"
    );

    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("style", "accent-color:#F15C20;margin:0");

    const span = document.createElement("span");
    span.textContent = labelText;

    row.append(input, span);
    return { row, input };
  }

  /** Anchors the panel under the selection, clamped inside the viewport. */
  private position() {
    if (!this.panel) return;

    let rect: DOMRect | null = null;

    if (this.currentAnchor) {
      rect = this.currentAnchor.getBoundingClientRect();
    } else if (this.savedRange) {
      const r = this.savedRange.getBoundingClientRect();
      if (r.width || r.height) rect = r;
    }

    if (!rect) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        rect = selection.getRangeAt(0).getBoundingClientRect();
      }
    }

    const panelHeight = this.panel.offsetHeight || 150;
    const anchorTop = rect?.top ?? window.innerHeight / 2;
    const anchorBottom = rect?.bottom ?? window.innerHeight / 2;
    const anchorLeft = rect?.left ?? window.innerWidth / 2;

    // Prefer below the selection; flip above when there is not enough room.
    const roomBelow = window.innerHeight - anchorBottom;
    const top =
      roomBelow >= panelHeight + PANEL_GAP + VIEWPORT_MARGIN
        ? anchorBottom + PANEL_GAP
        : Math.max(VIEWPORT_MARGIN, anchorTop - panelHeight - PANEL_GAP);

    const maxLeft = window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN;
    const left = Math.min(Math.max(VIEWPORT_MARGIN, anchorLeft), Math.max(VIEWPORT_MARGIN, maxLeft));

    this.panel.style.top = `${Math.round(top)}px`;
    this.panel.style.left = `${Math.round(left)}px`;
  }

  // ── Open / close ──────────────────────────────────────────────────────────

  private openPanel() {
    if (!this.panel) {
      this.panel = this.buildPanel();
      document.body.appendChild(this.panel);
    }

    if (this.currentAnchor) {
      this.fillFromAnchor(this.currentAnchor);
      this.removeButton.style.display = "";
    } else {
      this.urlInput.value = "";
      this.newTabInput.checked = false;
      this.nofollowInput.checked = false;
      this.removeButton.style.display = "none";
    }

    this.panel.style.display = "flex";
    this.open = true;
    this.position();

    document.addEventListener("mousedown", this.onDocumentPointerDown, true);
    window.addEventListener("scroll", this.onWindowChange, true);
    window.addEventListener("resize", this.onWindowChange);

    requestAnimationFrame(() => {
      this.position();
      this.urlInput.focus();
      this.urlInput.select();
    });
  }

  private closePanel() {
    if (this.panel) this.panel.style.display = "none";
    this.open = false;
    document.removeEventListener("mousedown", this.onDocumentPointerDown, true);
    window.removeEventListener("scroll", this.onWindowChange, true);
    window.removeEventListener("resize", this.onWindowChange);
  }

  // ── Editor.js inline-tool hooks ───────────────────────────────────────────

  /**
   * Called when the tool button is clicked. Opens the panel rather than
   * applying immediately, so the target/rel options can be set in one pass.
   */
  surround(range: Range): void {
    if (!range) return;

    this.currentAnchor = this.findAnchor();
    this.savedRange = this.currentAnchor ? null : range.cloneRange();

    this.openPanel();
  }

  /**
   * Runs whenever the selection changes while the toolbar is open. Used to
   * light up the button when the caret sits inside an existing link.
   */
  checkState(): boolean {
    const anchor = this.findAnchor();
    this.currentAnchor = anchor;

    if (anchor) {
      this.button?.classList.add(this.api.styles.inlineToolButtonActive);
      if (this.open) this.fillFromAnchor(anchor);
      return true;
    }

    this.button?.classList.remove(this.api.styles.inlineToolButtonActive);
    return false;
  }

  /** Called by Editor.js when the inline toolbar closes. */
  clear(): void {
    // The panel outlives the toolbar on purpose: Editor.js closes the toolbar
    // as soon as focus moves into the panel's URL field.
    if (!this.open) {
      this.savedRange = null;
      this.currentAnchor = null;
    }
  }

  private findAnchor(): HTMLAnchorElement | null {
    return (this.api.selection.findParentTag("A") as HTMLAnchorElement) ?? null;
  }

  private fillFromAnchor(anchor: HTMLAnchorElement) {
    const rel = (anchor.getAttribute("rel") ?? "").toLowerCase();
    this.urlInput.value = anchor.getAttribute("href") ?? "";
    this.newTabInput.checked = anchor.getAttribute("target") === "_blank";
    this.nofollowInput.checked = rel.includes("nofollow");
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  private buildRel(): string {
    const rel: string[] = [];
    if (this.nofollowInput.checked) rel.push("nofollow");
    if (this.newTabInput.checked) rel.push("noopener", "noreferrer");
    return rel.join(" ");
  }

  private applyAttributes(anchor: HTMLAnchorElement, href: string) {
    anchor.setAttribute("href", href);

    if (this.newTabInput.checked) {
      anchor.setAttribute("target", "_blank");
    } else {
      anchor.removeAttribute("target");
    }

    const rel = this.buildRel();
    if (rel) {
      anchor.setAttribute("rel", rel);
    } else {
      anchor.removeAttribute("rel");
    }
  }

  private applyLink() {
    const href = normalizeUrl(this.urlInput.value);
    if (!href) {
      this.urlInput.focus();
      return;
    }

    if (this.currentAnchor) {
      this.applyAttributes(this.currentAnchor, href);
      this.finish();
      return;
    }

    if (!this.savedRange) {
      this.finish();
      return;
    }

    const anchor = document.createElement("a");
    const contents = this.savedRange.extractContents();

    // Drop any nested anchors — nested <a> is invalid HTML.
    contents.querySelectorAll?.("a").forEach((nested) => {
      nested.replaceWith(...Array.from(nested.childNodes));
    });

    anchor.appendChild(contents);

    // Selecting only whitespace (or nothing) would create an unclickable link.
    if (!anchor.textContent?.trim()) {
      anchor.textContent = href;
    }

    this.applyAttributes(anchor, href);
    this.savedRange.insertNode(anchor);

    // Put the caret after the new link so typing continues outside it.
    const after = document.createRange();
    after.setStartAfter(anchor);
    after.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(after);

    this.finish();
  }

  private removeLink() {
    const anchor = this.currentAnchor ?? this.findAnchor();
    if (anchor) anchor.replaceWith(...Array.from(anchor.childNodes));
    this.finish();
  }

  private finish() {
    this.closePanel();
    this.savedRange = null;
    this.currentAnchor = null;
    this.api.inlineToolbar.close();
  }

  /** Editor.js calls this when the editor is destroyed. */
  destroy(): void {
    this.closePanel();
    this.panel?.remove();
    this.panel = null;
  }
}
