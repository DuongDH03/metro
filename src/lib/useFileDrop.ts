import { useCallback, useEffect, useRef, useState } from 'react';

const hasFiles = (e: DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');

/**
 * Window-wide file drag-and-drop. `active` is true while files are dragged over the page;
 * `cancel()` hides the overlay and ignores the drop of the current drag (Escape).
 */
export function useFileDrop(onFiles: (files: File[]) => void): { active: boolean; cancel(): void } {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  const cancelled = useRef(false);
  const cb = useRef(onFiles);
  useEffect(() => {
    cb.current = onFiles;
  }, [onFiles]);

  useEffect(() => {
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (depth.current === 0) cancelled.current = false;
      depth.current++;
      if (!cancelled.current) setActive(true);
    };
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); // required to allow dropping, and stops the browser from opening the file
      if (e.dataTransfer) e.dataTransfer.dropEffect = cancelled.current ? 'none' : 'copy';
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setActive(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setActive(false);
      const skip = cancelled.current;
      cancelled.current = false;
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (!skip && files.length) cb.current(files);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);

  const cancel = useCallback(() => {
    cancelled.current = true;
    setActive(false);
  }, []);
  return { active, cancel };
}
