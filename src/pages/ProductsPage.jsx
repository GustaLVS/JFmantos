import { useMemo } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { categories, categoryLabel, normalizeCategory } from "../data/products.js";
import { formatPrice } from "../utils/format.js";

export default function ProductsPage({ products, filters, setFilters, defaultFilters, sort, setSort, onBuy, onDetails, favoriteIds, onToggleFavorite }) {
  const teams = useMemo(() => [...new Set(products.map((product) => product.team))].sort(), [products]);

  const filteredProducts = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    const result = products.filter((product) => {
      const searchable = [product.name, product.team, product.category, product.season, product.type, product.audience, product.description].join(" ").toLowerCase();
      return (!filters.category || normalizeCategory(product.category) === normalizeCategory(filters.category))
        && (!filters.team || product.team === filters.team)
        && (!filters.size || product.sizes.includes(filters.size))
        && (!filters.type || product.type === filters.type)
        && (!filters.audience || product.audience === filters.audience)
        && product.price <= Number(filters.price)
        && (!searchTerm || searchable.includes(searchTerm));
    });
    return [...result].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(b.featured) - Number(a.featured);
    });
  }, [filters, products, sort]);

  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));

  return (
    <section className="page active">
      <div className="page-title">
        <span className="eyebrow">Catalogo</span>
        <h1>Camisas de futebol</h1>
        <p>Filtre por categoria, time, tamanho, preco e tipo para encontrar a camisa certa.</p>
      </div>
      <form className="catalog-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <input type="search" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Pesquisar por camisa, time, selecao ou temporada" aria-label="Pesquisar no catalogo" />
        <button className="button dark" type="submit">Pesquisar</button>
      </form>
      <div className="catalog-layout">
        <aside className="filters-panel">
          <div className="filter-head">
            <h2>Filtros</h2>
            <button className="text-button" type="button" onClick={() => setFilters(defaultFilters)}>Limpar</button>
          </div>
          <label>Categoria
            <select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}>
              <option value="">Todas</option>
              {categories.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
            </select>
          </label>
          <label>Time ou selecao
            <select value={filters.team} onChange={(event) => updateFilter("team", event.target.value)}>
              <option value="">Todos</option>
              {teams.map((team) => <option key={team}>{team}</option>)}
            </select>
          </label>
          <label>Tamanho
            <select value={filters.size} onChange={(event) => updateFilter("size", event.target.value)}>
              <option value="">Todos</option>
              {["P", "M", "G", "GG"].map((size) => <option key={size}>{size}</option>)}
            </select>
          </label>
          <label>Preco maximo
            <input type="range" min="120" max="420" value={filters.price} onChange={(event) => updateFilter("price", event.target.value)} />
            <span className="range-value">ate {formatPrice(Number(filters.price))}</span>
          </label>
          <label>Tipo de camisa
            <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
              <option value="">Todos</option>
              {["Torcedor", "Jogador", "Retro"].map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label>Publico
            <select value={filters.audience} onChange={(event) => updateFilter("audience", event.target.value)}>
              <option value="">Todos</option>
              {["Masculino", "Feminino", "Infantil"].map((audience) => <option key={audience}>{audience}</option>)}
            </select>
          </label>
        </aside>
        <div>
          <div className="catalog-toolbar">
            <strong>{filteredProducts.length} produto{filteredProducts.length === 1 ? "" : "s"}</strong>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">Destaques</option>
              <option value="price-asc">Menor preco</option>
              <option value="price-desc">Maior preco</option>
              <option value="name">Nome</option>
            </select>
          </div>
          <div className="product-grid">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={onBuy}
                onDetails={onDetails}
                isFavorite={favoriteIds.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
              />
            )) : <div className="empty-state">Nenhuma camisa encontrada com esses filtros.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
