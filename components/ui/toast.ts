/** A tiny event bus so any control can report an outcome to the page's one toaster. */
export type ToastDetail = {
  ok: boolean;
  message: string;
  /** Optional one-tap action, e.g. Undo. */
  action?: { label: string; run: () => void };
};

export const TOAST_EVENT = 'afnon:toast';

export function toast(detail: ToastDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail }));
}
