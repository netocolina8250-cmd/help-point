"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Se a rota for /admin/login, não aplica o layout com sidebar nem o bloqueio
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        router.replace("/admin/login");
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !isLoginPage) {
        setIsAuthenticated(false);
        router.replace("/admin/login");
      } else if (session) {
        setIsAuthenticated(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, isLoginPage, router]);

  // Se for a página de login, renderiza apenas o conteúdo do login
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Enquanto valida a sessão do usuário
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#2f190e] flex flex-col items-center justify-center gap-3 text-amber-100">
        <Loader2 className="w-8 h-8 animate-spin text-[#f65a00]" />
        <p className="text-sm font-semibold tracking-wide text-amber-200/80">Verificando credenciais...</p>
      </div>
    );
  }

  // Se não autenticado (antes do redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#fffaf2]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
