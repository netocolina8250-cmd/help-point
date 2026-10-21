"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Boxes, 
  KeyRound, 
  Store, 
  ExternalLink,
  ChevronRight,
  LogOut,
  UserCheck
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  const navItems = [
    { href: "/admin", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/admin/produtos", label: "Produtos & Preços", icon: Package },
    { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
    { href: "/admin/insumos", label: "Insumos & Compras", icon: Boxes },
    { href: "/admin/integracoes", label: "Chaves & Integrações", icon: KeyRound },
  ];

  return (
    <aside className="w-64 bg-[#2f190e] text-amber-50 flex flex-col min-h-screen border-r border-amber-950/40 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-amber-900/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f65a00] to-[#ff8438] flex items-center justify-center shadow-lg shadow-orange-950/40 text-xl font-black text-white">
          🍗
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white leading-tight tracking-tight">Help Point</h1>
          <p className="text-xs text-amber-300/70 font-medium">Painel de Gestão</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-amber-400/50">
          Gerenciamento
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#f65a00] text-white shadow-md shadow-orange-950/30"
                  : "text-amber-200/80 hover:bg-amber-900/30 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-amber-400"}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Footer Quick Action */}
      <div className="p-4 border-t border-amber-900/40 space-y-2">
        {userEmail && (
          <div className="px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-900/30 flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Logado como</p>
              <p className="text-xs text-amber-100 font-medium truncate" title={userEmail}>
                {userEmail}
              </p>
            </div>
          </div>
        )}

        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-900/20 hover:bg-amber-900/40 text-xs font-bold text-amber-200 border border-amber-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#ffd21a]" />
            <span>Ver Cardápio Online</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-xs font-bold text-red-200 border border-red-900/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}
