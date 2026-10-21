"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Order, OrderStatus, Product } from "@/types/database";
import { 
  Package, 
  Boxes, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  Clock,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Flame,
  Bike,
  Check,
  X,
  ExternalLink,
  Inbox,
  Filter,
  DollarSign,
  ChevronRight,
  MessageCircle
} from "lucide-react";

// Pedidos demonstrativos caso o banco ainda não tenha registros
const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: "demo-1",
    customer_name: "Mariana Costa",
    customer_phone: "5591984034863",
    order_type: "Entrega (consultar taxa)",
    delivery_address: "Av. Principal, nº 450 - Bairro Novo (Próximo à Praça)",
    payment_method: "Pix",
    notes: "Por favor, mandar bastante guardanapo e molho de pimenta à parte.",
    items: [
      { name: "Combo 20 coxinhas", price: 8.0, qty: 1, units_count: 20 },
      { name: "Combo 10 coxinhas", price: 4.0, qty: 1, units_count: 10 }
    ],
    total_amount: 12.0,
    status: "pendente",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-2",
    customer_name: "Lucas Silva",
    customer_phone: "5591981223344",
    order_type: "Retirada no Balcão",
    delivery_address: null,
    payment_method: "Dinheiro",
    notes: "Troco para R$ 20,00",
    items: [
      { name: "Combo 25 coxinhas", price: 10.0, qty: 1, units_count: 25 }
    ],
    total_amount: 10.0,
    status: "preparando",
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-3",
    customer_name: "Carlos Eduardo",
    customer_phone: "5591999887766",
    order_type: "Entrega (consultar taxa)",
    delivery_address: "Rua das Flores, 12 - Centro",
    payment_method: "Cartão de Crédito/Débito",
    notes: "Interfone 201",
    items: [
      { name: "Combo 15 coxinhas", price: 6.0, qty: 2, units_count: 15 }
    ],
    total_amount: 12.0,
    status: "saiu_entrega",
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-4",
    customer_name: "Ana Paula Souza",
    customer_phone: "5591988776655",
    order_type: "Retirada no Balcão",
    delivery_address: null,
    payment_method: "Pix",
    notes: "",
    items: [
      { name: "Combo 5 coxinhas", price: 2.0, qty: 2, units_count: 5 }
    ],
    total_amount: 4.0,
    status: "concluido",
    created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  }
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"kanban" | "metrics">("kanban");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderFilter, setOrderFilter] = useState("");

  // Modal Novo Pedido Manual
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualType, setManualType] = useState("Retirada no Balcão");
  const [manualAddress, setManualAddress] = useState("");
  const [manualPayment, setManualPayment] = useState("Pix");
  const [manualNotes, setManualNotes] = useState("");
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProductQuantities, setSelectedProductQuantities] = useState<Record<string, number>>({});

  // Stats / Métricas
  const [stats, setStats] = useState({
    totalProducts: 5,
    activeProducts: 5,
    totalSupplies: 6,
    lowStockCount: 0,
    monthlySuppliesCost: 0,
  });
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

  // Carregar Pedidos
  async function loadOrders() {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setOrders(data);
      } else {
        // Se a tabela orders ainda não tiver dados, usa os exemplos interativos
        setOrders(INITIAL_DEMO_ORDERS);
      }
    } catch (err) {
      console.warn("Usando pedidos demonstrativos:", err);
      setOrders(INITIAL_DEMO_ORDERS);
    } finally {
      setLoadingOrders(false);
      setIsRefreshing(false);
    }
  }

  // Carregar KPIs e Produtos para o modal manual
  async function loadMetricsAndProducts() {
    try {
      const { data: products } = await supabase.from("products").select("*, categories(*)");
      if (products) {
        setAvailableProducts(products);
        setStats((prev) => ({
          ...prev,
          totalProducts: products.length,
          activeProducts: products.filter((p) => p.is_active).length,
        }));
      }

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
      console.error(err);
    }
  }

  useEffect(() => {
    loadOrders();
    loadMetricsAndProducts();

    // Auto-refresh do Kanban a cada 20 segundos
    const interval = setInterval(() => {
      loadOrders();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Mover status do pedido
  async function handleUpdateOrderStatus(orderId: string, newStatus: OrderStatus) {
    // Atualização otimista imediata na tela
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) {
        console.warn("Aviso ao persistir status no banco:", error.message);
      }
    } catch (err) {
      console.warn("Aviso na atualização do status:", err);
    }
  }

  // Criar Pedido Manual
  async function handleCreateManualOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    const items = Object.entries(selectedProductQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const prod = availableProducts.find((p) => p.id === id);
        return {
          id,
          name: prod?.name || "Produto",
          price: prod?.price || 0,
          qty,
          units_count: prod?.units_count || 1,
        };
      });

    if (items.length === 0) {
      alert("Selecione pelo menos um item para o pedido.");
      return;
    }

    const totalAmount = items.reduce((acc, item) => acc + item.price * item.qty, 0);

    const newOrder: Order = {
      id: "ord-" + Date.now(),
      customer_name: manualName.trim(),
      customer_phone: manualPhone.trim() || null,
      order_type: manualType,
      delivery_address: manualType.includes("Entrega") ? manualAddress.trim() : null,
      payment_method: manualPayment,
      notes: manualNotes.trim() || null,
      items,
      total_amount: totalAmount,
      status: "pendente",
      created_at: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);

    try {
      await supabase.from("orders").insert([
        {
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          order_type: newOrder.order_type,
          delivery_address: newOrder.delivery_address,
          payment_method: newOrder.payment_method,
          notes: newOrder.notes,
          items: newOrder.items,
          total_amount: newOrder.total_amount,
          status: "pendente",
        },
      ]);
    } catch (err) {
      console.warn("Pedido salvo localmente:", err);
    }

    setShowManualModal(false);
    setManualName("");
    setManualPhone("");
    setManualAddress("");
    setManualNotes("");
    setSelectedProductQuantities({});
  }

  // Colunas do Kanban
  const KANBAN_COLUMNS: {
    id: OrderStatus;
    title: string;
    icon: any;
    color: string;
    badgeBg: string;
    headerBorder: string;
  }[] = [
    {
      id: "pendente",
      title: "Novos Pedidos",
      icon: Inbox,
      color: "text-amber-700",
      badgeBg: "bg-amber-100 text-amber-800",
      headerBorder: "border-amber-400",
    },
    {
      id: "preparando",
      title: "Em Preparo",
      icon: Flame,
      color: "text-orange-600",
      badgeBg: "bg-orange-100 text-orange-800",
      headerBorder: "border-[#f65a00]",
    },
    {
      id: "saiu_entrega",
      title: "Pronto / Em Rota",
      icon: Bike,
      color: "text-purple-700",
      badgeBg: "bg-purple-100 text-purple-800",
      headerBorder: "border-purple-400",
    },
    {
      id: "concluido",
      title: "Finalizados",
      icon: CheckCircle2,
      color: "text-emerald-700",
      badgeBg: "bg-emerald-100 text-emerald-800",
      headerBorder: "border-emerald-500",
    },
  ];

  const filteredOrders = orders.filter((o) => {
    if (!orderFilter) return true;
    const search = orderFilter.toLowerCase();
    return (
      o.customer_name.toLowerCase().includes(search) ||
      (o.customer_phone && o.customer_phone.includes(search)) ||
      o.items.some((i) => i.name.toLowerCase().includes(search))
    );
  });

  const pendingCount = orders.filter((o) => o.status === "pendente").length;
  const preparingCount = orders.filter((o) => o.status === "preparando").length;
  const inRouteCount = orders.filter((o) => o.status === "saiu_entrega").length;

  return (
    <div>
      <Header
        title="Painel de Controle"
        subtitle="Gerenciamento de pedidos em tempo real, cardápio e estoque"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-xs font-bold text-white transition-all shadow-md shadow-orange-950/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Lançar Pedido Manual
            </button>
          </div>
        }
      />

      {/* Navegação entre Abas: Kanban vs Métricas */}
      <div className="mt-8 flex items-center justify-between border-b border-[#f2dfca] pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "kanban"
                ? "bg-[#3c2116] text-white shadow-md shadow-stone-900/10"
                : "text-[#765c50] hover:bg-white hover:text-[#3c2116]"
            }`}
          >
            <Inbox className="w-4 h-4 text-[#ffd21a]" />
            <span>Quadro Kanban de Pedidos</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#f65a00] text-white animate-pulse">
                {pendingCount} novos
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("metrics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "metrics"
                ? "bg-[#3c2116] text-white shadow-md shadow-stone-900/10"
                : "text-[#765c50] hover:bg-white hover:text-[#3c2116]"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Métricas & Estoque</span>
          </button>
        </div>

        {activeTab === "kanban" && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por cliente ou item..."
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#e8d2bd] bg-white text-stone-800 placeholder-stone-400 focus:outline-[#f65a00] w-48 sm:w-64"
              />
            </div>

            <button
              onClick={loadOrders}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white border border-[#e8d2bd] text-[#765c50] hover:text-[#f65a00] hover:bg-orange-50 transition-colors shadow-sm"
              title="Atualizar Pedidos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#f65a00]" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {/* ABA 1: QUADRO KANBAN DE PEDIDOS */}
      {activeTab === "kanban" && (
        <div className="mt-6">
          {/* Banner de resumo operacional rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-amber-50/80 border border-amber-200/70 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-800 uppercase">Aguardando Cozinha</p>
                <p className="text-xl font-black text-amber-950">{pendingCount} pedido(s)</p>
              </div>
              <Inbox className="w-6 h-6 text-amber-600 opacity-60" />
            </div>

            <div className="bg-orange-50/80 border border-orange-200/70 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-orange-800 uppercase">Fritando / Em Preparo</p>
                <p className="text-xl font-black text-orange-950">{preparingCount} pedido(s)</p>
              </div>
              <Flame className="w-6 h-6 text-[#f65a00] opacity-60" />
            </div>

            <div className="bg-purple-50/80 border border-purple-200/70 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-purple-800 uppercase">Em Rota / Pronto</p>
                <p className="text-xl font-black text-purple-950">{inRouteCount} pedido(s)</p>
              </div>
              <Bike className="w-6 h-6 text-purple-600 opacity-60" />
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/70 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-800 uppercase">Total do Dia</p>
                <p className="text-xl font-black text-emerald-950">{orders.length} pedido(s)</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 opacity-60" />
            </div>
          </div>

          {/* Colunas do Kanban */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {KANBAN_COLUMNS.map((column) => {
              const ColumnIcon = column.icon;
              const columnOrders = filteredOrders.filter((o) => o.status === column.id);
              const totalColumnValue = columnOrders.reduce((acc, curr) => acc + Number(curr.total_amount), 0);

              return (
                <div
                  key={column.id}
                  className="bg-[#f7efe6]/70 rounded-3xl border border-[#ebdccc] p-3.5 min-h-[600px] flex flex-col"
                >
                  {/* Cabeçalho da Coluna */}
                  <div className={`flex items-center justify-between pb-3 border-b-2 ${column.headerBorder} mb-3 px-1`}>
                    <div className="flex items-center gap-2">
                      <ColumnIcon className={`w-4 h-4 ${column.color}`} />
                      <h3 className="font-black text-xs uppercase tracking-wider text-[#3c2116]">
                        {column.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${column.badgeBg}`}>
                        {columnOrders.length}
                      </span>
                    </div>
                  </div>

                  {/* Subtotal da coluna */}
                  {columnOrders.length > 0 && (
                    <div className="px-1 pb-2 mb-2 text-[11px] font-bold text-stone-500 flex justify-between border-b border-[#ebdccc]/60">
                      <span>Subtotal coluna:</span>
                      <span className="font-black text-[#f65a00]">
                        {totalColumnValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  )}

                  {/* Lista de Cards da Coluna */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[720px] pr-0.5">
                    {columnOrders.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 text-xs">
                        Nenhum pedido nesta etapa.
                      </div>
                    ) : (
                      columnOrders.map((order) => {
                        const timeAgo = Math.round(
                          (Date.now() - new Date(order.created_at).getTime()) / 60000
                        );

                        return (
                          <div
                            key={order.id}
                            className="bg-white rounded-2xl border border-[#e8d9c8] p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                          >
                            {/* Card Header: Cliente & Horário */}
                            <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                              <div>
                                <h4 className="font-black text-sm text-[#3c2116] leading-tight">
                                  {order.customer_name}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  <span>
                                    {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    ({timeAgo < 1 ? "Agora" : `há ${timeAgo}m`})
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  order.order_type.includes("Entrega")
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {order.order_type.includes("Entrega") ? "🛵 Entrega" : "🏪 Balcão"}
                              </span>
                            </div>

                            {/* Telefone & WhatsApp direto */}
                            {order.customer_phone && (
                              <div className="flex items-center justify-between text-xs bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-100">
                                <span className="font-semibold text-stone-600 truncate">
                                  {order.customer_phone}
                                </span>
                                <a
                                  href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            )}

                            {/* Endereço de Entrega */}
                            {order.delivery_address && (
                              <div className="flex items-start gap-1.5 text-xs text-stone-600 bg-amber-50/60 p-2 rounded-xl border border-amber-200/50">
                                <MapPin className="w-3.5 h-3.5 text-[#f65a00] flex-shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-tight line-clamp-2">
                                  {order.delivery_address}
                                </span>
                              </div>
                            )}

                            {/* Itens do Pedido */}
                            <div className="space-y-1 py-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-stone-700">
                                  <span className="font-bold">
                                    {item.qty}x {item.name}
                                  </span>
                                  <span className="font-medium text-stone-500">
                                    {(item.price * item.qty).toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Observações */}
                            {order.notes && (
                              <div className="p-2 rounded-xl bg-orange-50/80 border border-orange-200/60 text-[11px] text-orange-900 font-medium">
                                <span className="font-bold block">Obs:</span> {order.notes}
                              </div>
                            )}

                            {/* Total & Forma de Pagamento */}
                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500">
                                <CreditCard className="w-3 h-3" />
                                <span>{order.payment_method}</span>
                              </div>
                              <span className="text-base font-black text-[#f65a00]">
                                {Number(order.total_amount).toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </div>

                            {/* Ações de Avanço do Kanban */}
                            <div className="pt-2 border-t border-stone-100 space-y-1.5">
                              {order.status === "pendente" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "preparando")}
                                  className="w-full py-2 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-orange-950/10"
                                >
                                  <Flame className="w-3.5 h-3.5" />
                                  <span>Iniciar Preparo</span>
                                </button>
                              )}

                              {order.status === "preparando" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "saiu_entrega")}
                                  className="w-full py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                >
                                  <Bike className="w-3.5 h-3.5" />
                                  <span>Pronto / Saiu para Entrega</span>
                                </button>
                              )}

                              {order.status === "saiu_entrega" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "concluido")}
                                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Marcar como Entregue</span>
                                </button>
                              )}

                              {order.status === "concluido" && (
                                <div className="text-center py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-lg flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Pedido Finalizado</span>
                                </div>
                              )}

                              {/* Ações Secundárias / Cancelar / Voltar */}
                              <div className="flex items-center justify-between text-[10px] pt-0.5 text-stone-400">
                                {order.status === "preparando" && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, "pendente")}
                                    className="hover:text-stone-700 underline"
                                  >
                                    ← Voltar para Novo
                                  </button>
                                )}
                                {order.status === "saiu_entrega" && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, "preparando")}
                                    className="hover:text-stone-700 underline"
                                  >
                                    ← Voltar para Preparo
                                  </button>
                                )}
                                {order.status !== "cancelado" && order.status !== "concluido" && (
                                  <button
                                    onClick={() => {
                                      if (confirm("Deseja realmente cancelar este pedido?")) {
                                        handleUpdateOrderStatus(order.id, "cancelado");
                                      }
                                    }}
                                    className="hover:text-red-600 ml-auto"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: MÉTRICAS & INDICADORES FINANCEIROS */}
      {activeTab === "metrics" && (
        <div className="mt-6 space-y-8">
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
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-red-600">{stats.lowStockCount}</span>
                <span className="text-xs font-semibold text-[#765c50]">precisam de reposição</span>
              </div>
              <Link
                href="/admin/insumos"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
              >
                Checar alertas <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 4: Custo do Mês em Insumos */}
            <div className="bg-white rounded-2xl border border-[#f2dfca] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#765c50] uppercase tracking-wider">Compras Insumos</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#3c2116]">
                  {stats.monthlySuppliesCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <Link
                href="/admin/insumos"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#f65a00] hover:underline"
              >
                Registrar compras <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Histórico Recente de Compras */}
          <div className="bg-white rounded-2xl border border-[#f2dfca] p-6 shadow-sm">
            <h3 className="font-black text-base text-[#3c2116] mb-4">
              Últimas Compras de Insumos Registradas
            </h3>
            {recentPurchases.length === 0 ? (
              <p className="text-xs text-stone-500 py-4">Nenhuma compra de insumo registrada ainda.</p>
            ) : (
              <div className="divide-y divide-[#f7e9dc]">
                {recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-black text-[#3c2116]">{purchase.supplies?.name || "Insumo"}</p>
                      <p className="text-stone-500 text-[11px]">
                        {purchase.quantity} {purchase.supplies?.unit_measure} · {new Date(purchase.purchase_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className="font-black text-sm text-[#f65a00]">
                      {Number(purchase.total_cost).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Lançar Pedido Manual */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#f2dfca] my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#f2dfca]">
              <h3 className="font-black text-lg text-[#3c2116]">
                Lançar Novo Pedido no Balcão
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold focus:outline-[#f65a00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    WhatsApp (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="55919..."
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold focus:outline-[#f65a00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Tipo de Pedido
                  </label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold focus:outline-[#f65a00]"
                  >
                    <option value="Retirada no Balcão">Retirada no Balcão</option>
                    <option value="Entrega (consultar taxa)">Entrega</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Pagamento
                  </label>
                  <select
                    value={manualPayment}
                    onChange={(e) => setManualPayment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold focus:outline-[#f65a00]"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito/Débito">Cartão de Crédito/Débito</option>
                  </select>
                </div>
              </div>

              {manualType.includes("Entrega") && (
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Endereço de Entrega
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número e bairro"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
              )}

              {/* Seleção de Combos */}
              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1.5">
                  Itens do Pedido
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-[#f2dfca] p-3 rounded-2xl bg-[#fffdf9]">
                  {availableProducts.map((prod) => {
                    const currentQty = selectedProductQuantities[prod.id] || 0;
                    return (
                      <div key={prod.id} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#3c2116] truncate max-w-[200px]">
                          {prod.name} (R$ {Number(prod.price).toFixed(2)})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProductQuantities((prev) => ({
                                ...prev,
                                [prod.id]: Math.max(0, currentQty - 1),
                              }))
                            }
                            className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 font-bold"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-black">{currentQty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProductQuantities((prev) => ({
                                ...prev,
                                [prod.id]: currentQty + 1,
                              }))
                            }
                            className="w-6 h-6 rounded-lg bg-[#f65a00] text-white font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  placeholder="Sem cebola, troco, etc..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-white text-xs font-bold shadow-md shadow-orange-950/20"
                >
                  Adicionar ao Kanban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
