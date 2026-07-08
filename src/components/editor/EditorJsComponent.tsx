"use client";

import React, { useEffect, useRef, useState } from "react";
import EditorJS, { OutputData, BlockTool, BlockToolData, API } from "@editorjs/editorjs";
// @ts-ignore
import Header from "@editorjs/header";
// @ts-ignore
import List from "@editorjs/list";
// @ts-ignore
import Quote from "@editorjs/quote";
// @ts-ignore
import CodeTool from "@editorjs/code";
// @ts-ignore
import InlineCode from "@editorjs/inline-code";
// @ts-ignore
import Embed from "@editorjs/embed";
// @ts-ignore
import Marker from "@editorjs/marker";
// @ts-ignore
import Delimiter from "@editorjs/delimiter";
// @ts-ignore
import Table from "@editorjs/table";
// @ts-ignore
import Hyperlink from "editorjs-hyperlink";
// @ts-ignore
import editorjsHtml from "editorjs-html";

// ─── CTA Banner Block Tool ──────────────────────────────────────────────────
interface CtaBannerData extends BlockToolData {
  heading: string;
  paragraph: string;
  buttonText: string;
  buttonHref: string;
}

class CtaBannerTool implements BlockTool {
  private api: API;
  private data: CtaBannerData;
  private wrapper: HTMLElement;

  constructor({ data, api }: { data: CtaBannerData; api: API }) {
    this.api = api;
    this.data = data && Object.keys(data).length > 0 ? data : {
      heading: "Get Clear On Your Next Move",
      paragraph: "Choosing the right enterprise mobile app development services can define your project’s success. Let our experts help you plan, design and build a solution which truly meets the business needs.",
      buttonText: "Get Started Today",
      buttonHref: "#"
    };
    this.wrapper = document.createElement('div');
  }

  static get toolbox() {
    return {
      title: 'CTA Banner',
      icon: `<svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor"/><path d="M4 5H13M4 8H9" stroke="currentColor" stroke-linecap="round"/><rect x="4" y="11" width="5" height="2" rx="0.5" fill="currentColor"/></svg>`
    };
  }

