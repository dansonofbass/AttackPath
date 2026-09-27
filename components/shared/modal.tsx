"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
      className="fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-xl border border-border bg-surface p-0 shadow-2xl"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-border bg-surface px-6 py-5">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        <button
          aria-label="Close dialog"
          onClick={onClose}
          className="rounded p-1 text-muted hover:text-ink"
        >
          <X size={19} />
        </button>
      </header>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
