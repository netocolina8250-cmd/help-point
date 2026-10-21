"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CircleDot, Database, Sparkles } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from("categories").select("count", { count: "exact", head: true });
        setDbConnected(!error);
      } catch {
        setDbConnected(false);
      }
    }
    checkConnection();
  }, []);

  return (
    <header className="bg-white border-b border-[#f2dfca] px-8 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm shadow-[#6d2b0008]">
      <div>
        <h2 className="text-2xl font-black text-[#3c2116] tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-[#765c50] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Supabase status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fff7ee] border border-[#f5e3d0] text-xs font-semibold text-[#765c50]">
          <Database className="w-3.5 h-3.5 text-[#f65a00]" />
          <span>Supabase:</span>
          {dbConnected === null ? (
            <span className="text-amber-600 animate-pulse">Conectando...</span>
          ) : dbConnected ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700 font-bold" title="Rode o script SQL no Supabase para criar as tabelas">
              <CircleDot className="w-2.5 h-2.5 text-amber-500" />
              Aguardando tabelas
            </span>
          )}
        </div>

        {action}
      </div>
    </header>
  );
}
