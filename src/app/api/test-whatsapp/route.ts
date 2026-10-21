import { NextResponse } from "next/server";

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

function cleanPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = "55" + cleaned;
  }
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const { apiUrl, apiKey, phone, message } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Informe o número de telefone para o teste." },
        { status: 400 }
      );
    }

    const targetUrl = apiUrl || "https://comversa.online/api/v1/send";
    const targetKey = apiKey || "cvk_k8dYmrjMR7aJqLmvTU49P2vpVPZjpodh";
    const targetPhone = cleanPhone(phone);
    const targetText =
      message ||
      "🍗 *Help Point Coxinhas & Cia.*\n\nTeste de integração com a API Comversa realizado com sucesso!";

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${targetKey.trim()}`,
      },
      body: JSON.stringify({
        to: targetPhone,
        text: targetText,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error || `Erro HTTP ${response.status}`,
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mensagem de teste enviada com sucesso!",
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro de conexão com o servidor da API." },
      { status: 500 }
    );
  }
}
