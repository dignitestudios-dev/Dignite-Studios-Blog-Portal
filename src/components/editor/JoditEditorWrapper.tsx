"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import "jodit/es2021/jodit.min.css";
import { FiCode } from "react-icons/fi";
import { VsCodeHtmlEditor, formatHtml } from "./TiptapEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// Dynamically import JoditEditor to avoid SSR issues with window/document
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center border border-gray-200 rounded-xl bg-gray-50">
      <p className="text-gray-500">Loading jodit editor...</p>
    </div>
  ),
});

interface JoditEditorWrapperProps {
  contentHtml?: string;
  onChange: (json: object, html: string) => void;
}

// Exact CTA Banner structure and style from previous Tiptap implementation
export const DEFAULT_CTA_HTML = `<div data-type="cta-banner" class="cta-banner not-prose" data-heading="Get Clear On Your Next Move" data-paragraph="Choosing the right enterprise mobile app development services can define your project’s success. Let our experts help you plan, design and build a solution which truly meets the business needs." data-button-text="Get Started Today" data-button-href="#" data-cta-type="link" data-input-placeholder="Enter your email..." style="border-radius: 20px; background-color: #F15C20; padding: 40px 6% 36px; text-align: center; font-family: Arial, sans-serif; box-sizing: border-box; width: 100%; overflow: hidden; margin: 40px 0;">
  <div style="margin-bottom: 14px;">
    <h2 style="margin: 0; font-size: 30px; font-weight: 700; line-height: 1.25; color: #ffffff; word-break: break-word; text-align: center;">Get Clear On Your Next Move</h2>
  </div>
  <p style="margin: 0 0 28px; font-size: 15px; color: rgba(255, 255, 255, 0.92); line-height: 1.5; word-break: break-word; overflow-wrap: break-word;">Choosing the right enterprise mobile app development services can define your project’s success. Let our experts help you plan, design and build a solution which truly meets the business needs.</p>
  <div style="display: inline-flex; align-items: center; justify-content: center; gap: 0px;">
    <a href="#" style="display: inline-flex; align-items: center; justify-content: center; background: #ffffff; color: #F15C20; text-decoration: none; font-size: 14px; font-weight: 600; padding: 0 32px; border-radius: 50px; white-space: nowrap; line-height: 1; min-width: 160px; height: 52px; box-sizing: border-box;">Get Started Today</a>
    <a href="#" style="display: inline-flex; align-items: center; justify-content: center; background: #ffffff; color: #F15C20; text-decoration: none; width: 52px; height: 52px; border-radius: 50px; flex-shrink: 0; box-sizing: border-box;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right-icon lucide-arrow-up-right"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
    </a>
  </div>
</div>`;

