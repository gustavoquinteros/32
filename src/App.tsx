/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, ZoomOut, Maximize, MousePointer2, Move } from 'lucide-react';

export default function App() {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  // Handle pointer events for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - lastPointerPos.current.x;
    const dy = e.clientY - lastPointerPos.current.y;

    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));

    lastPointerPos.current = { x: e.clientX, y: e.clientY };
  };

  // Handle wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    const zoomSpeed = 0.0015;
    const delta = -e.deltaY;
    
    // Calculate new scale with limits
    const newScale = Math.min(Math.max(transform.scale + delta * zoomSpeed * transform.scale, 0.05), 20);

    // Zoom towards cursor position
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate the mouse position in "world" coordinates before zoom
    const worldX = (mouseX - transform.x) / transform.scale;
    const worldY = (mouseY - transform.y) / transform.scale;

    // Calculate new offset to keep the world position under the mouse
    const newX = mouseX - worldX * newScale;
    const newY = mouseY - worldY * newScale;

    setTransform({
      x: newX,
      y: newY,
      scale: newScale
    });
  };

  const resetTransform = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[var(--canvas-grey)] cursor-grab active:cursor-grabbing touch-none select-none font-sans text-[var(--text-main)]"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onWheel={handleWheel}
    >
      {/* Infinite Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: `${50 * transform.scale}px ${50 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`
        }}
      />

      {/* Content Layer */}
      <div 
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Origin Marker */}
        <div className="absolute top-0 left-0 w-4 h-4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-px h-full bg-white/10 absolute" />
          <div className="h-px w-full bg-white/10 absolute" />
        </div>

        {/* Example Content - Canvas Object Style */}
        <div className="absolute top-[200px] left-[200px] w-[200px] p-5 bg-[var(--bg-color)] border border-[var(--accent-grey)] rounded shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-auto">
          <div className="text-[11px] text-[var(--text-dim)] mb-2.5 uppercase tracking-wider">#NODE_0041</div>
          <h2 className="text-base font-medium mb-2 text-[var(--text-main)]">Espaço Infinito</h2>
          <p className="text-xs text-[var(--text-dim)] leading-relaxed">
            Navegue livremente em todas as direções. Use os controles laterais para ajustar o zoom do viewport.
          </p>
        </div>

        <div className="absolute top-[-400px] left-[-300px] p-6 border border-dashed border-[var(--accent-grey)] rounded-full w-64 h-64 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)] opacity-30">
          Deep Space
        </div>
      </div>

      {/* UI Overlay - Viewport Indicator (Top Left) */}
      <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md p-3 px-5 rounded-lg border border-[var(--accent-grey)] font-mono text-[13px] z-10 pointer-events-none">
        <div className="mb-1">
          <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest mr-2">POS_X:</span> 
          {Math.round(-transform.x / transform.scale).toLocaleString()}
        </div>
        <div className="mb-1">
          <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest mr-2">POS_Y:</span> 
          {Math.round(-transform.y / transform.scale).toLocaleString()}
        </div>
        <div>
          <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-widest mr-2">MODE:</span> 
          FREE_PAN
        </div>
      </div>

      {/* Zoom Level (Bottom Left) */}
      <div className="absolute bottom-6 left-6 text-[11px] text-[var(--text-dim)] uppercase tracking-[2px] z-10 pointer-events-none">
        Zoom: {Math.round(transform.scale * 100)}%
      </div>

      {/* UI Overlay - Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-10">
        <div className="flex flex-col bg-[var(--bg-color)] border border-[var(--accent-grey)] rounded-md overflow-hidden">
          <button 
            onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 20) }))}
            className="w-11 h-11 flex items-center justify-center bg-transparent text-white border-b border-[var(--accent-grey)] hover:bg-[var(--accent-grey)] transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.05) }))}
            className="w-11 h-11 flex items-center justify-center bg-transparent text-white hover:bg-[var(--accent-grey)] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
        </div>
        
        <div className="flex flex-col bg-[var(--bg-color)] border border-[var(--accent-grey)] rounded-md overflow-hidden">
          <button 
            onClick={resetTransform}
            className="w-11 h-11 flex items-center justify-center bg-transparent text-white hover:bg-[var(--accent-grey)] transition-colors"
            title="Reset View"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>

      {/* Interaction Hint */}
      <AnimatePresence>
        {!isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <div className="w-full h-px bg-white absolute" />
            <div className="h-full w-px bg-white absolute" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
