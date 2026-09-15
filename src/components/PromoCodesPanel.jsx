import { useEffect, useState } from "react";
import { createPromotionalCode, deletePromotionalCode, fetchPromotionalCodes, updatePromotionalCode } from "../services/promotionalCodesApi.js";
import { formatPrice } from "../utils/format.js";

export default function PromoCodesPanel({ showToast }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotionalCodes()
      .then(setCodes)
      .catch((error) => {
        console.error(error);
        showToast("Nao foi possivel carregar os cupons.");
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const created = await createPromotionalCode({
        code: data.get("code"),
        description: data.get("description")?.trim() || null,
        discount_type: data.get("discountType"),
        value: Number(data.get("value")),
        minimum_order: Number(data.get("minimumOrder") || 0),
        maximum_discount: data.get("maximumDiscount") ? Number(data.get("maximumDiscount")) : null,
        usage_limit: data.get("usageLimit") ? Number(data.get("usageLimit")) : null,
        starts_at: data.get("startsAt") ? new Date(data.get("startsAt")).toISOString() : null,
        expires_at: data.get("expiresAt") ? new Date(data.get("expiresAt")).toISOString() : null,
        active: true,
      });
      setCodes((current) => [created, ...current]);
      form.reset();
      showToast("Codigo promocional criado.");
    } catch (error) {
      console.error(error);
      showToast(error.code === "23505" ? "Esse codigo ja existe." : "Nao foi possivel criar o cupom.");
    }
  };

  const toggle = async (code) => {
    try {
      const updated = await updatePromotionalCode(code.id, { active: !code.active });
      setCodes((current) => current.map((item) => item.id === updated.id ? updated : item));
      showToast(updated.active ? "Cupom ativado." : "Cupom pausado.");
    } catch (error) {
      console.error(error);
      showToast("Nao foi possivel alterar o cupom.");
    }
  };

  const remove = async (code) => {
    try {
      await deletePromotionalCode(code.id);
      setCodes((current) => current.filter((item) => item.id !== code.id));
      showToast("Cupom removido.");
    } catch (error) {
      console.error(error);
      showToast("Nao foi possivel remover o cupom.");
    }
  };

  return (
    <section className="admin-users-panel promo-admin-panel">
      <div>
        <span className="eyebrow">Promocoes</span>
        <h2>Codigos promocionais</h2>
        <p>Crie descontos seguros para campanhas e acompanhe o limite de utilizacoes.</p>
      </div>

      <form className="promo-code-form" onSubmit={submit}>
        <label>Codigo<input required name="code" maxLength="30" placeholder="JFMANTOS10" /></label>
        <label>Tipo
          <select name="discountType" defaultValue="percent">
            <option value="percent">Porcentagem</option>
            <option value="fixed">Valor fixo</option>
          </select>
        </label>
        <label>Valor<input required name="value" type="number" min="0.01" step="0.01" placeholder="10" /></label>
        <label>Pedido minimo<input name="minimumOrder" type="number" min="0" step="0.01" placeholder="0,00" /></label>
        <label>Desconto maximo<input name="maximumDiscount" type="number" min="0" step="0.01" placeholder="Opcional" /></label>
        <label>Limite de usos<input name="usageLimit" type="number" min="1" step="1" placeholder="Ilimitado" /></label>
        <label>Inicio<input name="startsAt" type="datetime-local" /></label>
        <label>Expiracao<input name="expiresAt" type="datetime-local" /></label>
        <label className="wide">Descricao<input name="description" placeholder="Ex.: Campanha de lancamento" /></label>
        <button className="button dark full wide" type="submit">Criar codigo promocional</button>
      </form>

      <div className="promo-code-list">
        {loading && <div className="empty-state">Carregando cupons...</div>}
        {!loading && codes.map((code) => (
          <article className={`promo-code-card ${code.active ? "" : "inactive"}`} key={code.id}>
            <div>
              <strong>{code.code}</strong>
              <p>{code.discount_type === "percent" ? `${Number(code.value)}% de desconto` : `${formatPrice(Number(code.value))} de desconto`}</p>
              <small>Usos: {code.used_count}{code.usage_limit ? `/${code.usage_limit}` : " - ilimitado"}</small>
            </div>
            <span>{code.active ? "Ativo" : "Pausado"}</span>
            <div className="promo-code-actions">
              <button className="button ghost" type="button" onClick={() => toggle(code)}>{code.active ? "Pausar" : "Ativar"}</button>
              <button className="button danger" type="button" onClick={() => remove(code)}>Remover</button>
            </div>
          </article>
        ))}
        {!loading && !codes.length && <div className="empty-state">Nenhum codigo promocional criado.</div>}
      </div>
    </section>
  );
}