export function JoditEditorWrapper({
  contentHtml = "",
  onChange,
}: JoditEditorWrapperProps) {
  const editorRef = useRef<any>(null);
  const currentValueRef = useRef<string>(contentHtml);
  const [valueProp, setValueProp] = useState<string>(contentHtml);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const [copyToast, setCopyToast] = useState(false);

  // Sync incoming contentHtml if it changes from external source
  useEffect(() => {
    if (contentHtml !== currentValueRef.current) {
      currentValueRef.current = contentHtml;
      setValueProp(contentHtml);
      if (editorRef.current && editorRef.current.value !== contentHtml) {
        editorRef.current.value = contentHtml;
      }
    }
  }, [contentHtml]);

  // Handle changes from Jodit without triggering rapid re-renders during fast typing
  const handleJoditChange = useCallback(
    (newContent: string) => {
      currentValueRef.current = newContent;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange({}, newContent);
      }, 500);
    },
    [onChange],
  );

  const handleJoditBlur = useCallback(
    (newContent: string) => {
      currentValueRef.current = newContent;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onChange({}, newContent);
    },
    [onChange],
  );

  const openHtmlDialog = () => {
    const currentHtml =
      editorRef.current?.value || currentValueRef.current || "";
    setHtmlSource(formatHtml(currentHtml));
    setHtmlDialogOpen(true);
  };

  const applyHtmlChanges = () => {
    if (editorRef.current) {
      editorRef.current.value = htmlSource;
    }
    currentValueRef.current = htmlSource;
    setValueProp(htmlSource);
    onChange({}, htmlSource);
    setHtmlDialogOpen(false);
  };

  const insertCtaBanner = () => {
    if (editorRef.current) {
      editorRef.current.selection.insertHTML(DEFAULT_CTA_HTML);
      const updated = editorRef.current.value;
      currentValueRef.current = updated;
      setValueProp(updated);
      onChange({}, updated);
    }
  };

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start writing your blog post...",
      height: "100%",
      minHeight: 500,
      maxHeight: "100%",
      autofocus: false,
      direction: "ltr" as const,
      theme: "default",
      toolbar: true,
      toolbarAdaptive: false,
      toolbarButtonSize: "middle" as const,
      toolbarSticky: false,
      toolbarStickyOffset: 0,
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
      enableDragAndDropFileToEditor: true,
      uploader: {
        insertImageAsBase64URI: true,
      },
      buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "outdent",
        "indent",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "image",
        "table",
        "link",
        "align",
        "|",
        "undo",
        "redo",
        "|",
        "hr",
        "eraser",
        "fullsize",
      ],
      style: {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "15px",
        color: "#111827",
        lineHeight: "1.7",
      },
    }),
    [],
  );

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Top Control Bar — Clean single location for CTA and Formatted HTML Source */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={insertCtaBanner}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F15C20] text-white hover:bg-[#d94d17] transition-all shadow-sm active:scale-95"
          >
            <span>+ Add CTA Banner</span>
          </button>
        </div>

        <button
          type="button"
          onClick={openHtmlDialog}
          title="View & Edit Formatted HTML Source Code"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all shadow-sm active:scale-95"
        >
          <FiCode size={14} className="text-[#F15C20]" />
          <span>&lt;/&gt; Formatted HTML Source</span>
        </button>
      </div>

      {/* Jodit Editor Area */}
      <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
        <JoditEditor
          ref={editorRef}
          value={valueProp}
          config={config}
          onBlur={handleJoditBlur}
          onChange={handleJoditChange}
        />
      </div>

      {/* Formatted HTML Source Code Modal */}
      <Dialog open={htmlDialogOpen} onOpenChange={setHtmlDialogOpen}>
        <DialogContent className="!max-w-[96vw] w-[96vw] h-[92vh] flex flex-col p-6 bg-[#18181b] border border-gray-800 text-white rounded-2xl shadow-2xl overflow-hidden">
          <DialogHeader className="shrink-0 pb-3 border-b border-gray-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#F15C20]/20 text-[#F15C20]">
                <FiCode size={22} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  HTML Source Code Editor
                </DialogTitle>
              </div>
            </div>

            <div className="flex items-center gap-2 mr-6">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(htmlSource);
                  setCopyToast(true);
                  setTimeout(() => setCopyToast(false), 2000);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors border border-gray-700"
              >
                {copyToast ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </DialogHeader>

          {/* VS Code Code Editor Component */}
          <VsCodeHtmlEditor value={htmlSource} onChange={setHtmlSource} />

          <DialogFooter className="!bg-[#18181b] !border-t !border-gray-800 shrink-0 pt-4 pb-2 !px-0 !mx-0 !mb-0 flex flex-row items-center justify-between">
            <p className="text-xs text-gray-300 font-medium">
              Click &quot;Apply Changes&quot; to update the blog post and live
              preview.
            </p>
            <div className="flex items-center gap-3">
              <DialogClose
                render={
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-medium border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                }
              />
              <button
                type="button"
                onClick={applyHtmlChanges}
                className="px-6 py-2 text-xs font-semibold bg-[#F15C20] hover:bg-[#d94d17] text-white rounded-lg transition-colors shadow-md"
              >
                Apply Changes
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JoditEditorWrapper;
