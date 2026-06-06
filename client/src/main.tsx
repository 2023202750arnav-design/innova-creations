import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/600.css";
import "@fontsource/great-vibes";
import "swiper/css";
import "./styles.css";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 20, gcTime: 1000 * 60 * 60 * 24 } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div className="p-10 font-body">Loading Innova Creations...</div>}>
          <App />
        </Suspense>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
