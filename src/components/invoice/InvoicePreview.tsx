import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { INVOICE_MIN_HEIGHT_PX, INVOICE_WIDTH_PX } from './InvoiceDocument';

/**
 * Shrinks the full-size A4 invoice to fit the screen (e.g. a phone), without
 * changing the invoice itself — so the exported file is always full quality.
 */
export function InvoicePreview({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(INVOICE_MIN_HEIGHT_PX);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const observer = new ResizeObserver(() => {
      setScale(Math.min(1, container.clientWidth / INVOICE_WIDTH_PX));
      setHeight(content.offsetHeight);
    });
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 shadow-brand-900/5 ring-brand-100"
      style={{ height: height * scale }}
    >
      <div ref={contentRef} style={{ width: INVOICE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}
