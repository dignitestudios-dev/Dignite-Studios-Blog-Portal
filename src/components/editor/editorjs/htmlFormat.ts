/**
 * Validation and pretty-printing for the raw-HTML view.
 *
 * The browser cannot be used as the validator: assigning to `innerHTML` silently
 * repairs unclosed tags and drops stray closing ones, so every input "parses".
 * The check below is a plain tag-balance walk over the source, which is what
 * actually catches the mistakes people make when hand-editing — a missing
 * `</div>`, a `</p>` that closes nothing, a typo'd tag name.
 */

/** Elements that never have a closing tag. */
const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** Elements rendered on their own line, with their children indented. */
const BLOCK_TAGS = new Set([
  "address", "article", "aside", "blockquote", "div", "dl", "dd", "dt",
  "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3",
  "h4", "h5", "h6", "header", "hr", "li", "main", "nav", "ol", "p", "pre",
  "section", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
]);

/** Content inside these is preserved byte for byte. */
const PRESERVE_TAGS = new Set(["pre", "textarea", "code", "script", "style"]);

export interface HtmlValidation {
  ok: boolean;
  /** Message suitable for showing directly to the user. */
  message?: string;
  /** 1-based line the problem starts on, when it can be pinned down. */
  line?: number;
}

interface Token {
  kind: "open" | "close" | "selfclose" | "text" | "comment";
  name: string;
  raw: string;
  line: number;
}

/** Splits the source into tags, comments and text runs. */
function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

  let cursor = 0;
  let match: RegExpExecArray | null;

  const lineAt = (index: number) => html.slice(0, index).split("\n").length;

  while ((match = pattern.exec(html)) !== null) {
    if (match.index > cursor) {
      tokens.push({
        kind: "text",
        name: "",
        raw: html.slice(cursor, match.index),
        line: lineAt(cursor),
      });
    }

    const line = lineAt(match.index);
    if (match[0].startsWith("<!--")) {
      tokens.push({ kind: "comment", name: "", raw: match[0], line });
    } else if (match[1]) {
      tokens.push({ kind: "close", name: match[1].toLowerCase(), raw: match[0], line });
    } else {
      const name = (match[2] ?? "").toLowerCase();
      const selfClosed = match[4] === "/" || VOID_TAGS.has(name);
      tokens.push({
        kind: selfClosed ? "selfclose" : "open",
        name,
        raw: match[0],
        line,
      });
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < html.length) {
    tokens.push({ kind: "text", name: "", raw: html.slice(cursor), line: lineAt(cursor) });
  }

  return tokens;
}

/**
 * Checks that every tag is closed, in order.
 *
 * Deliberately strict about ordering: `<b><i></b></i>` parses in a browser but
 * is a mistake, and the editor's importer will not round-trip it faithfully.
 */
