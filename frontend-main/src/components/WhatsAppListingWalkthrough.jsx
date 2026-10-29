import { useEffect, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiImage,
  FiMapPin,
  FiPause,
  FiPlay,
  FiSend
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const scenes = [
  {
    title: "Start with a message",
    prompt: "Hi, I want to list my property.",
    reply: "Hello! Our team can guide you through getting started.",
    icon: FiSend
  },
  {
    title: "Share the essentials",
    prompt: "Two-bedroom home in Nakuru, KES 28,000 per month.",
    reply: "Send clear property photos and the exact area or nearby landmark.",
    icon: FiMapPin
  },
  {
    title: "Complete your listing",
    prompt: "I have the details and photos ready.",
    reply: "Create your landlord account, then add the property in your dashboard.",
    icon: FiImage
  },
  {
    title: "Reach property seekers",
    prompt: "My property has been submitted.",
    reply: "After review and approval, it appears on RendaHomes for tenants to find.",
    icon: FiCheckCircle
  }
];

export default function WhatsAppListingWalkthrough({ whatsappUrl, landlordUrl }) {
  const [activeScene, setActiveScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const scene = scenes[activeScene];
  const SceneIcon = scene.icon;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setActiveScene((current) => (current + 1) % scenes.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [playing]);

  const move = (direction) => {
    setPlaying(false);
    setActiveScene((current) => (current + direction + scenes.length) % scenes.length);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#DDEBE4] bg-[#F3F8F5] shadow-[0_20px_55px_rgba(1,62,67,0.12)]">
      <div className="flex items-center justify-between border-b border-[#DDEBE4] bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F8EC] text-[#15803D]">
            <FaWhatsapp className="text-xl" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#013E43]">RendaHomes support</p>
            <p className="text-xs font-medium text-[#647C75]">WhatsApp-assisted listing</p>
          </div>
        </div>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Open RendaHomes WhatsApp chat" className="grid h-10 w-10 place-items-center rounded-full text-[#0D915C] transition hover:bg-[#E7F8EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0D915C]">
          <FiArrowRight aria-hidden="true" />
        </a>
      </div>

      <div className="min-h-[265px] px-4 py-5 sm:min-h-[290px] sm:px-6" aria-live="polite">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#647C75]">Step {activeScene + 1} of {scenes.length}</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D915C]"><SceneIcon aria-hidden="true" /> {scene.title}</span>
        </div>
        <div className="flex justify-end">
          <div key={`prompt-${activeScene}`} className="max-w-[88%] rounded-2xl rounded-br-sm bg-[#DDF7E6] px-4 py-3 text-sm font-medium leading-5 text-[#173D2C] motion-safe:animate-[fade-in_300ms_ease-out]">
            {scene.prompt}
          </div>
        </div>
        <div className="mt-3 flex justify-start">
          <div key={`reply-${activeScene}`} className="max-w-[88%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm font-medium leading-5 text-[#24443A] shadow-sm motion-safe:animate-[fade-in_300ms_ease-out]">
            {scene.reply}
          </div>
        </div>
        {activeScene === 1 ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#DDEBE4] bg-white px-3 py-2 text-xs font-semibold text-[#466358]">
            <FiImage className="text-[#0D915C]" aria-hidden="true" /> Property photos
          </div>
        ) : null}
        {activeScene === 2 ? (
          <a href={landlordUrl} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#013E43] px-4 text-xs font-bold text-white transition hover:bg-[#005C57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#013E43]">
            Open landlord portal <FiArrowRight aria-hidden="true" />
          </a>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[#DDEBE4] bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-1.5" aria-label={`Walkthrough step ${activeScene + 1} of ${scenes.length}`}>
          {scenes.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => { setPlaying(false); setActiveScene(index); }}
              aria-label={`Show step ${index + 1}: ${item.title}`}
              aria-current={index === activeScene ? "step" : undefined}
              className={`h-2.5 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D915C] ${index === activeScene ? "w-7 bg-[#0D915C]" : "w-2.5 bg-[#C5D8CF] hover:bg-[#0D915C]/60"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} aria-label="Previous walkthrough step" className="grid h-10 w-10 place-items-center rounded-full border border-[#DDEBE4] text-[#24443A] transition hover:bg-[#F3F8F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0D915C]">
            <FiArrowLeft aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause walkthrough" : "Play walkthrough"} className="grid h-10 w-10 place-items-center rounded-full bg-[#0D915C] text-white transition hover:bg-[#087147] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D915C]">
            {playing ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next walkthrough step" className="grid h-10 w-10 place-items-center rounded-full border border-[#DDEBE4] text-[#24443A] transition hover:bg-[#F3F8F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0D915C]">
            <FiArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
