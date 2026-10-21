"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Product, Category } from "@/types/database";
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Send, 
  Clock, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  X
} from "lucide-react";

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  
  // Order form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState("Retirada no Balcão");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [notes, setNotes] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5591984034863"
  );

  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<{
    isOpen: boolean;
    orderData?: any;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (catData) setCategories(catData);

        const { data: prodData } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (prodData) setProducts(prodData);

        const { data: storeSettings } = await supabase
          .from("store_settings")
          .select("*")
          .maybeSingle();

        if (storeSettings?.whatsapp_number) {
          setWhatsappNumber(storeSettings.whatsapp_number);
        }
      } catch (err) {
        console.error("Erro ao carregar cardápio:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function updateQty(id: string, delta: number) {
    setCart((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  }

  // Calculate totals
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const prod = products.find((p) => p.id === id);
      return prod ? { ...prod, qty } : null;
    })
    .filter(Boolean) as (Product & { qty: number })[];

  const totalAmount = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Fallback para envio manual caso o cliente prefira ou a API esteja offline
  function fallbackToManualWhatsapp() {
    const lines = cartItems.map(
      (item) =>
        `• ${item.name}: ${item.qty} combo(s) (${(item.units_count || 1) * item.qty} un) — ${item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
    );

    let message = `🍗 *NOVO PEDIDO — HELP POINT*\n\n`;
    message += `*Cliente:* ${customerName.trim()}\n`;
    if (customerPhone.trim()) {
      message += `*Telefone:* ${customerPhone.trim()}\n`;
    }
    message += `*Tipo:* ${orderType}\n`;
    if (orderType.includes("Entrega") && address.trim()) {
      message += `*Endereço:* ${address.trim()}\n`;
    }
    message += `*Forma de Pagamento:* ${paymentMethod}\n\n`;
    message += `*ITENS DO PEDIDO:*\n${lines.join("\n")}\n\n`;
    message += `*TOTAL ESTIMADO:* ${totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n`;
    if (notes.trim()) {
      message += `\n*Observações:* ${notes.trim()}\n`;
    }
    message += `\nOlá! Gostaria de confirmar meu pedido.`;

    const encoded = encodeURIComponent(message);
    const targetUrl = `https://wa.me/${whatsappNumber}?text=${encoded}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  async function handleSendOrder() {
    if (!customerName.trim()) {
      alert("Por favor, digite seu nome para identificação do pedido.");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Por favor, informe seu WhatsApp para que possamos confirmar o pedido.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Selecione pelo menos um combo para montar seu pedido.");
      return;
    }

    try {
      setIsSendingOrder(true);

      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        address: address.trim(),
        paymentMethod,
        notes: notes.trim(),
        items: cartItems.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          units_count: i.units_count,
        })),
        totalAmount,
      };

      const res = await fetch("/api/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Pedido disparado com sucesso via API Comversa!
        setOrderSuccessModal({
          isOpen: true,
          orderData: {
            customerName: customerName.trim(),
            totalAmount,
            customerNotified: data.customerNotified,
          },
        });
        // Limpa carrinho
        setCart({});
        setNotes("");
      } else {
        // Fallback para envio manual no WhatsApp se houver erro
        const confirmManual = confirm(
          "Não foi possível transmitir o pedido automaticamente via API (" +
            (data.error || "instabilidade") +
            "). Deseja abrir o WhatsApp diretamente para enviar?"
        );
        if (confirmManual) {
          fallbackToManualWhatsapp();
        }
      }
    } catch (err: any) {
      console.error("Erro no envio:", err);
      const confirmManual = confirm(
        "Houve uma oscilação na conexão. Deseja abrir o WhatsApp para enviar o pedido?"
      );
      if (confirmManual) {
        fallbackToManualWhatsapp();
      }
    } finally {
      setIsSendingOrder(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf2] text-[#3c2116] flex flex-col justify-between selection:bg-[#f65a00] selection:text-white">
      {/* Top Banner / Navbar */}
      <header className="bg-gradient-to-r from-[#f34d00] to-[#ff7900] text-white py-6 px-6 relative overflow-hidden shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#f65a00] flex items-center justify-center font-black text-2xl shadow-md">
              🍗
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                Help Point Coxinhas & Cia.
              </h1>
              <p className="text-xs text-amber-100 font-medium mt-1 flex items-center gap-1">
                <span>Coxinhas fritas na hora, quentinhas e crocantes</span>
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 text-amber-200" />
              <span>Seg à Sáb: 16h às 22h</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Phone className="w-3.5 h-3.5 text-amber-200" />
              <span>(91) 98403-4863</span>
            </div>
          </div>
        </div>

        {/* Hero Card */}
        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-yellow-400 text-[#5a2100] font-black text-[11px] uppercase tracking-wider shadow-sm">
              🔥 Cardápio Online & Pedidos Rápidos
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Monte seu pedido e receba quentinho
            </h2>
            <p className="text-xs text-amber-100/90 max-w-xl">
              Selecione a quantidade de coxinhas, informe seus dados e o pedido é transmitido automaticamente para a nossa cozinha!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-2xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ffd21a] flex items-center justify-center text-3xl font-black text-[#632500]">
                ⚡
              </div>
              <div>
                <p className="text-xs text-amber-200 font-bold uppercase tracking-wider">Combos a partir de</p>
                <p className="text-2xl font-black text-white">R$ 2,00</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-1">
        {/* Menu Section */}
        <section className="mb-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-[#b83c00] tracking-tight">
                Escolha seus Combos 🍗
              </h3>
              <p className="text-xs text-[#765c50] mt-1">
                Clique nos botões + e − para selecionar a quantidade desejada
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const qty = cart[product.id] || 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-[#f2dfca] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {product.image_url && (
                    <div className="w-full h-44 overflow-hidden bg-amber-50 relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#f65a00] bg-[#fff2e5] px-2.5 py-1 rounded-lg">
                        {product.unit_type === "combo"
                          ? `${product.units_count} coxinhas`
                          : product.unit_type}
                      </span>
                      {product.is_featured && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          ⭐ Mais Pedido
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-black text-[#3c2116] mt-3">
                      {product.name}
                    </h4>
                    <p className="text-xs text-[#765c50] mt-1.5 line-clamp-2">
                      {product.description || "Deliciosas coxinhas quentinhas e douradas."}
                    </p>
                  </div>

                  <div className="p-6 pt-0 flex items-center justify-between border-t border-[#f9ece0] mt-4 pt-4">
                    <div>
                      <span className="text-[10px] font-bold text-[#765c50] block uppercase">
                        Valor
                      </span>
                      <span className="text-2xl font-black text-[#f65a00]">
                        {Number(product.price).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>

                    {/* Qty Selector */}
                    <div className="flex items-center gap-2 bg-[#fff7ef] p-1.5 rounded-2xl border border-[#f2dfca]">
                      <button
                        onClick={() => updateQty(product.id, -1)}
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-xl bg-white text-[#765c50] hover:text-[#f65a00] hover:bg-[#fff2e5] disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center font-black shadow-sm transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-black text-sm text-[#3c2116]">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQty(product.id, 1)}
                        className="w-8 h-8 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-white flex items-center justify-center font-black shadow-md shadow-orange-950/20 transition-all hover:scale-105"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Checkout Form Section */}
        <section id="checkout" className="mt-12">
          <div className="mb-6">
            <h3 className="text-2xl font-black text-[#b83c00] tracking-tight">
              Finalizar seu Pedido 🛍️
            </h3>
            <p className="text-xs text-[#765c50] mt-1">
              Informe seus dados para a cozinha receber e preparar o seu pedido
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Inputs */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#f2dfca] p-6 sm:p-8 shadow-sm space-y-5">
              <h4 className="font-black text-base text-[#3c2116] border-b border-[#f5e3d0] pb-3">
                1. Seus Dados de Contato & Entrega
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Como podemos te chamar?"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Seu WhatsApp (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(91) 98403-4863"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Forma de Recebimento
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold text-[#3c2116] focus:outline-[#f65a00]"
                >
                  <option value="Retirada no Balcão">Retirada no Balcão</option>
                  <option value="Entrega (consultar taxa)">Entrega (consultar taxa)</option>
                </select>
              </div>

              {orderType.includes("Entrega") && (
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Endereço de Entrega *
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro e ponto de referência"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold text-[#3c2116] focus:outline-[#f65a00]"
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito/Débito">Cartão de Crédito/Débito</option>
                  <option value="A combinar">A combinar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3c2116] mb-1">
                  Observações do Pedido (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Horário desejado, troco para quanto, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-semibold focus:outline-[#f65a00]"
                />
              </div>
            </div>

            {/* Cart Summary & Order CTA */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#f2dfca] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-black text-base text-[#3c2116] border-b border-[#f5e3d0] pb-3 flex items-center justify-between">
                  <span>2. Resumo do Pedido</span>
                  <span className="text-xs font-bold text-[#f65a00] bg-[#fff2e5] px-2.5 py-0.5 rounded-full">
                    {cartItems.length} item(s)
                  </span>
                </h4>

                <div className="mt-4 divide-y divide-[#f9ece0] max-h-60 overflow-y-auto pr-1">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8 text-[#765c50] text-xs">
                      Nenhum combo selecionado ainda.
                      <p className="mt-1 font-bold">Use os botões + no cardápio acima.</p>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-black text-[#3c2116]">{item.name}</p>
                          <p className="text-[11px] text-[#765c50]">
                            {item.qty}x · {(item.units_count || 1) * item.qty} unidades
                          </p>
                        </div>
                        <span className="font-black text-sm text-[#f65a00]">
                          {(item.price * item.qty).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#f5e3d0] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#765c50] uppercase">
                    Total Estimado
                  </span>
                  <span className="text-2xl font-black text-[#f65a00]">
                    {totalAmount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSendOrder}
                  disabled={cartItems.length === 0 || isSendingOrder}
                  className="w-full py-4 rounded-2xl bg-[#20b95b] hover:bg-[#1bb053] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.01]"
                >
                  {isSendingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Transmitindo para a Cozinha...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Confirmar e Enviar Pedido</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[#765c50] text-center leading-relaxed">
                  O pedido é transmitido automaticamente via API para o WhatsApp da Help Point!
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de Pedido Confirmado com Sucesso */}
      {orderSuccessModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center animate-in fade-in zoom-in duration-200 relative">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl mb-4 shadow-inner">
              🍗
            </div>
            <h3 className="text-xl font-black text-[#3c2116]">
              Pedido Confirmado com Sucesso!
            </h3>
            <p className="text-xs text-[#765c50] mt-1.5 leading-relaxed">
              Seu pedido já foi transmitido para a cozinha da Help Point via WhatsApp e nossa equipe já está cuidando de tudo!
            </p>

            <div className="my-5 p-4 rounded-2xl bg-[#fffaf2] border border-[#f2dfca] text-left space-y-1.5 text-xs">
              <p className="text-stone-600 font-semibold">
                Cliente: <span className="font-bold text-[#3c2116]">{orderSuccessModal.orderData?.customerName}</span>
              </p>
              <p className="text-stone-600 font-semibold">
                Total: <span className="font-black text-[#f65a00] text-sm">
                  {Number(orderSuccessModal.orderData?.totalAmount).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </p>
              {orderSuccessModal.orderData?.customerNotified && (
                <p className="text-[11px] text-emerald-700 font-bold pt-1.5 border-t border-[#f2dfca]/60">
                  ✓ Enviamos uma confirmação para o seu WhatsApp também!
                </p>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setOrderSuccessModal(null)}
                className="w-full py-3.5 rounded-xl bg-[#f65a00] hover:bg-[#e04e00] text-white font-bold text-xs shadow-md shadow-orange-950/20 transition-all"
              >
                Fazer Novo Pedido
              </button>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 rounded-xl text-stone-500 hover:text-[#20b95b] font-bold text-xs transition-colors"
              >
                Dúvidas? Conversar no WhatsApp da Loja
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#3b1c0d] text-[#ffe8d3] py-8 px-6 mt-16 text-center text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="font-black text-sm text-[#ffd21a]">HELP POINT — COXINHAS & CIA.</p>
            <p className="text-xs text-amber-200/70 mt-0.5">Sua fome pede Help! Pedidos diretos pelo WhatsApp.</p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-xs font-bold text-[#ffd21a] hover:underline flex items-center gap-1"
            >
              <span>Acessar Painel de Gerenciamento</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
