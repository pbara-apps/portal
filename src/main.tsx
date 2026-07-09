import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Providers } from "./app/Providers";
import { Spinner } from "./components/ui/spinner";
import { router } from "./routes";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Providers>
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner label="Loading portal…" />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  </Providers>,
);