  render(): HTMLElement {
    this.wrapper.className = "cta-banner-editor my-6 p-8 text-center text-white bg-[#F15C20] rounded-[20px] font-sans relative group";
    
    const headingDiv = document.createElement('h2');
    headingDiv.contentEditable = 'true';
    headingDiv.className = "text-2xl md:text-3xl font-bold mb-4 outline-none border-b border-transparent focus:border-white/40 pb-1 px-2 inline-block max-w-full";
    headingDiv.innerText = this.data.heading;
    headingDiv.addEventListener('input', () => {
      this.data.heading = headingDiv.innerText;
    });

    const paragraphDiv = document.createElement('p');
    paragraphDiv.contentEditable = 'true';
    paragraphDiv.className = "text-sm md:text-base text-white/90 mb-6 leading-relaxed outline-none border-b border-transparent focus:border-white/40 pb-1 px-2";
    paragraphDiv.innerText = this.data.paragraph;
    paragraphDiv.addEventListener('input', () => {
      this.data.paragraph = paragraphDiv.innerText;
    });

    // Button container
    const btnContainer = document.createElement('div');
    btnContainer.className = "inline-flex items-center gap-0";

    const buttonSpan = document.createElement('span');
    buttonSpan.contentEditable = 'true';
    buttonSpan.className = "inline-flex items-center justify-center bg-white text-[#F15C20] text-sm font-semibold px-8 rounded-l-full outline-none min-w-[160px] h-[52px]";
    buttonSpan.innerText = this.data.buttonText;
    buttonSpan.addEventListener('input', () => {
      this.data.buttonText = buttonSpan.innerText;
    });

    const iconSpan = document.createElement('span');
    iconSpan.className = "inline-flex items-center justify-center bg-white text-[#F15C20] w-[52px] h-[52px] rounded-r-full flex-shrink-0 border-l border-[#F15C20]/10";
    iconSpan.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>`;

    btnContainer.appendChild(buttonSpan);
    btnContainer.appendChild(iconSpan);

    // URL input container
    const urlContainer = document.createElement('div');
    urlContainer.className = "mt-4 flex items-center justify-center gap-2 text-xs text-white/70";
    
    const urlLabel = document.createElement('span');
    urlLabel.innerText = "Button URL:";
    
    const urlInput = document.createElement('input');
    urlInput.type = "url";
    urlInput.value = this.data.buttonHref;
    urlInput.className = "bg-white/15 border border-white/30 rounded px-2 py-1 text-xs text-white outline-none focus:border-white/80 w-[220px]";
    urlInput.placeholder = "https://example.com";
    urlInput.addEventListener('input', () => {
      this.data.buttonHref = urlInput.value;
    });

    urlContainer.appendChild(urlLabel);
    urlContainer.appendChild(urlInput);

    this.wrapper.appendChild(headingDiv);
    this.wrapper.appendChild(paragraphDiv);
    this.wrapper.appendChild(btnContainer);
    this.wrapper.appendChild(urlContainer);

    return this.wrapper;
  }

  save(): CtaBannerData {
    return this.data;
  }
}

// ─── Custom Image Block Tool ────────────────────────────────────────────────
interface CustomImageData extends BlockToolData {
  url: string;
  alt: string;
  align: 'left' | 'center' | 'right';
  width: string;
}

class CustomImageTool implements BlockTool {
  private api: API;
  private data: CustomImageData;
  private wrapper: HTMLElement;
  private isUploading: boolean = false;

  constructor({ data, api }: { data: CustomImageData; api: API }) {
    this.api = api;
    this.data = data && Object.keys(data).length > 0 ? data : {
      url: "",
      alt: "",
      align: "center",
      width: "100%"
    };
    this.wrapper = document.createElement('div');
  }

  static get toolbox() {
    return {
      title: 'Image (Custom)',
      icon: `<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor"/><circle cx="5" cy="5" r="2" fill="currentColor"/><path d="M2 13 L8 7 L12 11 L15 8 L16.5 9.5" stroke="currentColor" stroke-linecap="round" fill="none"/></svg>`
    };
  }

  render(): HTMLElement {
    this.wrapper.innerHTML = "";
    this.wrapper.className = "custom-image-block my-4 relative group";

    if (!this.data.url) {
      this.renderUploadInterface();
    } else {
      this.renderImageInterface();
    }

    return this.wrapper;
  }

  private renderUploadInterface() {
    const uploadBtn = document.createElement('button');
    uploadBtn.type = "button";
    uploadBtn.className = "w-full py-12 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors";
    
    if (this.isUploading) {
      uploadBtn.innerHTML = `<span class="animate-spin text-[#F15C20]"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></span><span class="text-sm text-gray-500 font-medium">Uploading image...</span>`;
      uploadBtn.disabled = true;
    } else {
      uploadBtn.innerHTML = `<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z"></path></svg><span class="text-sm text-gray-500 font-medium">Click to upload image</span>`;
      
      const fileInput = document.createElement('input');
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.className = "hidden";
      fileInput.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          await this.uploadFile(file);
        }
      });

      uploadBtn.addEventListener('click', () => {
        fileInput.click();
      });
      uploadBtn.appendChild(fileInput);
    }

    this.wrapper.appendChild(uploadBtn);
  }

  private async uploadFile(file: File) {
    this.isUploading = true;
    this.render();

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        this.data.url = data.url;
        this.data.alt = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      } else {
        console.error("Failed to upload image");
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isUploading = false;
      this.render();
    }
  }

  private renderImageInterface() {
    const imgContainer = document.createElement('div');
    imgContainer.className = "relative inline-block max-w-full";
    imgContainer.style.width = this.data.width;

    if (this.data.align === 'center') {
      this.wrapper.className = "custom-image-block my-4 relative group text-center";
    } else if (this.data.align === 'right') {
      this.wrapper.className = "custom-image-block my-4 relative group text-right";
    } else {
      this.wrapper.className = "custom-image-block my-4 relative group text-left";
    }

    const img = document.createElement('img');
    img.src = this.data.url;
    img.alt = this.data.alt;
    img.className = "rounded-lg max-w-full block h-auto border border-gray-100 shadow-sm mx-auto";
    imgContainer.appendChild(img);

    // Float Controls (Toolbar)
    const controls = document.createElement('div');
    controls.className = "absolute top-2 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm rounded-lg p-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xl border border-white/10";
    
    // Align controls
    const alignments: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
    alignments.forEach(align => {
      const btn = document.createElement('button');
      btn.type = "button";
      btn.className = `p-1 rounded text-white hover:bg-gray-800 transition-colors ${this.data.align === align ? 'bg-[#F15C20]' : ''}`;
      btn.innerHTML = align === 'left' 
        ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"></path></svg>`
        : align === 'center'
        ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path></svg>`
        : `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-9 5.25h9.5"></path></svg>`;
      
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.data.align = align;
        this.render();
      });
      controls.appendChild(btn);
    });

    const divider = document.createElement('div');
    divider.className = "w-px h-4 bg-gray-700 mx-1";
    controls.appendChild(divider);

    // Width controls
    const widths = ['25%', '50%', '75%', '100%'];
    widths.forEach(w => {
      const btn = document.createElement('button');
      btn.type = "button";
      btn.className = `text-xs px-2 py-0.5 rounded text-white hover:bg-gray-800 transition-colors font-medium ${this.data.width === w ? 'bg-[#F15C20]' : ''}`;
      btn.innerText = w;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.data.width = w;
        this.render();
      });
      controls.appendChild(btn);
    });

    imgContainer.appendChild(controls);

    // Alt input container
    const altContainer = document.createElement('div');
    altContainer.className = "mt-2 opacity-0 group-hover:opacity-100 transition-opacity max-w-md mx-auto";
    
    const altInput = document.createElement('input');
    altInput.type = "text";
    altInput.value = this.data.alt;
    altInput.className = "w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white/95 focus:outline-none focus:border-[#F15C20] focus:ring-1 focus:ring-[#F15C20] placeholder-gray-400 text-gray-700 shadow-sm text-center";
    altInput.placeholder = "Enter alt text for image...";
    altInput.addEventListener('input', () => {
      this.data.alt = altInput.value;
    });
    
    altContainer.appendChild(altInput);
    imgContainer.appendChild(altContainer);

    this.wrapper.appendChild(imgContainer);
  }

  save(): CustomImageData {
    return this.data;
  }
}

