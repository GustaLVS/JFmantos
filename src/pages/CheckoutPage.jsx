import { useState } from "react";
import SummaryPanel from "../components/SummaryPanel.jsx";
import { createMercadoPagoCheckout, validatePromotionalCode } from "../services/paymentApi.js";

export default function CheckoutPage({ totals, cartItems, user, profile, showToast, goTo }) {
  const [payment, setPayment] = useState("Pix");
  const [loading, setLoading] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const checkoutTotals = {
    ...totals,
    discount: totals.discount + (appliedPromo?.discount || 0),
    total: Math.max(0, totals.total - (appliedPromo?.discount || 0)),
  };
  const paymentText = {
    Pix: ["Pix pelo Mercado Pago", "Voce sera redirecionado ao ambiente seguro para gerar o QR Code e concluir o pagamento."],
    "Cartao de credito": ["Cartao pelo Mercado Pago", "Os dados do cartao serao preenchidos no ambiente seguro do Mercado Pago."],
    Boleto: ["Boleto pelo Mercado Pago", "O boleto e a linha digitavel serao gerados no ambiente seguro do Mercado Pago."],
  }[payment];

  const submit = async (event) => {
    event.preventDefault();
    if (!cartItems.length) {
      showToast("Adicione uma camisa ao carrinho antes de pagar.");
      goTo("produtos");
      return;
    }
    if (!user) {
      showToast("Entre na sua conta antes de finalizar o pagamento.");
      goTo("login");
      return;
    }

    const form = new FormData(event.currentTarget);
    try {
      setLoading(true);
      showToast("Criando pagamento seguro...");
      const checkout = await createMercadoPagoCheckout({
        cartItems,
        paymentMethod: payment,
        promoCode: appliedPromo?.code || "",
        customer: {
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          document: form.get("document"),
          zip: form.get("zip"),
          address: form.get("address"),
          city: form.get("city"),
          state: form.get("state"),
        },
      });
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Nao foi possivel iniciar o pagamento.");
      setLoading(false);
    }
  };

  const applyPromo = async () => {
    try {
      setValidatingPromo(true);
      const result = await validatePromotionalCode(promoInput, totals.subtotal);
      setAppliedPromo(result);
      setPromoInput(result.code);
      showToast(`Cupom ${result.code} aplicado.`);
    } catch (error) {
      setAppliedPromo(null);
      showToast(error.message || "Cupom invalido.");
    } finally {
      setValidatingPromo(false);
    }
  };

  return (
    <section className="page active">
      <div className="page-title compact">
        <span className="eyebrow">Checkout</span>
        <h1>Finalize sua compra</h1>
      </div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <h2>Dados do cliente</h2>
          <div className="form-grid">
            <label>Nome<input required name="name" defaultValue={profile?.name || user?.user_metadata?.full_name || ""} placeholder="Seu nome completo" /></label>
            <label>E-mail<input required type="email" name="email" defaultValue={profile?.email || user?.email || ""} placeholder="voce@email.com" /></label>
            <label>Telefone<input required name="phone" defaultValue={profile?.phone || user?.user_metadata?.phone || ""} placeholder="(00) 00000-0000" /></label>
            <label>CPF<input required name="document" defaultValue={profile?.document || user?.user_metadata?.document || ""} placeholder="000.000.000-00" /></label>
            <label>CEP<input required name="zip" placeholder="00000-000" /></label>
            <label className="wide">Endereco<input required name="address" placeholder="Rua, numero e bairro" /></label>
            <label>Cidade<input required name="city" placeholder="Sua cidade" /></label>
            <label>Estado<input required name="state" maxLength="2" placeholder="BA" /></label>
          </div>
          <h2>Pagamento</h2>
          <div className="payment-options">
            {["Pix", "Cartao de credito", "Boleto"].map((option) => (
              <label className={`payment-card ${payment === option ? "active" : ""}`} key={option}>
                <input type="radio" name="payment" value={option} checked={payment === option} onChange={() => setPayment(option)} />
                {option === "Cartao de credito" ? "Cartao" : option}
              </label>
            ))}
          </div>
          <div className="payment-preview">
            <strong>{paymentText[0]}</strong>
            <p>{paymentText[1]}</p>
          </div>
          <div className="promo-checkout">
            <label htmlFor="promo-code">Codigo promocional</label>
            <div>
              <input
                id="promo-code"
                value={promoInput}
                onChange={(event) => {
                  setPromoInput(event.target.value.toUpperCase());
                  if (appliedPromo) setAppliedPromo(null);
                }}
                placeholder="Digite seu cupom"
              />
              <button className="button ghost" type="button" onClick={applyPromo} disabled={validatingPromo || !promoInput.trim()}>
                {validatingPromo ? "Validando..." : "Aplicar"}
              </button>
            </div>
            {appliedPromo && <p><strong>{appliedPromo.code}</strong> aplicado: -{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(appliedPromo.discount)}</p>}
          </div>
          <button className="button primary full" type="submit" disabled={loading}>
            {loading ? "Abrindo Mercado Pago..." : "Pagar agora"}
          </button>
        </form>
        <SummaryPanel totals={checkoutTotals} promoCode={appliedPromo?.code} />
      </div>
    </section>
  );
}
