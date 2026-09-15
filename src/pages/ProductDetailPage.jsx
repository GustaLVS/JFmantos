import { useEffect, useState } from "react";
import { categoryLabel } from "../data/products.js";
import { formatPrice } from "../utils/format.js";
import { cardBackground, ProductImage, productImages } from "../utils/productVisuals.jsx";

export default function ProductDetailPage({ product, onAdd }) {
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const allSizes = ["P", "M", "G", "GG"];
  const oldPrice = product.price * 1.12;
  const cashback = product.price * 0.02;
  const galleryImages = productImages(product);
  const galleryItems = galleryImages.length ? galleryImages : [null];

  useEffect(() => {
    setSize(product.sizes[0]);
    setQuantity(1);
    setActiveImage(0);
  }, [product]);

  return (
    <section className="page active">
      <div className="detail-breadcrumb">
        Pagina Inicial / Produtos / {categoryLabel(product.category)} / <strong>{product.name}</strong>
      </div>

      <div className="product-detail product-detail-premium">
        <div className="detail-gallery">
          <div className="detail-thumbs" aria-label="Galeria do produto">
            {galleryItems.map((image, index) => (
              <button
                className={activeImage === index ? "active" : ""}
                type="button"
                key={image || `${product.id}-placeholder`}
                onClick={() => setActiveImage(index)}
                aria-label={`Visual ${index + 1} de ${product.name}`}
              >
                <ProductImage product={product} src={image} compact />
              </button>
            ))}
          </div>

          <div className="detail-media" style={{ "--card-bg": cardBackground(product) }}>
            <span className="detail-discount">-12%</span>
            <ProductImage product={product} src={galleryImages[activeImage]} />
          </div>
        </div>

        <div className="detail-info">
          <div className="detail-tags">
            <span>2% Cashback</span>
            {product.featured && <span>Lancamento</span>}
            <span>{product.type}</span>
          </div>

          <h1>{product.name}</h1>
          <p className="detail-availability">Disponibilidade: <strong>Imediata</strong></p>
          <div className="old-price">De {formatPrice(oldPrice)}</div>
          <div className="price">{formatPrice(product.price)}</div>
          <p className="pix-note">Economize pagando a vista via PIX</p>
          <div className="cashback-note">Ganhe ate {formatPrice(cashback)} em Cashback.</div>

          <div className="detail-meta">
            <span>{product.team}</span>
            <span>{product.season}</span>
            <span>{product.audience || "Masculino"}</span>
          </div>

          <h2>Tamanho</h2>
          <div className="size-options">
            {allSizes.map((item) => (
              <button
                className={`size-option ${size === item ? "active" : ""}`}
                type="button"
                key={item}
                disabled={!product.sizes.includes(item)}
                onClick={() => setSize(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <h2>Quantidade</h2>
          <div className="quantity-control">
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
            <strong>{quantity}</strong>
            <button type="button" onClick={() => setQuantity((value) => value + 1)}>+</button>
          </div>

          <button className="button primary full buy-now-button" type="button" onClick={() => onAdd(product.id, size, quantity)}>
            Comprar
          </button>

          <div className="info-strip">
            <div>Entrega para todo o Brasil.</div>
            <div>Pagamento por Pix, cartao de credito ou boleto.</div>
            <div>Compra 100% segura.</div>
          </div>
        </div>
      </div>

      <div className="detail-more">
        <h2>Mais detalhes</h2>
        <div>
          <h3>Descricao</h3>
          <p>{product.description}</p>
        </div>
        <div>
          <h3>Informacoes do produto</h3>
          <p>{categoryLabel(product.category)} | {product.type} | Temporada {product.season}</p>
        </div>
      </div>
    </section>
  );
}
