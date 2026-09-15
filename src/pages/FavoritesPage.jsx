import ProductCard from "../components/ProductCard.jsx";

export default function FavoritesPage({ products, favoriteIds, onDetails, onToggleFavorite, goTo }) {
  const favoriteProducts = products.filter((product) => favoriteIds.includes(product.id));

  return (
    <section className="page active">
      <div className="page-title favorites-title">
        <span className="eyebrow">Favoritos</span>
        <h1>Camisas que voce gostou</h1>
        <p>Veja aqui as camisas marcadas com coracao para voltar nelas quando quiser.</p>
      </div>

      {favoriteProducts.length ? (
        <div className="product-grid favorites-grid">
          {favoriteProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDetails={onDetails}
              isFavorite
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="favorites-empty">
          <h2>Nenhuma camisa curtida ainda.</h2>
          <p>Marque o coracao nos produtos para montar sua lista.</p>
          <button className="button dark" type="button" onClick={() => goTo("produtos")}>Ver camisas</button>
        </div>
      )}
    </section>
  );
}