export function validateHtml(html: string): HtmlValidation {
  if (!html.trim()) return { ok: true };

  // An unterminated "<tag" never matches the tokenizer, so catch it up front.
  const stray = html.match(/<[a-zA-Z][^<>]*$/);
  if (stray) {
    return {
      ok: false,
      message: "Unterminated tag — a '<' is missing its closing '>'.",
      line: html.slice(0, html.length - stray[0].length).split("\n").length,
    };
  }

  const stack: Token[] = [];

  for (const token of tokenize(html)) {
    if (token.kind === "open") {
      stack.push(token);
      continue;
    }
    if (token.kind !== "close") continue;

    if (VOID_TAGS.has(token.name)) {
      return {
        ok: false,
        message: `<${token.name}> never has a closing tag — remove </${token.name}>.`,
        line: token.line,
      };
    }

    const open = stack.pop();
    if (!open) {
      return {
        ok: false,
        message: `</${token.name}> closes a tag that was never opened.`,
        line: token.line,
      };
    }
    if (open.name !== token.name) {
      return {
        ok: false,
        message: `</${token.name}> does not match the open <${open.name}> — tags are crossed or one is unclosed.`,
        line: token.line,
      };
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    return {
      ok: false,
      message: `<${unclosed.name}> is never closed.`,
      line: unclosed.line,
    };
  }

  return { ok: true };
}

/**
 * Re-indents HTML the way an editor's "format document" would: one block
 * element per line, two-space indent per level, inline runs left alone.
 *
 * Only whitespace between tags is touched, so formatting never changes what
 * the page renders.
 */
interface ElementNode {
  type: "element";
  name: string;
  open: string;
  close: string;
  children: Node[];
  /** True for <pre>/<code>: children are re-emitted exactly as written. */
  verbatim: boolean;
}
interface RawNode {
  type: "raw";
  text: string;
}
type Node = ElementNode | RawNode;

/**
 * Builds a shallow tree. Tolerant on purpose: a stray or crossed tag is kept as
 * raw text rather than throwing, because Format has to do something sensible
 * even on markup that Apply would reject.
 */
function parse(tokens: Token[]): Node[] {
  const root: Node[] = [];
  const stack: ElementNode[] = [];
  const push = (node: Node) => {
    (stack.length ? stack[stack.length - 1].children : root).push(node);
  };

  for (const token of tokens) {
    const top = stack[stack.length - 1];

    if (top?.verbatim) {
      if (token.kind === "close" && token.name === top.name) {
        stack.pop();
      } else {
        top.children.push({ type: "raw", text: token.raw });
      }
      continue;
    }

    switch (token.kind) {
      case "open": {
        const node: ElementNode = {
          type: "element",
          name: token.name,
          open: token.raw,
          close: `</${token.name}>`,
          children: [],
          verbatim: PRESERVE_TAGS.has(token.name),
        };
        push(node);
        stack.push(node);
        break;
      }
      case "close": {
        const index = stack.map((n) => n.name).lastIndexOf(token.name);
        if (index === -1) {
          push({ type: "raw", text: token.raw });
        } else {
          stack.length = index;
        }
        break;
      }
      default:
        push({ type: "raw", text: token.raw });
    }
  }

  return root;
}

const isElement = (n: Node): n is ElementNode => n.type === "element";

/** True when a node must start its own line. */
function isBlockNode(node: Node): boolean {
  return isElement(node) && (BLOCK_TAGS.has(node.name) || node.verbatim);
}

/** Serializes a subtree onto a single line, collapsing insignificant space. */
function inline(nodes: Node[]): string {
  return nodes
    .map((node) => {
      if (!isElement(node)) return node.text.replace(/\s+/g, " ");
      if (node.verbatim) return node.open + inlineVerbatim(node.children) + node.close;
      return node.open + inline(node.children) + node.close;
    })
    .join("");
}

function inlineVerbatim(nodes: Node[]): string {
  return nodes.map((n) => (isElement(n) ? n.open + inlineVerbatim(n.children) + n.close : n.text)).join("");
}

function render(nodes: Node[], depth: number, indent: string, out: string[]): void {
  const pad = indent.repeat(depth);
  let pending: Node[] = [];

  const flush = () => {
    if (pending.length === 0) return;
    const text = inline(pending).trim();
    if (text) out.push(pad + text);
    pending = [];
  };

  for (const node of nodes) {
    if (!isBlockNode(node)) {
      pending.push(node);
      continue;
    }

    flush();
    const element = node as ElementNode;

    if (element.verbatim) {
      // Content is copied byte for byte — whitespace inside <pre> is rendered.
      out.push(pad + element.open + inlineVerbatim(element.children) + element.close);
      continue;
    }

    // A leaf block (no block children) stays on one line, the way an editor's
    // "format document" leaves <li>a</li> alone instead of exploding it.
    if (!element.children.some(isBlockNode)) {
      out.push(pad + element.open + inline(element.children).trim() + element.close);
      continue;
    }

    out.push(pad + element.open);
    render(element.children, depth + 1, indent, out);
    out.push(pad + element.close);
  }

  flush();
}

export function formatHtml(html: string, indent = "  "): string {
  if (!html.trim()) return "";
  const out: string[] = [];
  render(parse(tokenize(html)), 0, indent, out);
  return out.join("\n");
}