// ─── Tiptap to EditorJS Converter ───────────────────────────────────────────
function convertTiptapToEditorJs(tiptap: any): any {
  if (!tiptap || typeof tiptap !== "object") return { blocks: [] };
  if (Array.isArray(tiptap.blocks)) return tiptap; // Already in Editor.js format
  
  const blocks: any[] = [];
  
  const parseNodes = (nodes: any[]) => {
    if (!nodes) return;
    for (const node of nodes) {
      if (node.type === "paragraph") {
        blocks.push({
          type: "paragraph",
          data: {
            text: parseInline(node.content)
          }
        });
      } else if (node.type === "heading") {
        blocks.push({
          type: "header",
          data: {
            text: parseInline(node.content),
            level: node.attrs?.level || 2
          }
        });
      } else if (node.type === "bulletList") {
        blocks.push({
          type: "list",
          data: {
            style: "unordered",
            items: parseListItems(node.content)
          }
        });
      } else if (node.type === "orderedList") {
        blocks.push({
          type: "list",
          data: {
            style: "ordered",
            items: parseListItems(node.content)
          }
        });
      } else if (node.type === "blockquote") {
        blocks.push({
          type: "quote",
          data: {
            text: parseInline(node.content),
            caption: "",
            alignment: "left"
          }
        });
      } else if (node.type === "codeBlock") {
        blocks.push({
          type: "code",
          data: {
            code: parseInline(node.content)
          }
        });
      } else if (node.type === "image") {
        blocks.push({
          type: "image",
          data: {
            url: node.attrs?.src || "",
            alt: node.attrs?.alt || "",
            align: node.attrs?.align || "center",
            width: node.attrs?.width || "100%"
          }
        });
      } else if (node.type === "ctaBanner") {
        blocks.push({
          type: "ctaBanner",
          data: {
            heading: node.attrs?.heading || "",
            paragraph: node.attrs?.paragraph || "",
            buttonText: node.attrs?.buttonText || "",
            buttonHref: node.attrs?.buttonHref || ""
          }
        });
      } else if (node.type === "table") {
        const contentMatrix = (node.content || []).map((row: any) => {
          return (row.content || []).map((cell: any) => parseInline(cell.content));
        });
        blocks.push({
          type: "table",
          data: {
            content: contentMatrix
          }
        });
      }
    }
  };

  const parseInline = (inlineNodes: any[]): string => {
    if (!inlineNodes) return "";
    return inlineNodes.map(node => {
      let text = node.text || "";
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "bold") text = `<b>${text}</b>`;
          if (mark.type === "italic") text = `<i>${text}</i>`;
          if (mark.type === "underline") text = `<u>${text}</u>`;
          if (mark.type === "strike") text = `<s>${text}</s>`;
          if (mark.type === "code") text = `<code>${text}</code>`;
          if (mark.type === "link") {
            const target = mark.attrs?.target === "_blank" ? ' target="_blank"' : "";
            const rel = mark.attrs?.rel ? ` rel="${mark.attrs.rel}"` : "";
            text = `<a href="${mark.attrs?.href || ""}"${target}${rel}>${text}</a>`;
          }
        }
      }
      return text;
    }).join("");
  };

  const parseListItems = (listItems: any[]): string[] => {
    if (!listItems) return [];
    return listItems.map(item => {
      if (item.content && item.content[0]) {
        return parseInline(item.content[0].content);
      }
      return "";
    });
  };

  parseNodes(tiptap.content);
  return { blocks };
}

