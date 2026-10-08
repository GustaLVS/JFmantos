import { formatPrice } from "../utils/format.js";
import PersonalizationDetails from "./PersonalizationDetails.jsx";

export default function SummaryPanel({ totals, withAction, goTo, promoCode, items }) {
  return (
    <aside className="summary-panel">
      <h2>Resumo do pedido</h2>
      {items?.length > 0 && (
        <div className="summary-items">
          {items.map(({ product, size, quantity, personalization, cartKey }) => (
            <div className="summary-item" key={cartKey}>
              <strong>{quantity}x {product.name}</strong>
              <small>Tamanho {size}</small>
              <PersonalizationDetails name={personalization?.name} number={personalization?.number} />
            </div>
          ))}
        </div>
      )}
      <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(totals.subtotal)}</strong></div>
      <div className="summary-row"><span>Entrega</span><strong>{formatPrice(totals.shipping)}</strong></div>
      <div className="summary-row"><span>Desconto{promoCode ? ` (${promoCode})` : ""}</span><strong>-{formatPrice(totals.discount)}</strong></div>
      <div className="summary-row total"><span>Total</span><strong>{formatPrice(totals.total)}</strong></div>
      {withAction && <button className="button primary full" type="button" onClick={() => goTo("checkout")}>Finalizar compra</button>}
    </aside>
  );
}
