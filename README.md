# 🍗 Help Point — Sistema de Gestão & Pedidos

Sistema completo para a **Help Point Coxinhas & Cia.**, desenvolvido com **Next.js**, **Tailwind CSS**, **Supabase (PostgreSQL)** e preparado para deploy na **Vercel**.

---

## 🚀 Funcionalidades

1. **🍗 Cardápio Digital & Pedidos Dinâmicos**:
   - Exibição de combos de coxinhas em tempo real direto do Supabase.
   - Seleção de quantidades, cálculo de totais, escolha de retirada/entrega e forma de pagamento.
   - Envio com mensagem formatada direto para o WhatsApp oficial.

2. **📦 Insumos & Compras por Período**:
   - Cadastro de matérias-primas e insumos (frango, farinha, óleo, embalagens).
   - Registro de compras por lote/período com fornecedor, data, quantidade e valor total.
   - Cálculo automático do custo unitário (ex: R$/kg, R$/unidade).
   - Alerta visual de estoque baixo.

3. **🏷️ Produtos & Valores**:
   - Cadastro e edição de produtos e combos.
   - Alteração rápida de preços no painel.
   - Botão para pausar ou ativar produtos instantaneamente no cardápio online.

4. **📁 Categorias**:
   - Organização de cardápio por categorias (Combos, Salgados, Bebidas, Sobremesas).

5. **🔑 Chaves de API & Integrações**:
   - Gerenciador seguro de credenciais para **WhatsApp** (link wa.me ou Meta Cloud API).
   - **Mercado Pago / Pix** (chaves pública e secreta com modo Sandbox/Produção).
   - **Supabase** (URL e Anon Key).
   - **Vercel Deploy Hook** para sincronização automática.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend & Backend**: Next.js 14 (App Router), React 18, TypeScript
- **Estilização**: Tailwind CSS, Lucide Icons
- **Banco de Dados**: Supabase (PostgreSQL, Triggers, RLS)
- **Hospedagem**: Vercel
- **Versionamento**: Git & GitHub

---

## ⚙️ Variáveis de Ambiente (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://qfpbhyfwntcllsjkcrkm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
NEXT_PUBLIC_STORE_NAME="Help Point Coxinhas & Cia."
NEXT_PUBLIC_WHATSAPP_NUMBER="5591984034863"
```

---

## 🚢 Deploy na Vercel

1. Suba o código para seu repositório no **GitHub**.
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Adicione as variáveis de ambiente acima em **Environment Variables**.
4. Clique em **Deploy**!
