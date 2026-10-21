"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  DollarSign,
  Calendar,
  CheckCircle2
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 5,
    activeProducts: 5,
    totalSupplies: 6,
    lowStockCount: 0,
    monthlySuppliesCost: 0,
  });
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        // Products count
        const { data: products } = await supabase.from("products").select("id, is_active");
        if (products) {
          setStats((prev) => ({
            ...prev,
            totalProducts: products.length,
            activeProducts: products.filter((p) => p.is_active).length,
          }));
        }

        // Supplies
        const { data: supplies } = await supabase.from("supplies").select("*");
        if (supplies) {
          const lowStock = supplies.filter(
            (s) => Number(s.current_stock) <= Number(s.min_stock_alert)
          ).length;
          setStats((prev) => ({
            ...prev,
            totalSupplies: supplies.length,
            lowStockCount: lowStock,
          }));
        }

        // Recent purchases
        const { data: purchases } = await supabase
          .from("supply_purchases")
          .select("*, supplies(name, unit_measure)")
          .order("purchase_date", { ascending: false })
          .limit(5);

        if (purchases && purchases.length > 0) {
          setRecentPurchases(purchases);
          const totalCost = purchases.reduce((acc, curr) => acc + Number(curr.total_cost || 0), 0);
          setStats((prev) => ({ ...prev, monthlySuppliesCost: totalCost }));
        }
      } catch (err) {
        console.error("Erro ao carregar dados do painel:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div>
      <Header
        title="Painel de Controle"
        subtitle="Visão geral do cardápio, insumos e custos da Help Point"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/insumos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#f2dfca] text-xs font-bold text-[#3c2116] hover:bg-[#fff2e5] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#f65a00]" />
              Nova Compra de Insumo
            </Link>
            <Link
              href="/admin/produtos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-xs font-bold text-white transition-all shadow-md shadow-orange-950/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Produto
            </Link>
          </div>
        }
      />

      <div className="mt-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Produtos Ativos */}
          <div className="bg-white rounded-2xl border border-[#f2dfca] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#765c50] uppercase tracking-wider">Produtos Ativos</span>
              <div className="w-9 h-9 rounded-xl bg-[#fff2e5] flex items-center justify-center text-[#f65a00]">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#3c2116]">{stats.activeProducts}</span>
              <span className="text-xs font-semibold text-[#765c50]">/ {stats.totalProducts} cadastrados</span>
            </div>
            <Link
              href="/admin/produtos"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#f65a00] hover:underline"
            >
              Gerenciar produtos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 2: Insumos Monitorados */}
          <div className="bg-white rounded-2xl border border-[#f2dfca] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#765c50] uppercase tracking-wider">Insumos Base</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#3c2116]">{stats.totalSupplies}</span>
              <span className="text-xs font-semibold text-[#765c50]">itens em estoque</span>
            </div>
            <Link
              href="/admin/insumos"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#f65a00] hover:underline"
            >
              Ver estoque de insumos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 3: Alertas de Estoque */}
          <div className="bg-white rounded-2xl border border-[#f2dfca] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#765c50] uppercase tracking-wider">Estoque Baixo</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stats.lowStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {stats.lowStockCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-3xl font-black ${stats.lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {stats.lowStockCount}
              </span>
              <span className="text-xs font-semibold text-[#765c50]">precisam de reposição</span>
            </div>
            <Link
              href="/admin/insumos"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#f65a00] hover:underline"
            >
              Registrar compra de lote <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 4: Investimento em Insumos */}
          <div className="bg-white rounded-2xl border border-[#f2dfca] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#765c50] uppercase tracking-wider">Compras Recentes</span>
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#3c2116]">
                {stats.monthlySuppliesCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <Link
              href="/admin/insumos"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#f65a00] hover:underline"
            >
              Filtrar por período <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Section: Ações Rápidas & Histórico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Histórico Recente de Compras de Insumos */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#f2dfca] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#f5e3d0]">
              <div>
                <h3 className="font-extrabold text-base text-[#3c2116]">Últimas Compras de Insumos</h3>
                <p className="text-xs text-[#765c50]">Registro de lotes e custos por período</p>
              </div>
              <Link
                href="/admin/insumos"
                className="text-xs font-bold text-[#f65a00] hover:underline"
              >
                Ver histórico completo
              </Link>
            </div>

            <div className="mt-4">
              {recentPurchases.length === 0 ? (
                <div className="text-center py-10 px-4 bg-[#fffaf2] rounded-xl border border-dashed border-[#e6cdb4]">
                  <Boxes className="w-10 h-10 text-[#a8826b] mx-auto mb-2 opacity-60" />
                  <p className="font-bold text-sm text-[#3c2116]">Nenhuma compra registrada ainda</p>
                  <p className="text-xs text-[#765c50] mt-1 max-w-sm mx-auto">
                    Registre a compra de frango, farinha, óleo ou embalagens para acompanhar custos e o estoque.
                  </p>
                  <Link
                    href="/admin/insumos"
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f65a00] text-white text-xs font-bold hover:bg-[#e04e00]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Registrar primeira compra
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#f2dfca] text-[#765c50] font-bold">
                        <th className="py-2.5">Insumo</th>
                        <th className="py-2.5">Data</th>
                        <th className="py-2.5">Quantidade</th>
                        <th className="py-2.5">Total Pago</th>
                        <th className="py-2.5">Custo Unitário</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f9ece0]">
                      {recentPurchases.map((p) => (
                        <tr key={p.id} className="hover:bg-[#fff9f3]">
                          <td className="py-3 font-bold text-[#3c2116]">{p.supplies?.name || "Insumo"}</td>
                          <td className="py-3 text-[#765c50]">{new Date(p.purchase_date).toLocaleDateString('pt-BR')}</td>
                          <td className="py-3 font-semibold">{p.quantity} {p.supplies?.unit_measure}</td>
                          <td className="py-3 font-bold text-[#f65a00]">
                            {Number(p.total_cost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="py-3 text-[#765c50]">
                            {Number(p.unit_cost || (p.total_cost / p.quantity)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{p.supplies?.unit_measure}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts & Integrations status */}
          <div className="bg-white rounded-2xl border border-[#f2dfca] p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-base text-[#3c2116]">Status das Integrações</h3>
            <p className="text-xs text-[#765c50]">Serviços conectados ao Help Point</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#fffaf2] border border-[#f2dfca]">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">💬</span>
                  <div>
                    <h4 className="font-bold text-xs text-[#3c2116]">WhatsApp de Pedidos</h4>
                    <p className="text-[11px] text-[#765c50]">5591984034863</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Ativo
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#fffaf2] border border-[#f2dfca]">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⚡</span>
                  <div>
                    <h4 className="font-bold text-xs text-[#3c2116]">Supabase Database</h4>
                    <p className="text-[11px] text-[#765c50]">PostgreSQL + RLS</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Conectado
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#fffaf2] border border-[#f2dfca]">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">💳</span>
                  <div>
                    <h4 className="font-bold text-xs text-[#3c2116]">Gateway Pix / Pagamento</h4>
                    <p className="text-[11px] text-[#765c50]">Mercado Pago / Outros</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Configurar
                </span>
              </div>
            </div>

            <Link
              href="/admin/integracoes"
              className="block text-center w-full py-2.5 rounded-xl border border-[#f2dfca] bg-[#fffaf2] hover:bg-[#fff2e5] text-xs font-bold text-[#f65a00] transition-colors"
            >
              Gerenciar Chaves & Webhooks →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
