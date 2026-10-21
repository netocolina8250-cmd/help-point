"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Supply, SupplyPurchase } from "@/types/database";
import { 
  Boxes, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  X,
  ArrowDownUp
} from "lucide-react";

export default function InsumosPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [purchases, setPurchases] = useState<SupplyPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"purchases" | "stock">("purchases");

  // Filter state for period
  const [periodFilter, setPeriodFilter] = useState<"all" | "month" | "30days">("month");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);

  // Form state for Purchase
  const [purchaseForm, setPurchaseForm] = useState({
    supply_id: "",
    purchase_date: new Date().toISOString().split("T")[0],
    supplier_name: "",
    quantity: "",
    total_cost: "",
    expiration_date: "",
    invoice_number: "",
    notes: "",
  });

  // Form state for Supply
  const [supplyForm, setSupplyForm] = useState({
    name: "",
    unit_measure: "kg",
    min_stock_alert: "5",
    current_stock: "0",
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      // Fetch supplies
      const { data: sData, error: sErr } = await supabase
        .from("supplies")
        .select("*")
        .order("name", { ascending: true });

      if (sData) setSupplies(sData);

      // Fetch purchases
      const { data: pData, error: pErr } = await supabase
        .from("supply_purchases")
        .select("*, supplies(id, name, unit_measure)")
        .order("purchase_date", { ascending: false });

      if (pData) setPurchases(pData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter purchases by period and search term
  const filteredPurchases = purchases.filter((p) => {
    // Search
    const supplyName = (p.supplies?.name || "").toLowerCase();
    const matchesSearch = supplyName.includes(searchTerm.toLowerCase()) || 
                          (p.invoice_number || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Period
    if (periodFilter === "all") return true;
    const purchaseDate = new Date(p.purchase_date);
    const now = new Date();

    if (periodFilter === "month") {
      return (
        purchaseDate.getMonth() === now.getMonth() &&
        purchaseDate.getFullYear() === now.getFullYear()
      );
    }

    if (periodFilter === "30days") {
      const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }

    return true;
  });

  // Filter supplies by search
  const filteredSupplies = supplies.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPeriodInvested = filteredPurchases.reduce(
    (acc, curr) => acc + Number(curr.total_cost || 0),
    0
  );

  // Handle Save Purchase
  async function handleSavePurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!purchaseForm.supply_id || !purchaseForm.quantity || !purchaseForm.total_cost) {
      alert("Por favor, preencha os campos obrigatórios (Insumo, Quantidade e Total Pago).");
      return;
    }

    try {
      setSaving(true);
      const qty = parseFloat(purchaseForm.quantity);
      const total = parseFloat(purchaseForm.total_cost);

      const { error } = await supabase.from("supply_purchases").insert([
        {
          supply_id: purchaseForm.supply_id,
          purchase_date: purchaseForm.purchase_date,
          quantity: qty,
          total_cost: total,
          expiration_date: purchaseForm.expiration_date || null,
          invoice_number: purchaseForm.invoice_number || null,
          notes: purchaseForm.notes || null,
        },
      ]);

      if (error) throw error;

      setShowPurchaseModal(false);
      setPurchaseForm({
        supply_id: "",
        purchase_date: new Date().toISOString().split("T")[0],
        supplier_name: "",
        quantity: "",
        total_cost: "",
        expiration_date: "",
        invoice_number: "",
        notes: "",
      });
      await loadData();
    } catch (err: any) {
      alert("Erro ao salvar compra: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  // Handle Save New Supply
  async function handleSaveSupply(e: React.FormEvent) {
    e.preventDefault();
    if (!supplyForm.name) {
      alert("Informe o nome do insumo.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("supplies").insert([
        {
          name: supplyForm.name,
          unit_measure: supplyForm.unit_measure,
          min_stock_alert: parseFloat(supplyForm.min_stock_alert) || 0,
          current_stock: parseFloat(supplyForm.current_stock) || 0,
          notes: supplyForm.notes || null,
        },
      ]);

      if (error) throw error;

      setShowSupplyModal(false);
      setSupplyForm({
        name: "",
        unit_measure: "kg",
        min_stock_alert: "5",
        current_stock: "0",
        notes: "",
      });
      await loadData();
    } catch (err: any) {
      alert("Erro ao criar insumo: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Header
        title="Insumos & Compras"
        subtitle="Gerencie matérias-primas e acompanhe compras por período para controlar custos"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSupplyModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#f2dfca] text-xs font-bold text-[#3c2116] hover:bg-[#fff2e5] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#f65a00]" />
              Novo Insumo Base
            </button>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-xs font-bold text-white transition-all shadow-md shadow-orange-950/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Compra por Período
            </button>
          </div>
        }
      />

      {/* Tabs and KPI summary */}
      <div className="mt-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-[#f2dfca] p-5 shadow-sm">
            <span className="text-xs font-bold text-[#765c50] uppercase tracking-wider">
              Total Investido no Período
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#f65a00]">
                {totalPeriodInvested.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
            <p className="text-xs text-[#765c50] mt-1">
              {filteredPurchases.length} compra(s) registrada(s)
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#f2dfca] p-5 shadow-sm">
            <span className="text-xs font-bold text-[#765c50] uppercase tracking-wider">
              Insumos Cadastrados
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#3c2116]">
                {supplies.length}
              </span>
              <span className="text-xs text-[#765c50]">ingredientes e embalagens</span>
            </div>
            <p className="text-xs text-[#765c50] mt-1">Frango, farinha, óleo, caixas, etc.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#f2dfca] p-5 shadow-sm">
            <span className="text-xs font-bold text-[#765c50] uppercase tracking-wider">
              Status do Estoque
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">
                {supplies.filter((s) => Number(s.current_stock) > Number(s.min_stock_alert)).length}
              </span>
              <span className="text-xs text-[#765c50]">normais / </span>
              <span className="text-xl font-black text-rose-600">
                {supplies.filter((s) => Number(s.current_stock) <= Number(s.min_stock_alert)).length}
              </span>
              <span className="text-xs text-[#765c50]">críticos</span>
            </div>
            <p className="text-xs text-[#765c50] mt-1">Alerta quando atinge estoque mínimo</p>
          </div>
        </div>

        {/* View Switcher and Filters */}
        <div className="bg-white rounded-2xl border border-[#f2dfca] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tab buttons */}
          <div className="flex bg-[#fff7ee] p-1 rounded-xl border border-[#f2dfca] w-full md:w-auto">
            <button
              onClick={() => setTab("purchases")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === "purchases"
                  ? "bg-[#f65a00] text-white shadow-sm"
                  : "text-[#765c50] hover:text-[#3c2116]"
              }`}
            >
              Histórico de Compras por Período
            </button>
            <button
              onClick={() => setTab("stock")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                tab === "stock"
                  ? "bg-[#f65a00] text-white shadow-sm"
                  : "text-[#765c50] hover:text-[#3c2116]"
              }`}
            >
              Estoque Atual de Insumos
            </button>
          </div>

          {/* Search and Period Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-[#765c50] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar insumo ou nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#e8d2bd] bg-[#fffdf9] focus:outline-[#f65a00]"
              />
            </div>

            {tab === "purchases" && (
              <select
                value={periodFilter}
                onChange={(e: any) => setPeriodFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-[#e8d2bd] bg-[#fffdf9] font-bold text-[#3c2116] focus:outline-[#f65a00]"
              >
                <option value="month">Este Mês</option>
                <option value="30days">Últimos 30 Dias</option>
                <option value="all">Todas as Compras</option>
              </select>
            )}
          </div>
        </div>

        {/* Content Tab 1: Compras por Período */}
        {tab === "purchases" && (
          <div className="bg-white rounded-2xl border border-[#f2dfca] overflow-hidden shadow-sm">
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-14 px-4">
                <Boxes className="w-12 h-12 text-[#a8826b] mx-auto mb-3 opacity-60" />
                <h4 className="font-extrabold text-base text-[#3c2116]">
                  Nenhum registro de compra encontrado
                </h4>
                <p className="text-xs text-[#765c50] mt-1 max-w-sm mx-auto">
                  Clique no botão &quot;Registrar Compra por Período&quot; para dar entrada nas matérias-primas e atualizar seu custo.
                </p>
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f65a00] text-white text-xs font-bold hover:bg-[#e04e00]"
                >
                  <Plus className="w-3.5 h-3.5" /> Registrar Compra
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#fff7ee] border-b border-[#f2dfca] text-[#765c50] font-black uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-5">Data da Compra</th>
                      <th className="py-3.5 px-5">Insumo</th>
                      <th className="py-3.5 px-5">Quantidade</th>
                      <th className="py-3.5 px-5">Valor Total Pago</th>
                      <th className="py-3.5 px-5">Custo Unitário</th>
                      <th className="py-3.5 px-5">Validade do Lote</th>
                      <th className="py-3.5 px-5">Nota Fiscal / Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f9ece0]">
                    {filteredPurchases.map((purchase) => {
                      const unitCost =
                        purchase.unit_cost ||
                        (purchase.quantity > 0
                          ? purchase.total_cost / purchase.quantity
                          : 0);

                      return (
                        <tr key={purchase.id} className="hover:bg-[#fff9f3] transition-colors">
                          <td className="py-3.5 px-5 font-bold text-[#3c2116]">
                            {new Date(purchase.purchase_date).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3.5 px-5 font-black text-sm text-[#3c2116]">
                            {purchase.supplies?.name || "Insumo"}
                          </td>
                          <td className="py-3.5 px-5 font-semibold text-[#3c2116]">
                            {purchase.quantity} {purchase.supplies?.unit_measure}
                          </td>
                          <td className="py-3.5 px-5 font-black text-sm text-[#f65a00]">
                            {Number(purchase.total_cost).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-[#765c50]">
                            {Number(unitCost).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                            /{purchase.supplies?.unit_measure}
                          </td>
                          <td className="py-3.5 px-5 text-[#765c50]">
                            {purchase.expiration_date
                              ? new Date(purchase.expiration_date).toLocaleDateString("pt-BR")
                              : "—"}
                          </td>
                          <td className="py-3.5 px-5 text-[#765c50]">
                            {purchase.invoice_number || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Content Tab 2: Estoque Atual */}
        {tab === "stock" && (
          <div className="bg-white rounded-2xl border border-[#f2dfca] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#fff7ee] border-b border-[#f2dfca] text-[#765c50] font-black uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-5">Nome do Insumo</th>
                    <th className="py-3.5 px-5">Unidade de Medida</th>
                    <th className="py-3.5 px-5">Estoque Atual</th>
                    <th className="py-3.5 px-5">Estoque Mínimo</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f9ece0]">
                  {filteredSupplies.map((supply) => {
                    const isLow = Number(supply.current_stock) <= Number(supply.min_stock_alert);

                    return (
                      <tr key={supply.id} className="hover:bg-[#fff9f3] transition-colors">
                        <td className="py-3.5 px-5 font-black text-sm text-[#3c2116]">
                          {supply.name}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-[#765c50] uppercase">
                          {supply.unit_measure}
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-base text-[#3c2116]">
                          {supply.current_stock} {supply.unit_measure}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-[#765c50]">
                          {supply.min_stock_alert} {supply.unit_measure}
                        </td>
                        <td className="py-3.5 px-5">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Repor Estoque
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Adequado
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => {
                              setPurchaseForm((prev) => ({ ...prev, supply_id: supply.id }));
                              setShowPurchaseModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#fff2e5] hover:bg-[#ffe3cc] text-[#f65a00] font-bold text-xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Comprar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Registrar Compra de Insumo por Período */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#f2dfca] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPurchaseModal(false)}
              className="absolute right-5 top-5 p-1 rounded-lg text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#fff2e5] flex items-center justify-center text-[#f65a00]">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#3c2116]">
                  Registrar Compra por Período
                </h3>
                <p className="text-xs text-[#765c50]">
                  Entrada de lote, custo e cálculo unitário automático
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Insumo Comprado *
                </label>
                <select
                  required
                  value={purchaseForm.supply_id}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({ ...prev, supply_id: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold focus:outline-[#f65a00]"
                >
                  <option value="">Selecione o insumo...</option>
                  {supplies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.unit_measure})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Data da Compra *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.purchase_date}
                    onChange={(e) =>
                      setPurchaseForm((prev) => ({ ...prev, purchase_date: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Validade do Lote (Opcional)
                  </label>
                  <input
                    type="date"
                    value={purchaseForm.expiration_date}
                    onChange={(e) =>
                      setPurchaseForm((prev) => ({
                        ...prev,
                        expiration_date: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Quantidade Comprada *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 10"
                    value={purchaseForm.quantity}
                    onChange={(e) =>
                      setPurchaseForm((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Valor Total Pago (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 150.00"
                    value={purchaseForm.total_cost}
                    onChange={(e) =>
                      setPurchaseForm((prev) => ({ ...prev, total_cost: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
              </div>

              {/* Calculated preview */}
              {Number(purchaseForm.quantity) > 0 && Number(purchaseForm.total_cost) > 0 && (
                <div className="p-3 rounded-xl bg-[#fff7ee] border border-[#f5e3d0] text-xs flex justify-between items-center">
                  <span className="font-bold text-[#765c50]">Custo unitário calculado:</span>
                  <span className="font-black text-sm text-[#f65a00]">
                    {(
                      parseFloat(purchaseForm.total_cost) /
                      parseFloat(purchaseForm.quantity)
                    ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Nota Fiscal / Nº Pedido
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF-12948 ou Atacadão"
                  value={purchaseForm.invoice_number}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({
                      ...prev,
                      invoice_number: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes da marca, fornecedor ou observação..."
                  value={purchaseForm.notes}
                  onChange={(e) =>
                    setPurchaseForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#765c50] hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-white text-xs font-bold shadow-md shadow-orange-950/20 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Insumo Base */}
      {showSupplyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#f2dfca] relative">
            <button
              onClick={() => setShowSupplyModal(false)}
              className="absolute right-5 top-5 p-1 rounded-lg text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#3c2116]">
                  Novo Insumo Base
                </h3>
                <p className="text-xs text-[#765c50]">
                  Cadastre ingredientes ou embalagens para monitorar
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSupply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Nome do Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Queijo Catupiry, Massa Coxinha..."
                  value={supplyForm.name}
                  onChange={(e) =>
                    setSupplyForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Unidade de Medida *
                  </label>
                  <select
                    value={supplyForm.unit_measure}
                    onChange={(e) =>
                      setSupplyForm((prev) => ({
                        ...prev,
                        unit_measure: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold focus:outline-[#f65a00]"
                  >
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="l">Litro (l)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="un">Unidade (un)</option>
                    <option value="pacote">Pacote</option>
                    <option value="caixa">Caixa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Alerta de Estoque Mín.
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 5"
                    value={supplyForm.min_stock_alert}
                    onChange={(e) =>
                      setSupplyForm((prev) => ({
                        ...prev,
                        min_stock_alert: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Estoque Inicial (Opcional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 10"
                  value={supplyForm.current_stock}
                  onChange={(e) =>
                    setSupplyForm((prev) => ({
                      ...prev,
                      current_stock: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSupplyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#765c50] hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-white text-xs font-bold shadow-md shadow-orange-950/20 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Criar Insumo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
