import { useEffect } from "react";
import { FiLoader } from "react-icons/fi";

export default function LoadingScreen() {
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] grid h-[100dvh] place-items-center overflow-hidden bg-[#013E43]/75 px-4 backdrop-blur-sm">
      <div className="text-center text-white drop-shadow-lg">
        <FiLoader aria-hidden="true" className="mx-auto h-10 w-10 animate-spin" />
        <p className="mt-4 text-sm font-semibold">Loading</p>
      </div>
    </div>
  );
}
