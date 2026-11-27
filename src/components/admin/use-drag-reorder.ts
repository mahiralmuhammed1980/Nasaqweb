import { useRef } from "react";

/**
 * إعادة ترتيب بالسحب (HTML5) فوق أزرار الأعلى/الأسفل (للوحة المفاتيح).
 * يُمرَّر move من useFieldArray.
 */
export function useDragReorder(move: (from: number, to: number) => void) {
  const from = useRef<number | null>(null);
  return (index: number) => ({
    draggable: true as const,
    onDragStart: () => {
      from.current = index;
    },
    onDragOver: (event: React.DragEvent) => event.preventDefault(),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (from.current !== null && from.current !== index)
        move(from.current, index);
      from.current = null;
    },
  });
}
