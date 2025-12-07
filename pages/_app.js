// pages/_app.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EasterEgg from "../components/EasterEgg";
import { LensAdvisorProvider } from "../context/LensAdvisorContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";

export default function App({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      // Add smooth page transition
      document.body.style.opacity = '0';
      setTimeout(() => {
        document.body.style.opacity = '1';
      }, 150);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  return (
    <AuthProvider>
      <ToastProvider>
        <LensAdvisorProvider>
          <div style={{ 
            transition: 'opacity 0.3s ease-in-out',
            opacity: mounted ? 1 : 0 
          }}>
            <Component {...pageProps} />
          </div>
          {mounted && <EasterEgg />}
          {mounted && <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />}
        </LensAdvisorProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
