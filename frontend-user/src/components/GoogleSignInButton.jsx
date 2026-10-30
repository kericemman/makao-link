import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;

    let mounted = true;
    const renderButton = () => {
      if (!mounted || !window.google?.accounts?.id || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) callbackRef.current(response.credential);
        }
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.min(buttonRef.current.clientWidth || 360, 400),
        logo_alignment: "left"
      });
      setReady(true);
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (window.google?.accounts?.id) {
      renderButton();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderButton, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderButton;
      document.head.appendChild(script);
    }

    return () => {
      mounted = false;
      buttonRef.current?.replaceChildren();
    };
  }, []);

  if (!clientId) return null;

  return (
    <div className={`mt-5 transition-opacity ${disabled ? "pointer-events-none opacity-50" : ""}`}>
      <div ref={buttonRef} className="flex min-h-10 justify-center" aria-label="Continue with Google" />
      {!ready ? <span className="sr-only">Loading Google sign-in</span> : null}
    </div>
  );
}
