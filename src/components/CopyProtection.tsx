"use client";

import React, { useEffect, useRef } from "react";

interface CopyProtectionProps {
  children: React.ReactNode;
  active?: boolean;
}

export default function CopyProtection({ children, active = true }: CopyProtectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("⚠️ النسخ وحماية المحتوى مفعلة! غير مسموح بالضغط كليك يمين.");
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("⚠️ غير مسموح بنسخ الأسئلة أو المحتوى التعليمي لحماية الحقوق.");
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "u" || e.key === "C" || e.key === "V" || e.key === "X" || e.key === "U")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c"))
      ) {
        e.preventDefault();
        alert("⚠️ تم تعطيل هذه الاختصارات لحماية أسئلة الامتحانات والمحتوى التعليمي من التسريب.");
      }
    };

    // Attach to the document to prevent cheating
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [active]);

  return (
    <div
      ref={containerRef}
      className={`select-none ${active ? "selection:bg-transparent" : ""}`}
      style={active ? {
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      } : {}}
    >
      {children}
    </div>
  );
}
