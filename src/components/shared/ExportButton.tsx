import { useState } from 'react';
import { toCanvas, toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';

type ExportFormat = 'pdf' | 'png';

function inlineComputedStyles(source: HTMLElement, clone: HTMLElement) {
  const computed = window.getComputedStyle(source);

  Array.from(computed).forEach((property) => {
    clone.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property));
  });

  clone.style.setProperty('animation', 'none');
  clone.style.setProperty('transition', 'none');
  clone.style.setProperty('backdrop-filter', 'none');
  clone.style.setProperty('-webkit-backdrop-filter', 'none');
  clone.style.setProperty('caret-color', 'transparent');

  const sourceChildren = Array.from(source.children) as HTMLElement[];
  const cloneChildren = Array.from(clone.children) as HTMLElement[];

  sourceChildren.forEach((child, index) => {
    const cloneChild = cloneChildren[index];
    if (cloneChild) {
      inlineComputedStyles(child, cloneChild);
    }
  });
}

function prepareCloneForCapture(source: HTMLElement) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.zIndex = '-1';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.background = '#020408';
  wrapper.style.padding = '24px';
  wrapper.style.width = `${Math.max(source.scrollWidth, source.clientWidth, 960)}px`;

  const clone = source.cloneNode(true) as HTMLElement;
  clone.style.width = '100%';
  clone.style.maxWidth = 'none';
  clone.style.overflow = 'visible';
  clone.style.height = 'auto';
  inlineComputedStyles(source, clone);

  clone
    .querySelectorAll<HTMLElement>('[data-radix-scroll-area-viewport], .leaflet-control-container, .leaflet-control, [data-export-ignore="true"]')
    .forEach((element) => {
      if (element.matches('.leaflet-control-container, .leaflet-control, [data-export-ignore="true"]')) {
        element.style.display = 'none';
        return;
      }

      element.style.maxHeight = 'none';
      element.style.height = 'auto';
      element.style.overflow = 'visible';
    });

  const sourceElements = Array.from(source.querySelectorAll<HTMLElement>('*'));
  const cloneElements = Array.from(clone.querySelectorAll<HTMLElement>('*'));

  cloneElements.forEach((element, index) => {
    const sourceElement = sourceElements[index];
    if (!sourceElement) return;

    const computed = window.getComputedStyle(sourceElement);
    if (computed.overflowY === 'auto' || computed.overflowY === 'scroll' || computed.overflow === 'hidden') {
      element.style.maxHeight = 'none';
      element.style.height = 'auto';
      element.style.overflow = 'visible';
    }
  });

  clone.querySelectorAll<HTMLElement>('img, svg').forEach((element) => {
    element.style.maxWidth = '100%';
  });

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  return {
    clone,
    cleanup: () => wrapper.remove(),
  };
}

async function renderExportCanvas(target: HTMLElement) {
  return toCanvas(target, {
    cacheBust: true,
    backgroundColor: '#020408',
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    skipFonts: false,
  });
}

export function ExportButton({
  targetId,
  filename,
  label,
  format = 'pdf',
}: {
  targetId: string;
  filename: string;
  label: string;
  format?: ExportFormat;
}) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    const target = document.getElementById(targetId);
    if (!target) {
      toast.error('Nothing to export yet');
      return;
    }

    setExporting(true);
    try {
      if ('fonts' in document) {
        await document.fonts.ready;
      }

      const { clone, cleanup } = prepareCloneForCapture(target);
      try {
        if (format === 'png') {
          const pngDataUrl = await toPng(clone, {
            cacheBust: true,
            backgroundColor: '#020408',
            pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
            skipFonts: false,
          });
          const link = document.createElement('a');
          link.href = pngDataUrl;
          link.download = `${filename}.png`;
          link.click();
          toast.success('Snapshot exported successfully');
          return;
        }

        const canvas = await renderExportCanvas(clone);
        const imageData = canvas.toDataURL('image/png');
        const isLandscape = canvas.width >= canvas.height;
        const pdf = new jsPDF({
          orientation: isLandscape ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imageHeightMm = (canvas.height * pageWidth) / canvas.width;
        let remainingHeight = imageHeightMm;
        let offsetY = 0;

        pdf.addImage(imageData, 'PNG', 0, offsetY, pageWidth, imageHeightMm);
        remainingHeight -= pageHeight;

        while (remainingHeight > 0) {
          offsetY = remainingHeight - imageHeightMm;
          pdf.addPage();
          pdf.addImage(imageData, 'PNG', 0, offsetY, pageWidth, imageHeightMm);
          remainingHeight -= pageHeight;
        }

        pdf.save(`${filename}.pdf`);
        toast.success('PDF exported successfully');
      } finally {
        cleanup();
      }
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Export failed. Please try again on the current page.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      onClick={() => void handleExport()}
      disabled={exporting}
      className="rounded-2xl bg-white/10 text-white hover:bg-white/15 disabled:opacity-70"
    >
      {exporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}
