import { FiLoader } from "react-icons/fi";

export default function LoadingScreen({ label = "Loading RendaHomes" }) {
  return (
    <div className="grid min-h-[calc(100vh-5rem)] place-items-center bg-[#F0F7F4] px-4">
      <div className="text-center">
        <FiLoader aria-hidden="true" className="mx-auto h-9 w-9 animate-spin text-[#0D915C]" />
        <div className="mx-auto mt-5 h-1.5 w-36 overflow-hidden rounded-full bg-[#A8D8C1]/50">
          <div className="loading-bar h-full rounded-full bg-[#02BB31]" />
        </div>
        <p className="mt-4 text-sm font-extrabold text-[#013E43]">{label}</p>
      </div>
    </div>
  );
}
