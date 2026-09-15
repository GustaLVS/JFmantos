import SummaryPanel from "../components/SummaryPanel.jsx";
import { formatPrice } from "../utils/format.js";
import { cardBackground, ProductImage } from "../utils/productVisuals.jsx";

export default function CartPage({ items, totals, changeQuantity, removeItem, goTo }) {
  return (
    <section className="page active">
      <div className="page-title compact">
        <span className="eyebrow">Pedido</span>
        <h1>Carrinho de compras</h1>
      </div>
      <div className="cart-layout">
        <div className="cart-list">
          {items.length ? items.map(({ product, size, quantity }) => (
            <article className="cart-item" key={`${product.id}-${size}`}>
              <div className="cart-product">
                <div className="cart-thumb" style={{ "--card-bg": cardBackground(product) }}><ProductImage product={product} compact /></div>
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.team} • Tamanho {size}</p>
                </div>
              </div>
              <div className="quantity-control">
                <button type="button" onClick={() => changeQuantity(product.id, size, -1)}>-</button>
                <strong>{quantity}</strong>
                <button type="button" onClick={() => changeQuantity(product.id, size, 1)}>+</button>
              </div>
              <strong>{formatPrice(product.price * quantity)}</strong>
              <button className="button ghost" type="button" onClick={() => removeItem(product.id, size)}>Remover</button>
            </article>
          )) : <div className="empty-state">Seu carrinho esta vazio. Escolha uma camisa para comecar.</div>}
        </div>
        <SummaryPanel totals={totals} withAction goTo={goTo} />
      </div>
    </section>
  );
}
