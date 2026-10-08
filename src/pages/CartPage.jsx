import SummaryPanel from "../components/SummaryPanel.jsx";
import { formatPrice } from "../utils/format.js";
import { cardBackground, ProductImage } from "../utils/productVisuals.jsx";
import PersonalizationDetails from "../components/PersonalizationDetails.jsx";

export default function CartPage({ items, totals, changeQuantity, removeItem, goTo }) {
  return (
    <section className="page active">
      <div className="page-title compact">
        <span className="eyebrow">Pedido</span>
        <h1>Carrinho de compras</h1>
      </div>
      <div className="cart-layout">
        <div className="cart-list">
          {items.length ? items.map(({ product, size, quantity, personalization, cartKey }) => (
            <article className="cart-item" key={cartKey}>
              <div className="cart-product">
                <div className="cart-thumb" style={{ "--card-bg": cardBackground(product) }}><ProductImage product={product} compact /></div>
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.team} • Tamanho {size}</p>
                  <PersonalizationDetails name={personalization?.name} number={personalization?.number} />
                </div>
              </div>
              <div className="quantity-control">
                <button type="button" onClick={() => changeQuantity(cartKey, -1)}>-</button>
                <strong>{quantity}</strong>
                <button type="button" onClick={() => changeQuantity(cartKey, 1)}>+</button>
              </div>
              <strong>{formatPrice(product.price * quantity)}</strong>
              <button className="button ghost" type="button" onClick={() => removeItem(cartKey)}>Remover</button>
            </article>
          )) : <div className="empty-state">Seu carrinho esta vazio. Escolha uma camisa para comecar.</div>}
        </div>
        <SummaryPanel totals={totals} withAction goTo={goTo} />
      </div>
    </section>
  );
}
