// pages/_app.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EasterEgg from "../components/EasterEgg";
import { LensAdvisorProvider } from "../contexts/LensAdvisorContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { CartProvider } from "../contexts/CartContext";

export default function App({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <LensAdvisorProvider>
            <div style={{ 
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.15s ease-in-out'
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
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
