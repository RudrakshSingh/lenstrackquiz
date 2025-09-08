import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

export default function EasterEgg() {
  const keysRef = useRef([]);

  useEffect(() => {
    const handler = (e) => {
      keysRef.current.push(e.key);
      keysRef.current = keysRef.current.slice(-10);
      const code = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
      if (code.every((k, i) => keysRef.current[keysRef.current.length - 10 + i] === k)) {
        showToast();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const showToast = () => {
    toast.info("You just unlocked HD Vision Mode. Retina says: sheeeesh 😎 — Lenstrack", {
      position: "bottom-center",
      autoClose: 2500,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      theme: "colored",
    });
  };

  return (
    <img
      src="/lenstrack-logo.svg"
      alt="Lenstrack logo"
      onClick={showToast}
      title="Tap the Lenstrack logo for a surprise"
      className="eggLogo"
      style={{
        width: 110,
        height: 26,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserDrag: "none",
        filter: "drop-shadow(0 6px 14px rgba(17,24,39,0.15))",
      }}
    />
  );
}


