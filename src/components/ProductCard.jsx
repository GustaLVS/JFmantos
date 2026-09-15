import { LuHeart } from "react-icons/lu";
import { categoryLabel } from "../data/products.js";
import { formatPrice } from "../utils/format.js";
import { cardBackground, ProductImage } from "../utils/productVisuals.jsx";

export default function ProductCard({ product, onDetails, isFavorite, onToggleFavorite }) {
  return (
    <article className="product-card">
      <button
        className={`favorite-button ${isFavorite ? "active" : ""}`}
        type="button"
        aria-label={isFavorite ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`}
        onClick={() => onToggleFavorite(product.id)}
      >
        <LuHeart aria-hidden="true" />
      </button>
      <button className="product-media" style={{ "--card-bg": cardBackground(product) }} type="button" onClick={() => onDetails(product.id)} aria-label={`Ver detalhes de ${product.name}`}>
        <ProductImage product={product} compact />
      </button>
      <div className="product-body">
        <div className="price">{formatPrice(product.price)}</div>
        <h3>{product.name}</h3>
        <p>{categoryLabel(product.category)}</p>
      </div>
    </article>
  );
}
