"use client";

import React, { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
// @ts-ignore
import Header from "@editorjs/header";
// @ts-ignore
import List from "@editorjs/list";
// @ts-ignore
import ImageTool from "@editorjs/image";
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
import editorjsHtml from "editorjs-html";

const edjsParser = editorjsHtml();

interface EditorJsComponentProps {
  content: object;
  onChange: (json: object, html: string) => void;
}

export default function EditorJsComponent({ content, onChange }: EditorJsComponentProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useRef(false);

  useEffect(() => {
    if (!editorRef.current && containerRef.current) {
      const initEditor = async () => {
        const editor = new EditorJS({
          holder: containerRef.current!,
          data: (content && Object.keys(content).length > 0) ? (content as OutputData) : undefined,
          placeholder: "Start writing your blog post...",
          tools: {
            header: {
              class: Header,
              config: {
                levels: [2, 3, 4, 5, 6],
                defaultLevel: 2,
              },
            },
            list: {
              class: List,
              inlineToolbar: true,
            },
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  uploadByFile(file: File) {
                    const formData = new FormData();
                    formData.append("file", file);
                    return fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    })
                      .then((res) => res.json())
                      .then((res) => {
                        return {
                          success: 1,
                          file: {
                            url: res.url,
                          },
                        };
                      });
                  },
                },
              },
            },
            quote: Quote,
            code: CodeTool,
            inlineCode: InlineCode,
            embed: Embed,
            marker: Marker,
            delimiter: Delimiter,
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
      };

      initEditor();
    }

    return () => {
      if (editorRef.current && isReady.current) {
        editorRef.current.destroy();
        editorRef.current = null;
        isReady.current = false;
      }
    };
  }, []); // Only initialize once

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
      <div 
        ref={containerRef} 
        className="prose prose-sm md:prose-base max-w-none p-6 focus:outline-none"
      />
    </div>
  );
}
