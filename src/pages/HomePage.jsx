import { useMemo } from "react";
import PremiumHero from "../components/PremiumHero.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { categories, categoryLabel, normalizeCategory } from "../data/products.js";

export default function HomePage({ products, onBuy, onDetails, goTo, applyNavFilter, favoriteIds, onToggleFavorite }) {
  const categorySections = useMemo(() => categories
    .map((category) => ({
      category,
      products: products.filter((product) => normalizeCategory(product.category) === category),
    }))
    .filter((section) => section.products.length), [products]);

  return (
    <section className="page home-page active">
      <PremiumHero />

      <section className="section-block product-showcase">
        <div className="showcase-heading">
          <h2>DESTAQUES</h2>
          <button className="button dark" type="button" onClick={() => goTo("produtos")}>VER TUDO</button>
        </div>

        <div className="category-picker" aria-label="Escolha por categoria">
          {categorySections.map(({ category }) => (
            <button type="button" key={category} onClick={() => applyNavFilter({ category })}>
              {categoryLabel(category)}
            </button>
          ))}
        </div>

        <div className="category-showcase-list">
          {categorySections.map(({ category, products: sectionProducts }) => (
            <section className="category-showcase" id={`home-${category}`} key={category}>
              <div className="category-showcase-heading">
                <h3>{categoryLabel(category)}</h3>
                <button className="text-button" type="button" onClick={() => goTo("produtos")}>Ver categoria</button>
              </div>
              <div className={`category-showcase-scroll ${sectionProducts.length <= 3 ? "single-row" : ""}`} aria-label={`Camisas de ${categoryLabel(category)}`}>
                {sectionProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onBuy={onBuy}
                    onDetails={onDetails}
                    isFavorite={favoriteIds.includes(product.id)}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </section>
  );
}
