"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Integration } from "@/types/database";
import { 
  KeyRound, 
  Plus, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  MessageSquare,
  CreditCard,
  Database,
  Globe
} from "lucide-react";

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Local state for common integrations
  const [whatsappPhone, setWhatsappPhone] = useState("5591984034863");
  const [whatsappMode, setWhatsappMode] = useState<"direct" | "meta_api">("direct");
  const [metaApiToken, setMetaApiToken] = useState("");
  const [metaPhoneId, setMetaPhoneId] = useState("");

  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpEnv, setMpEnv] = useState<"sandbox" | "production">("sandbox");

  const [vercelDeployHook, setVercelDeployHook] = useState("");

  async function loadIntegrations() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("integrations").select("*");
      if (data && data.length > 0) {
        setIntegrations(data);

        // Populate fields
        const wpp = data.find((i) => i.service_name === "whatsapp");
        if (wpp) {
          setWhatsappPhone(wpp.metadata?.phone || "5591984034863");
          setWhatsappMode(wpp.metadata?.mode || "direct");
          setMetaApiToken(wpp.api_key || "");
          setMetaPhoneId(wpp.metadata?.phone_id || "");
        }

        const mp = data.find((i) => i.service_name === "mercadopago");
        if (mp) {
          setMpPublicKey(mp.api_key || "");
          setMpAccessToken(mp.api_secret || "");
          setMpEnv(mp.environment || "sandbox");
        }

        const vercel = data.find((i) => i.service_name === "vercel");
        if (vercel) {
          setVercelDeployHook(vercel.webhook_url || "");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIntegrations();
  }, []);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleShowSecret(id: string) {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function saveWhatsappIntegration() {
    try {
      setSavingKey("whatsapp");
      const payload = {
        service_name: "whatsapp",
        display_title: "WhatsApp de Pedidos & API",
        environment: "production",
        api_key: metaApiToken || null,
        metadata: {
          phone: whatsappPhone,
          mode: whatsappMode,
          phone_id: metaPhoneId,
        },
        is_active: true,
      };

      const { error } = await supabase
        .from("integrations")
        .upsert(payload, { onConflict: "service_name" });

      if (error) throw error;
      alert("Configurações do WhatsApp salvas com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingKey(null);
    }
  }

  async function saveMercadoPagoIntegration() {
    try {
      setSavingKey("mercadopago");
      const payload = {
        service_name: "mercadopago",
        display_title: "Gateway de Pagamento Pix / Mercado Pago",
        environment: mpEnv,
        api_key: mpPublicKey || null,
        api_secret: mpAccessToken || null,
        is_active: true,
      };

      const { error } = await supabase
        .from("integrations")
        .upsert(payload, { onConflict: "service_name" });

      if (error) throw error;
      alert("Configurações do Mercado Pago salvas com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingKey(null);
    }
  }

  async function saveVercelIntegration() {
    try {
      setSavingKey("vercel");
      const payload = {
        service_name: "vercel",
        display_title: "Vercel Deploy Hook & Hosting",
        environment: "production",
        webhook_url: vercelDeployHook || null,
        is_active: true,
      };

      const { error } = await supabase
        .from("integrations")
        .upsert(payload, { onConflict: "service_name" });

      if (error) throw error;
      alert("Configuração da Vercel salva!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div>
      <Header
        title="Chaves de API & Integrações"
        subtitle="Gerencie credenciais do WhatsApp, Pagamentos, Supabase e Vercel com segurança"
      />

      <div className="mt-8 space-y-8">
        {/* Supabase Connection Overview Card */}
        <div className="bg-white rounded-2xl border border-[#f2dfca] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#f5e3d0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#3c2116]">
                  Banco de Dados Supabase (Ativo)
                </h3>
                <p className="text-xs text-[#765c50]">
                  Conexão com PostgreSQL, Autenticação e Storage
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              Conectado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3.5 rounded-xl bg-[#fffaf2] border border-[#f2dfca]">
              <span className="text-[10px] font-black uppercase text-[#765c50] block mb-1">
                Project URL
              </span>
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono font-bold text-[#3c2116] truncate">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qfpbhyfwntcllsjkcrkm.supabase.co"}
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      process.env.NEXT_PUBLIC_SUPABASE_URL ||
                        "https://qfpbhyfwntcllsjkcrkm.supabase.co",
                      "supa_url"
                    )
                  }
                  className="p-1 text-gray-500 hover:text-[#f65a00]"
                >
                  {copiedId === "supa_url" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fffaf2] border border-[#f2dfca]">
              <span className="text-[10px] font-black uppercase text-[#765c50] block mb-1">
                Publishable / Anon API Key
              </span>
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono font-bold text-[#3c2116] truncate">
                  {showSecrets["supa_key"]
                    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_..."
                    : "••••••••••••••••••••••••••••••••••••••••"}
                </code>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleShowSecret("supa_key")}
                    className="p-1 text-gray-500 hover:text-[#f65a00]"
                  >
                    {showSecrets["supa_key"] ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                          "sb_publishable_W3glwDZfkCEh-ms61AZMEw_vlKqam-m",
                        "supa_key_copy"
                      )
                    }
                    className="p-1 text-gray-500 hover:text-[#f65a00]"
                  >
                    {copiedId === "supa_key_copy" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Integration Card */}
        <div className="bg-white rounded-2xl border border-[#f2dfca] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#f5e3d0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#3c2116]">
                  WhatsApp de Atendimento & Pedidos
                </h3>
                <p className="text-xs text-[#765c50]">
                  Configure para onde vão os pedidos dos clientes (Link direto ou Meta API)
                </p>
              </div>
            </div>
            <button
              onClick={saveWhatsappIntegration}
              disabled={savingKey === "whatsapp"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#20b95b] hover:bg-[#1ca651] text-white text-xs font-bold shadow-md shadow-emerald-950/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingKey === "whatsapp" ? "Salvando..." : "Salvar WhatsApp"}
            </button>
          </div>

          <div className="mt-5 space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-[#3c2116] mb-1">
                Número do WhatsApp com DDD (sem espaços ou traços) *
              </label>
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="5591984034863"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold text-[#3c2116] focus:outline-[#f65a00]"
              />
              <span className="text-[11px] text-[#765c50] mt-1 block">
                Formato internacional: 55 + DDD + Telefone (ex: 5591984034863)
              </span>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-[#3c2116] mb-2">
                Método de Envio dos Pedidos
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] cursor-pointer">
                  <input
                    type="radio"
                    name="wpp_mode"
                    checked={whatsappMode === "direct"}
                    onChange={() => setWhatsappMode("direct")}
                    className="mt-0.5 accent-[#20b95b]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#3c2116] block">
                      Link Direto wa.me (Recomendado)
                    </span>
                    <span className="text-[11px] text-[#765c50]">
                      Abre o WhatsApp do cliente com mensagem pronta para envio. 100% gratuito e sem custos de API.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] cursor-pointer">
                  <input
                    type="radio"
                    name="wpp_mode"
                    checked={whatsappMode === "meta_api"}
                    onChange={() => setWhatsappMode("meta_api")}
                    className="mt-0.5 accent-[#20b95b]"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#3c2116] block">
                      Meta WhatsApp Cloud API
                    </span>
                    <span className="text-[11px] text-[#765c50]">
                      Envio de mensagens automatizadas pelo servidor com templates aprovados pela Meta.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {whatsappMode === "meta_api" && (
              <div className="space-y-3 p-4 rounded-xl bg-[#fffaf2] border border-[#f2dfca]">
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Meta Permanent Access Token
                  </label>
                  <input
                    type="password"
                    value={metaApiToken}
                    onChange={(e) => setMetaApiToken(e.target.value)}
                    placeholder="EAA..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e8d2bd] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3c2116] mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={metaPhoneId}
                    onChange={(e) => setMetaPhoneId(e.target.value)}
                    placeholder="10928374829384"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#e8d2bd] font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mercado Pago / Pix Gateway Card */}
        <div className="bg-white rounded-2xl border border-[#f2dfca] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#f5e3d0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#3c2116]">
                  Gateway de Pagamento Pix / Cartão (Mercado Pago)
                </h3>
                <p className="text-xs text-[#765c50]">
                  Gere cobranças via Pix com baixa automática de pedidos
                </p>
              </div>
            </div>
            <button
              onClick={saveMercadoPagoIntegration}
              disabled={savingKey === "mercadopago"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#009ee3] hover:bg-[#008ecb] text-white text-xs font-bold shadow-md shadow-sky-950/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingKey === "mercadopago" ? "Salvando..." : "Salvar Mercado Pago"}
            </button>
          </div>

          <div className="mt-5 space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#3c2116]">Ambiente:</span>
              <button
                type="button"
                onClick={() => setMpEnv(mpEnv === "sandbox" ? "production" : "sandbox")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  mpEnv === "production"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {mpEnv === "production" ? "Produção (Ao Vivo)" : "Sandbox (Ambiente de Testes)"}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3c2116] mb-1">
                Public Key (Chave Pública)
              </label>
              <input
                type="text"
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
                placeholder="APP_USR-..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-mono focus:outline-[#009ee3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3c2116] mb-1">
                Access Token (Chave Secreta)
              </label>
              <input
                type="password"
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder="APP_USR-..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-mono focus:outline-[#009ee3]"
              />
            </div>
          </div>
        </div>

        {/* Vercel & GitHub Deploy Card */}
        <div className="bg-white rounded-2xl border border-[#f2dfca] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#f5e3d0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#3c2116]">
                  GitHub & Vercel Deploy Hook
                </h3>
                <p className="text-xs text-[#765c50]">
                  Gatilho de rebuild e deploy automático na nuvem
                </p>
              </div>
            </div>
            <button
              onClick={saveVercelIntegration}
              disabled={savingKey === "vercel"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingKey === "vercel" ? "Salvando..." : "Salvar Vercel Hook"}
            </button>
          </div>

          <div className="mt-5 space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-[#3c2116] mb-1">
                Vercel Deploy Hook URL (Opcional)
              </label>
              <input
                type="url"
                value={vercelDeployHook}
                onChange={(e) => setVercelDeployHook(e.target.value)}
                placeholder="https://api.vercel.com/v1/integrations/deploy/prj_.../..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-mono focus:outline-black"
              />
              <span className="text-[11px] text-[#765c50] mt-1 block">
                Permite que o painel envie um sinal para a Vercel reconstruir o site público instantaneamente após grandes mudanças no cardápio.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
