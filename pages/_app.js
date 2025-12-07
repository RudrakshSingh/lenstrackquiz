// pages/_app.js
import { useEffect, useState } from "react";
import "../styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EasterEgg from "../components/EasterEgg";
import { LensAdvisorProvider } from "../context/LensAdvisorContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";

export default function App({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <LensAdvisorProvider>
          <Component {...pageProps} />
          {mounted && <EasterEgg />}
          {mounted && <ToastContainer />}
        </LensAdvisorProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