// ─── HTML Parser configuration ──────────────────────────────────────────────
const edjsParser = editorjsHtml({
  ctaBanner: (block: any) => {
    const { heading, paragraph, buttonText, buttonHref } = block.data;
    return `
      <div data-type="cta-banner" class="cta-banner not-prose" data-heading="${heading}" data-paragraph="${paragraph}" data-button-text="${buttonText}" data-button-href="${buttonHref}" data-cta-type="link" style="border-radius:20px;background-color:#F15C20;padding:40px 6% 36px;text-align:center;font-family:Arial,sans-serif;box-sizing:border-box;width:100%;overflow:hidden;margin-top:40px;margin-bottom:40px">
        <h2 style="margin:0 0 14px;font-size:30px;font-weight:700;line-height:1.25;color:#ffffff;word-break:break-word;overflow-wrap:break-word;text-align:center">${heading}</h2>
        <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.92);line-height:1.5;word-break:break-word;overflow-wrap:break-word">${paragraph}</p>
        <div style="display:inline-flex;align-items:center;gap:0px">
          <a href="${buttonHref}" style="display:inline-flex;align-items:center;justify-content:center;background:#ffffff;color:#F15C20;text-decoration:none;font-size:14px;font-weight:600;padding:0 32px;border-radius:50px;white-space:nowrap;line-height:1;min-width:160px;height:52px;box-sizing:border-box">${buttonText}</a>
          <a href="${buttonHref}" style="display:inline-flex;align-items:center;justify-content:center;background:#ffffff;color:#F15C20;text-decoration:none;width:52px;height:52px;border-radius:50px;flex-shrink:0;box-sizing:border-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right-icon lucide-arrow-up-right"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>
          </a>
        </div>
      </div>
    `;
  },
  image: (block: any) => {
    const { url, alt, align, width } = block.data;
    const resolvedWidth = width || "100%";
    const resolvedAlign = align || "center";
    const resolvedAlt = alt || "";
    const style = `display:block;width:${resolvedWidth};max-width:100%;margin-bottom:32px;${
      resolvedAlign === "center" ? "margin-left:auto;margin-right:auto;margin-top:8px;" :
      resolvedAlign === "right" ? "margin-left:auto;margin-right:0;margin-top:8px;" : "margin-top:8px;"
    }`;
    return `<img src="${url}" alt="${resolvedAlt}" data-align="${resolvedAlign}" data-width="${resolvedWidth}" style="${style}" />`;
  },
  table: (block: any) => {
    const content = block.data.content || [];
    const rows = content.map((row: string[]) => {
      const cells = row.map((cell: string) => `<td style="border:1px solid #e2e8f0;padding:8px 12px">${cell}</td>`).join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    return `<table style="width:100%;border-collapse:collapse;margin:20px 0">${rows}</table>`;
  }
});

interface EditorJsComponentProps {
  content: object;
  onChange: (json: object, html: string) => void;
}

export default function EditorJsComponent({ content, onChange }: EditorJsComponentProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useRef(false);

  useEffect(() => {
    // Append SVG sprite sheet for editorjs-hyperlink icons
    const spriteId = "editorjs-hyperlink-sprite";
    let sprite = document.getElementById(spriteId);
    if (!sprite) {
      sprite = document.createElement("div");
      sprite.id = spriteId;
      sprite.style.display = "none";
      sprite.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <symbol id="link" viewBox="0 0 24 24">
            <path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </symbol>
          <symbol id="unlink" viewBox="0 0 24 24">
            <path fill="currentColor" d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.96 2.63-2.27 2.98l1.42 1.42c1.64-.78 2.85-2.43 2.85-4.4 0-2.76-2.24-5-5-5zM2 4.27l3.11 3.11C3.89 8.08 3 9.4 3 11c0 2.76 2.24 5 5 5h4v-1.9H8c-1.71 0-3.1-1.39-3.1-3.1 0-.96.44-1.81 1.13-2.39l2.39 2.39h-.42v2h2v-2h-.01l6.19 6.19 1.27-1.27L3.27 3 2 4.27zM8 12.8v-2h2.2l2 2H8z"/>
          </symbol>
        </svg>
      `;
      document.body.appendChild(sprite);
    }

    if (!editorRef.current && containerRef.current) {
      // Handle legacy Tiptap JSON content converting
      const initialData = convertTiptapToEditorJs(content);

      const editor = new EditorJS({
        holder: containerRef.current!,
        data: (initialData && Object.keys(initialData).length > 0 && initialData.blocks?.length > 0) ? (initialData as OutputData) : undefined,
        placeholder: "Start writing your blog post...",
        tools: {
          header: {
            class: Header as any,
            config: {
              levels: [2, 3, 4, 5, 6],
              defaultLevel: 2,
            },
            inlineToolbar: true,
            toolbox: [
              {
                icon: '<span class="text-xs font-bold font-mono">H2</span>',
                title: 'Heading 2',
                data: { level: 2 }
              },
              {
                icon: '<span class="text-xs font-bold font-mono">H3</span>',
                title: 'Heading 3',
                data: { level: 3 }
              },
              {
                icon: '<span class="text-xs font-bold font-mono">H4</span>',
                title: 'Heading 4',
                data: { level: 4 }
              },
              {
                icon: '<span class="text-xs font-bold font-mono">H5</span>',
                title: 'Heading 5',
                data: { level: 5 }
              },
              {
                icon: '<span class="text-xs font-bold font-mono">H6</span>',
                title: 'Heading 6',
                data: { level: 6 }
              }
            ]
          },
          list: {
            class: List as any,
            inlineToolbar: true,
          },
          image: {
            class: CustomImageTool as any,
          },
          ctaBanner: {
            class: CtaBannerTool as any,
          },
          table: {
            class: Table as any,
            inlineToolbar: true,
          },
          hyperlink: {
            class: Hyperlink as any,
            config: {
              shortcut: 'CMD+L',
              target: '_blank',
              rel: 'nofollow',
              availableTargets: ['_blank', '_self'],
              availableRels: ['author', 'noreferrer', 'nofollow'],
              validate: false,
            }
          },
          quote: {
            class: Quote as any,
            inlineToolbar: true,
          },
          code: CodeTool as any,
          inlineCode: InlineCode as any,
          embed: Embed as any,
          marker: Marker as any,
          delimiter: Delimiter as any,
        },
        onChange: async () => {
          if (!editorRef.current) return;
          try {
            const outputData = await editorRef.current.save();
            const htmlStrings = edjsParser.parse(outputData);
            const html = Array.isArray(htmlStrings) ? htmlStrings.join("") : htmlStrings;
            onChange(outputData, html);
          } catch (err) {
            console.error("Editor.js save failed:", err);
          }
        },
        onReady: () => {
          isReady.current = true;
        },
      });
      editorRef.current = editor;
    }

    return () => {
      if (editorRef.current && isReady.current) {
        editorRef.current.destroy();
        editorRef.current = null;
        isReady.current = false;
      }
    };
  }, []);

  return (
    <div className="w-full bg-white h-full overflow-y-auto">
      <div 
        ref={containerRef} 
        className="prose prose-sm md:prose-base max-w-none px-6 py-4 focus:outline-none editor-js-container"
      />
    </div>
  );
}
