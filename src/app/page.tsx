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
  ArrowRight
} from "lucide-react";

export default function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  
  // Order form state
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState("Retirada");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [notes, setNotes] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5591984034863"
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch categories
        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .order("order_index", { ascending: true });

        if (catData) setCategories(catData);

        // Fetch active products
        const { data: prodData } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (prodData && prodData.length > 0) {
          setProducts(prodData);
        } else {
          // Fallback initial products if table is empty
          setProducts([
            { id: "c5", name: "Combo 5 coxinhas", price: 2.0, units_count: 5, unit_type: "combo", description: "Uma porção crocante para matar a vontade.", is_active: true, is_featured: false, order_index: 1, created_at: "" },
            { id: "c10", name: "Combo 10 coxinhas", price: 4.0, units_count: 10, unit_type: "combo", description: "Ideal para dividir com alguém especial.", is_active: true, is_featured: false, order_index: 2, created_at: "" },
            { id: "c15", name: "Combo 15 coxinhas", price: 6.0, units_count: 15, unit_type: "combo", description: "Mais sabor para curtir com a galera.", is_active: true, is_featured: false, order_index: 3, created_at: "" },
            { id: "c20", name: "Combo 20 coxinhas", price: 8.0, units_count: 20, unit_type: "combo", description: "Perfeito para reuniões e lanches em família.", is_active: true, is_featured: false, order_index: 4, created_at: "" },
            { id: "c25", name: "Combo 25 coxinhas", price: 10.0, units_count: 25, unit_type: "combo", description: "O combo campeão para quem ama coxinha.", is_active: true, is_featured: true, order_index: 5, created_at: "" },
          ]);
        }

        // Fetch store settings
        const { data: storeData } = await supabase.from("store_settings").select("*").limit(1).single();
        if (storeData?.whatsapp_number) {
          setWhatsappNumber(storeData.whatsapp_number);
        }
      } catch (err) {
        console.error(err);
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

  function handleSendOrder() {
    if (!customerName.trim()) {
      alert("Por favor, digite seu nome para identificação do pedido.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Selecione pelo menos um combo para montar seu pedido.");
      return;
    }

    const lines = cartItems.map(
      (item) =>
        `• ${item.name}: ${item.qty} combo(s) (${(item.units_count || 1) * item.qty} un) — ${item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
    );

    let message = `🍗 *NOVO PEDIDO — HELP POINT*\n\n`;
    message += `*Cliente:* ${customerName.trim()}\n`;
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
              <h1 className="text-xl font-black tracking-tight leading-none">HELP POINT</h1>
              <p className="text-xs text-amber-200 font-semibold mt-0.5">Coxinhas & Cia.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#pedido"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#f65a00] font-black text-xs shadow-md hover:bg-amber-50 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ver Pedido ({cartItems.length})</span>
            </a>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
              title="Acesso Administrativo"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>

        {/* Hero inside Header */}
        <div className="max-w-6xl mx-auto mt-8 mb-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative z-10">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-400/30 text-amber-200 font-extrabold text-[11px] uppercase tracking-wider mb-2">
              Coxinhas Crocantes & Quentinhas
            </span>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight text-white">
              Sua fome <span className="text-[#ffd21a]">pede Help!</span>
            </h2>
            <p className="text-sm text-amber-100/90 mt-3 max-w-lg leading-relaxed">
              Coxinhas douradas, combos para compartilhar e aquele sabor irresistível. Monte seu pedido abaixo e envie direto para o nosso WhatsApp!
            </p>
          </div>
          <div className="hidden md:flex justify-end">
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
                  className="bg-white rounded-3xl border border-[#f2dfca] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
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

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-[#fff2e5] p-1 rounded-2xl border border-[#f5dbbf]">
                      <button
                        type="button"
                        onClick={() => updateQty(product.id, -1)}
                        className="w-8 h-8 rounded-xl bg-white text-[#f65a00] font-black flex items-center justify-center hover:bg-[#ffe3cc] transition-colors shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black text-sm text-[#3c2116]">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(product.id, 1)}
                        className="w-8 h-8 rounded-xl bg-[#f65a00] text-white font-black flex items-center justify-center hover:bg-[#e04e00] transition-colors shadow-sm"
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

        {/* Order Form & Cart Section */}
        <section id="pedido" className="scroll-mt-8">
          <div className="mb-6">
            <h3 className="text-2xl font-black text-[#b83c00] tracking-tight">
              Finalizar Pedido 🧡
            </h3>
            <p className="text-xs text-[#765c50] mt-1">
              Preencha os dados abaixo e envie o pedido pronto para o nosso WhatsApp oficial
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Customer Details Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#f2dfca] p-6 sm:p-8 shadow-sm space-y-4">
              <h4 className="font-black text-base text-[#3c2116] border-b border-[#f5e3d0] pb-3">
                1. Seus Dados de Atendimento
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
              </div>

              {orderType.includes("Entrega") && (
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Endereço de Entrega
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
                  <option value="Pix">Pix (Chave informada no WhatsApp)</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito/Débito">Cartão de Crédito/Débito</option>
                  <option value="A combinar pelo WhatsApp">A combinar pelo WhatsApp</option>
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

            {/* Cart Summary & WhatsApp CTA */}
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
                  disabled={cartItems.length === 0}
                  className="w-full py-4 rounded-2xl bg-[#20b95b] hover:bg-[#1bb053] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.01]"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Pedido pelo WhatsApp</span>
                </button>

                <p className="text-[11px] text-[#765c50] text-center leading-relaxed">
                  Ao clicar, o WhatsApp será aberto com o resumo pronto para confirmação pela equipe da Help Point.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

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
