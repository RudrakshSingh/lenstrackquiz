// pages/_app.js
import "../styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EasterEgg from "../components/EasterEgg";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <EasterEgg />
      <ToastContainer />
    </>
  );
}
