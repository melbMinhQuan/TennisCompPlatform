import { useEffect, useRef, type RefObject } from "react";
import PlayerNavigation from "./PlayerNavigation";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  /** Focus goes back here when the drawer closes. */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

/** Slide-in menu drawer for phones. Locks page scroll while open and closes if the screen becomes desktop width. */
export default function MobileMenu({ isOpen, onClose, onLogout, returnFocusRef }: MobileMenuProps) {
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const drawer = drawerRef.current;
    drawer?.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) onClose();
    };
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      drawer?.close();
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeOnDesktop);
      returnFocusRef.current?.focus();
    };
  }, [isOpen, onClose, returnFocusRef]);

  return (
    <dialog
      ref={drawerRef}
      id="mobile-player-menu"
      aria-label="Player menu"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-auto top-[72px] left-0 m-0 h-[calc(100dvh-72px)] max-h-none w-[280px] max-w-[calc(100vw-20px)] border-0 bg-[#1a3049] p-0 text-white backdrop:bg-black/35"
    >
      <div className="flex min-h-full flex-col p-5">
        <button
          type="button"
          onClick={onClose}
          className="mb-2.5 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">×</span>
          Close menu
        </button>

        <p className="mb-2.5 text-xs text-slate-300">PLAYER MENU</p>

        <PlayerNavigation mobile onNavigate={onClose} onLogout={onLogout} />
      </div>
    </dialog>
  );
}
