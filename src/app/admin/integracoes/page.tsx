"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { Integration } from "@/types/database";
import { 
  KeyRound, 
  Check, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Save, 
  Send,
  Loader2,
  MessageSquare,
  CreditCard,
  Database,
  Radio,
  Zap,
  PhoneCall,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function IntegracoesPage() {
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Comversa Online Configuration
  const [comversaUrl, setComversaUrl] = useState("https://comversa.online/api/v1/send");
  const [comversaApiKey, setComversaApiKey] = useState("cvk_k8dYmrjMR7aJqLmvTU49P2vpVPZjpodh");
  const [storePhone, setStorePhone] = useState("5591984034863");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isComversaActive, setIsComversaActive] = useState(true);

  // Test WhatsApp State
  const [testPhone, setTestPhone] = useState("5591984034863");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Mercado Pago & Vercel
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpEnv, setMpEnv] = useState<"sandbox" | "production">("sandbox");
  const [vercelDeployHook, setVercelDeployHook] = useState("");

  async function loadIntegrations() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("integrations").select("*");
      if (data && data.length > 0) {
        // Popula Comversa
        const comversa = data.find((i) => i.service_name === "comversa");
        if (comversa) {
          if (comversa.webhook_url) setComversaUrl(comversa.webhook_url);
          if (comversa.api_key) setComversaApiKey(comversa.api_key);
          if (comversa.metadata?.store_phone) setStorePhone(comversa.metadata.store_phone);
          if (comversa.metadata?.notify_customer !== undefined) {
            setNotifyCustomer(Boolean(comversa.metadata.notify_customer));
          }
          if (comversa.is_active !== undefined) {
            setIsComversaActive(Boolean(comversa.is_active));
          }
        }

        const mp = data.find((i) => i.service_name === "mercadopago");
        if (mp) {
          setMpPublicKey(mp.api_key || "");
          setMpAccessToken(mp.api_secret || "");
          setMpEnv((mp.environment as any) || "sandbox");
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

  // Salvar Configuração da API Comversa no Supabase
  async function saveComversaIntegration() {
    try {
      setSavingKey("comversa");
      const payload = {
        service_name: "comversa",
        display_title: "Comversa Online - Disparos de WhatsApp",
        description: "Disparo automático de pedidos via API HTTP",
        environment: "production",
        webhook_url: comversaUrl.trim(),
        api_key: comversaApiKey.trim(),
        metadata: {
          store_phone: storePhone.trim(),
          notify_customer: notifyCustomer,
        },
        is_active: isComversaActive,
      };

      // Tenta upsert pelo service_name
      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("service_name", "comversa")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("integrations")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("integrations").insert([payload]);
        if (error) throw error;
      }

      alert("Configurações da API Comversa salvas com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSavingKey(null);
    }
  }

  // Testar envio via API Comversa
  async function handleTestSend() {
    if (!testPhone.trim()) {
      alert("Informe o número para teste.");
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const res = await fetch("/api/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl: comversaUrl,
          apiKey: comversaApiKey,
          phone: testPhone,
          message: "🍗 *Help Point Coxinhas & Cia.*\n\nTeste de envio via API Comversa realizado com sucesso a partir do Painel Administrativo! ✅",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: "Mensagem enviada com sucesso para o WhatsApp informado!",
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Falha ao enviar a mensagem.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Erro ao conectar à API.",
      });
    } finally {
      setTesting(false);
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

      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("service_name", "mercadopago")
        .maybeSingle();

      if (existing) {
        await supabase.from("integrations").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("integrations").insert([payload]);
      }

      alert("Configurações do Mercado Pago salvas com sucesso!");
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
        subtitle="Gerencie credenciais do Comversa WhatsApp, Pagamentos e Banco de Dados com segurança"
      />

      <div className="mt-8 space-y-8">
        {/* Card Principal: Comversa Online (Disparo Automático via API HTTP) */}
        <div className="bg-white rounded-3xl border-2 border-[#20b95b]/30 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f5e3d0]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#20b95b] to-[#2ed573] flex items-center justify-center text-white shadow-lg shadow-emerald-950/20">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-[#3c2116]">
                    Comversa Online (WhatsApp API HTTP)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Disparo Automático
                  </span>
                </div>
                <p className="text-xs text-[#765c50] mt-0.5">
                  Envia pedidos diretamente via chamada HTTP POST sem depender do cliente clicar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3c2116] bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  checked={isComversaActive}
                  onChange={(e) => setIsComversaActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded accent-[#20b95b]"
                />
                <span>{isComversaActive ? "Ativo no Sistema" : "Pausado"}</span>
              </label>

              <button
                onClick={saveComversaIntegration}
                disabled={savingKey === "comversa"}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#20b95b] hover:bg-[#1ca651] text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all disabled:opacity-50"
              >
                {savingKey === "comversa" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Configurações</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-xs font-bold text-[#3c2116] mb-1.5">
                URL da API de Envio (Endpoint)
              </label>
              <input
                type="url"
                value={comversaUrl}
                onChange={(e) => setComversaUrl(e.target.value)}
                placeholder="https://comversa.online/api/v1/send"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-mono font-bold text-[#3c2116] focus:outline-[#20b95b]"
              />
              <p className="text-[11px] text-[#765c50] mt-1">
                Altere aqui se mudar para outra instância, porta ou servidor do Comversa.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3c2116] mb-1.5">
                Chave de API / Bearer Token
              </label>
              <div className="relative">
                <input
                  type={showSecrets["comversa_key"] ? "text" : "password"}
                  value={comversaApiKey}
                  onChange={(e) => setComversaApiKey(e.target.value)}
                  placeholder="cvk_..."
                  className="w-full pl-4 pr-20 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-mono font-bold text-[#3c2116] focus:outline-[#20b95b]"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleShowSecret("comversa_key")}
                    className="p-1.5 text-stone-500 hover:text-stone-800"
                    title={showSecrets["comversa_key"] ? "Ocultar" : "Mostrar"}
                  >
                    {showSecrets["comversa_key"] ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(comversaApiKey, "comversa_copy")}
                    className="p-1.5 text-stone-500 hover:text-stone-800"
                    title="Copiar Chave"
                  >
                    {copiedId === "comversa_copy" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-[#765c50] mt-1">
                Autentica via cabeçalho <code className="bg-stone-100 px-1 py-0.5 rounded">Authorization: Bearer</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3c2116] mb-1.5">
                Número de WhatsApp da Cozinha / Loja (com DDI e DDD)
              </label>
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="Ex: 5591984034863"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-bold text-[#3c2116] focus:outline-[#20b95b]"
              />
              <p className="text-[11px] text-[#765c50] mt-1">
                Para onde todos os novos pedidos finalizados no site serão enviados automaticamente.
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded accent-[#20b95b]"
                />
                <div>
                  <span className="text-xs font-bold text-[#3c2116] block">
                    Enviar mensagem de confirmação para o cliente
                  </span>
                  <span className="text-[11px] text-[#765c50] block mt-0.5">
                    Dispara automaticamente mensagem avisando que o pedido foi recebido e está sendo preparado.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Teste de Disparo em Tempo Real */}
          <div className="mt-8 pt-6 border-t border-[#f5e3d0] bg-stone-50/70 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-3xl">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#3c2116] mb-3 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#20b95b]" />
              <span>Testar Disparo de Mensagem em Tempo Real</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Número para testar (ex: 5591984034863)"
                className="flex-1 w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-[#3c2116] focus:outline-[#20b95b]"
              />
              <button
                type="button"
                onClick={handleTestSend}
                disabled={testing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#3c2116] hover:bg-[#2b170f] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Disparando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#20b95b]" />
                    <span>Enviar Teste Agora</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  testResult.success
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span className="font-semibold">{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Supabase Connection Overview Card */}
        <div className="bg-white rounded-3xl border border-[#f2dfca] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#f5e3d0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#3c2116]">
                  Banco de Dados & Storage (Supabase)
                </h3>
                <p className="text-xs text-[#765c50]">
                  Conexão ativa com PostgreSQL, Auth e Buckets de Imagens
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

        {/* Mercado Pago Gateway Card */}
        <div className="bg-white rounded-3xl border border-[#f2dfca] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#f5e3d0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#3c2116]">
                  Mercado Pago (Pix & Cartões)
                </h3>
                <p className="text-xs text-[#765c50]">
                  Geração de QR Code Pix e cobrança automática
                </p>
              </div>
            </div>
            <button
              onClick={saveMercadoPagoIntegration}
              disabled={savingKey === "mercadopago"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {savingKey === "mercadopago" ? "Salvando..." : "Salvar Mercado Pago"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-xs font-bold text-[#3c2116] mb-1">
                Public Key
              </label>
              <input
                type="text"
                placeholder="APP_USR-..."
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-mono font-bold focus:outline-sky-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#3c2116] mb-1">
                Access Token
              </label>
              <input
                type="password"
                placeholder="APP_USR-..."
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8d2bd] bg-[#fffdf9] text-xs font-mono font-bold focus:outline-sky-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
