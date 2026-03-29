"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,     // 30s before refetch
          retry: 1,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}