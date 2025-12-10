import Router from "next/router";
import NProgress from "nprogress"; //nprogress module
import { Provider } from "react-redux";
import { store } from "../app/store";
import { Provider as NextAuthProvider } from "next-auth/client";
import { ToastContainer } from "react-toastify"; //styles of nprogress
import Layout from "../components/Layout/Layout";
import NotificationPrompt from "../components/NotificationPrompt/NotificationPrompt";
import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import "nprogress/nprogress.css";
import { SWRConfig } from "swr";
import fetcher from "../util/fetch";
import { useEffect } from "react";
import { useRef } from "react";

//Binding events.
Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Filtrar un warning conocido proveniente de la librería `react-reveal`
    // que usa lifecycles obsoletos (RevealBase -> componentWillReceiveProps).
    // Esto evita que la consola se llene de warnings mientras se usa la
    // librería. Es una mitigación segura para desarrollo. Si se desea,
    // reemplazar react-reveal por una alternativa compatible con React 18.
    const originalConsoleError = console.error;
    const mounted = { current: true };
    console.error = function (...args) {
      try {
        const first = args[0] || "";
        if (typeof first === "string" && first.includes("componentWillReceiveProps has been renamed") && first.includes("RevealBase")) {
          // Suprimir este warning específico
          return;
        }
      } catch (e) {
        // no-op
      }
      originalConsoleError.apply(console, args);
    };
    // Registrar service worker para PWA
    // Registrar el service worker cuando estemos en un contexto seguro (HTTPS)
    // o en localhost/127.0.0.1 — esto permite probar con ngrok o en la red local
    // sin requerir un deploy a GitHub/Vercel.
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const isSecure = window.location.protocol === "https:";

      if (isSecure || isLocalhost) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado:", registration);
        })
        .catch((error) => {
          console.log("Error registrando Service Worker:", error);
        });
      }
    }
    return () => {
      // restaurar console.error cuando se desmonte
      console.error = originalConsoleError;
      mounted.current = false;
    };
  }, []);

  // Inyectar datos de sesión (email/username) en window para que utilidades cliente
  // como pushNotifications puedan enviar userId al backend sin depender de build-time.
  useEffect(() => {
    try {
      const session = pageProps?.session;
      if (typeof window !== "undefined") {
        if (session && session.user) {
          window.__USER_EMAIL__ = session.user.email || null;
          window.__USER_NAME__ = session.user.name || session.user.username || null;
        } else {
          window.__USER_EMAIL__ = null;
          window.__USER_NAME__ = null;
        }
      }
    } catch (e) {
      // no-op
    }
  }, [pageProps.session]);

  return (
    <NextAuthProvider session={pageProps.session}>
      <SWRConfig
        value={{
          refreshInterval: 1000,
          fetcher,
        }}
      >
        <Provider store={store}>
          <Layout admin={Component?.admin} auth={Component?.auth}>
            <Component {...pageProps} />
            <NotificationPrompt />
            <ToastContainer limit={4} />
          </Layout>
        </Provider>
      </SWRConfig>
    </NextAuthProvider>
  );
}

export default MyApp;
