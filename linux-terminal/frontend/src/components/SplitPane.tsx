'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import clsx from 'clsx';

interface SplitPaneProps {
  children: [ReactNode, ReactNode];
  direction?: 'horizontal' | 'vertical';
  initialSplit?: number; // percentage (0 to 100)
  minSize?: number; // pixels
}

export function SplitPane({ children, direction = 'horizontal', initialSplit = 50, minSize = 100 }: SplitPaneProps) {
  const [splitPercent, setSplitPercent] = useState(initialSplit);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHorizontal = direction === 'horizontal';

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      
      let newPercent = 50;
      if (isHorizontal) {
        const x = e.clientX - rect.left;
        newPercent = (x / rect.width) * 100;
        // enforce min sizes roughly
        if (x < minSize) newPercent = (minSize / rect.width) * 100;
        if (rect.width - x < minSize) newPercent = ((rect.width - minSize) / rect.width) * 100;
      } else {
        const y = e.clientY - rect.top;
        newPercent = (y / rect.height) * 100;
        // enforce min sizes roughly
        if (y < minSize) newPercent = (minSize / rect.height) * 100;
        if (rect.height - y < minSize) newPercent = ((rect.height - minSize) / rect.height) * 100;
      }
      
      setSplitPercent(Math.max(0, Math.min(100, newPercent)));
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        // trigger resize event so xterm.js fit addon re-calculates!
        window.dispatchEvent(new Event('resize'));
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isHorizontal, minSize]);

  return (
    <div 
      ref={containerRef} 
      className={clsx(
        "flex w-full h-full overflow-hidden",
        isHorizontal ? "flex-row" : "flex-col"
      )}
    >
      <div 
        className="relative overflow-hidden" 
        style={{ [isHorizontal ? 'width' : 'height']: `${splitPercent}%` }}
      >
        {children[0]}
      </div>
      
      <div
        className={clsx(
          "bg-kali-border hover:bg-kali-purple/50 z-10 shrink-0 transition-colors",
          isHorizontal ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"
        )}
        onMouseDown={handleMouseDown}
      />
      
      <div 
        className="flex-1 relative overflow-hidden"
      >
        {children[1]}
      </div>
    </div>
  );
}
