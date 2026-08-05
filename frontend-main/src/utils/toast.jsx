import { useEffect, useState } from "react";

const listeners = new Set();

const emit = (message, type = "success") => {
  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message,
    type
  };

  listeners.forEach((listener) => listener(item));
};

const toast = {
  success: (message) => emit(message, "success"),
  error: (message) => emit(message, "error")
};

export function Toaster({ position = "top-right" }) {
  const [items, setItems] = useState([]);
  const align = position.includes("right") ? "right-4" : "left-4";

  useEffect(() => {
    const listener = (item) => {
      setItems((current) => [...current, item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((toastItem) => toastItem.id !== item.id));
      }, 3600);
    };

    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return (
    <div className={`fixed top-4 ${align} z-[9999] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2`}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl px-4 py-3 text-sm font-bold text-white shadow-xl ${
            item.type === "error" ? "bg-red-600" : "bg-[#013E43]"
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}

export default toast;
