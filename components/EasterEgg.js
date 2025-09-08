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
    <div
      className="eggLogoText"
      onClick={showToast}
      title="Tap the Lenstrack logo for a surprise"
    >
      Lenstrack<sup>®</sup>
    </div>
  );
}


