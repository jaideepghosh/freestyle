"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { GripHorizontal } from "lucide-react";

interface ResizableSplitProps {
  children: [React.ReactNode, React.ReactNode];
  initialSplit?: number; // Percentage (0-100)
  minSize?: number; // Minimum size in pixels
  maxSize?: number; // Maximum size in pixels
  className?: string;
  splitterClassName?: string;
}

export const ResizableSplit: React.FC<ResizableSplitProps> = ({
  children,
  initialSplit = 50,
  minSize = 100,
  maxSize = 1000,
  className = "",
  splitterClassName = "",
}) => {
  const [splitPercentage, setSplitPercentage] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startSplitRef = useRef<number>(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startYRef.current = e.clientY;
      startSplitRef.current = splitPercentage;
    },
    [splitPercentage]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const mouseY = e.clientY - containerRect.top;
      const newPercentage = (mouseY / containerHeight) * 100;

      // Apply constraints
      const minPercentage = (minSize / containerHeight) * 100;
      const maxPercentage = 100 - (minSize / containerHeight) * 100;
      const constrainedPercentage = Math.max(
        minPercentage,
        Math.min(maxPercentage, newPercentage)
      );

      setSplitPercentage(constrainedPercentage);
    },
    [isDragging, minSize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full ${className}`}
      style={{ height: "calc(100vh - 50px)" }}
    >
      {/* Top Panel */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ height: `${splitPercentage}%` }}
      >
        {children[0]}
      </div>

      {/* Resizer */}
      <div
        className={`flex items-center justify-center cursor-row-resize hover:bg-gray-200 transition-colors duration-150 ${
          isDragging ? "bg-blue-200" : "bg-gray-100"
        } ${splitterClassName}`}
        style={{ height: "4px" }}
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal className="h-5 w-8 text-gray-500 z-4" />
      </div>

      {/* Bottom Panel */}
      <div
        className="flex-1 overflow-hidden"
        style={{ height: `${100 - splitPercentage}%` }}
      >
        {children[1]}
      </div>
    </div>
  );
};
