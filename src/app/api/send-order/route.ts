import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function cleanPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = "55" + cleaned;
  }
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      orderType,
      address,
      paymentMethod,
      notes,
      items,
      totalAmount,
    } = body;

    if (!customerName || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Dados do pedido incompletos." },
        { status: 400 }
      );
    }

    // 1. Buscar configurações ativas do Comversa no Supabase
    let apiUrl = "https://comversa.online/api/v1/send";
    let apiKey = "cvk_k8dYmrjMR7aJqLmvTU49P2vpVPZjpodh";
    let storePhone = "5591984034863";
    let isActive = true;
    let notifyCustomer = true;

    try {
      const { data: integrationData } = await supabase
        .from("integrations")
        .select("*")
        .eq("service_name", "comversa")
        .maybeSingle();

      if (integrationData) {
        if (integrationData.webhook_url) apiUrl = integrationData.webhook_url;
        if (integrationData.api_key) apiKey = integrationData.api_key;
        if (integrationData.metadata?.store_phone) storePhone = integrationData.metadata.store_phone;
        if (integrationData.metadata?.notify_customer !== undefined) {
          notifyCustomer = Boolean(integrationData.metadata.notify_customer);
        }
        if (integrationData.is_active !== undefined) {
          isActive = Boolean(integrationData.is_active);
        }
      }
    } catch (dbErr) {
      console.warn("Usando configurações padrão para o Comversa:", dbErr);
    }

    // Se a integração foi desativada no admin
    if (!isActive) {
      return NextResponse.json(
        { error: "Disparo automático desativado. Use o envio manual.", fallback: true },
        { status: 200 }
      );
    }

    // 2. Montar texto do pedido formatado para o WhatsApp
    const itemsText = items
      .map(
        (item: any) =>
          `• *${item.name}*: ${item.qty}x (${(item.units_count || 1) * item.qty} un) — ${Number(
            item.price * item.qty
          ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
      )
      .join("\n");

    let storeMessage = `🍗 *NOVO PEDIDO RECEBIDO — HELP POINT*\n\n`;
    storeMessage += `👤 *Cliente:* ${customerName.trim()}\n`;
    if (customerPhone) {
      storeMessage += `📱 *WhatsApp do Cliente:* ${customerPhone.trim()}\n`;
    }
    storeMessage += `🛵 *Tipo:* ${orderType || "Retirada no Balcão"}\n`;
    if (orderType && orderType.includes("Entrega") && address) {
      storeMessage += `📍 *Endereço:* ${address.trim()}\n`;
    }
    storeMessage += `💳 *Pagamento:* ${paymentMethod || "Não informado"}\n\n`;
    storeMessage += `📦 *ITENS DO PEDIDO:*\n${itemsText}\n\n`;
    storeMessage += `💰 *TOTAL:* ${Number(totalAmount).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })}\n`;
    if (notes && notes.trim()) {
      storeMessage += `\n📝 *Observações:* ${notes.trim()}\n`;
    }
    storeMessage += `\n⏰ *Horário:* ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

    // 3. Enviar para o WhatsApp da Loja via Comversa API
    const targetStoreNumber = cleanPhone(storePhone);
    const storeResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        to: targetStoreNumber,
        text: storeMessage,
      }),
    });

    const storeResData = await storeResponse.json().catch(() => null);

    if (!storeResponse.ok) {
      console.error("Erro na API Comversa (Loja):", storeResData);
      return NextResponse.json(
        {
          error: storeResData?.error || "Falha ao enviar mensagem pela API Comversa.",
          fallback: true,
        },
        { status: 500 }
      );
    }

    // 4. (Opcional) Notificar também o cliente se informado o telefone
    let customerNotified = false;
    if (notifyCustomer && customerPhone) {
      const targetCustomerNumber = cleanPhone(customerPhone);
      if (targetCustomerNumber.length >= 12) {
        const customerMessage = `Olá *${customerName.trim()}*! Recebemos seu pedido na *Help Point Coxinhas & Cia.* 🍗\n\n` +
          `💰 *Total:* ${Number(totalAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\n` +
          `💳 *Pagamento:* ${paymentMethod || "Não informado"}\n\n` +
          `Já estamos preparando seu pedido com todo carinho! Qualquer dúvida, basta responder a esta mensagem.`;

        try {
          await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey.trim()}`,
            },
            body: JSON.stringify({
              to: targetCustomerNumber,
              text: customerMessage,
            }),
          });
          customerNotified = true;
        } catch (custErr) {
          console.warn("Falha ao notificar cliente:", custErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pedido enviado para a cozinha via WhatsApp com sucesso!",
      customerNotified,
    });
  } catch (err: any) {
    console.error("Erro no processamento do pedido:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno do servidor.", fallback: true },
      { status: 500 }
    );
  }
}
