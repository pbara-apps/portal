import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Framer animations follow the system "reduce motion" setting. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}
