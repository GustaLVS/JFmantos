import { useState } from "react";
import { LuHeart, LuMenu, LuSearch, LuShirt, LuShoppingBag, LuUserRound } from "react-icons/lu";
import { SHIELD_LOGO } from "../assets.js";

export default function Header({ page, cartCount, favoriteCount, search, filters, setSearch, goTo, applyNavFilter, user, isAdmin, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthPage = page === "login" || page === "cadastro";
  const submitSearch = (event) => {
    event.preventDefault();
    goTo("produtos");
  };

  const mainLinks = [
    { label: "Masculino", filter: { audience: "Masculino" } },
    { label: "Feminino", filter: { audience: "Feminino" } },
    { label: "Infantil", filter: { audience: "Infantil" } },
    { label: "Clubes", filter: { search: "Clubes" } },
    { label: "Seleções", filter: { category: "Selecoes", search: "" } },
    { label: "Lançamentos", filter: { category: "Lancamentos", search: "" } },
  ];

  const goAndClose = (target) => {
    setMenuOpen(false);
    goTo(target);
  };

  const handleNavFilter = (filter) => {
    setMenuOpen(false);
    applyNavFilter(filter);
  };

  const isFilterActive = (filter) => {
    if (page !== "produtos") return false;
    return Object.entries(filter).every(([key, value]) => (filters[key] || "") === value);
  };
  const userName = user?.user_metadata?.full_name || user?.email;

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="site-header">
      <div className="top-header">
        <div className="top-brand-icons" aria-label="JFMANTOS marcas">
          <button type="button" aria-label="JF" onClick={() => goTo("home")}>JF</button>
          <button type="button" aria-label="Camisas JFMANTOS" onClick={() => goTo("produtos")}><LuShirt aria-hidden="true" /></button>
        </div>
        <nav className="top-links" aria-label="Links auxiliares">
          <button type="button" onClick={() => goTo("home")}>Encontre uma loja</button>
          <button type="button" onClick={() => goTo("home")}>Ajuda</button>
          {user ? (
            <>
              <button type="button" onClick={() => goTo("minha-conta")}>{userName}</button>
              {isAdmin && <button type="button" onClick={() => goTo("admin")}>Admin</button>}
              <button type="button" onClick={onLogout}>Sair</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => goTo("cadastro")}>Cadastre-se</button>
              <button type="button" onClick={() => goTo("login")}>Entrar</button>
            </>
          )}
        </nav>
      </div>

      <div className="primary-header">
        <a className="brand" href="#home" aria-label="Ir para o inicio" onClick={() => goTo("home")}>
          <img src={SHIELD_LOGO} alt="JFMANTOS" />
        </a>

        <nav className="main-nav" aria-label="Menu principal">
          {mainLinks.map(({ label, filter }) => (
            <a key={label} href="#produtos" className={isFilterActive(filter) ? "active" : ""} onClick={() => handleNavFilter(filter)}>
              {label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <form className="header-search" role="search" onSubmit={submitSearch}>
            <button type="submit" aria-label="Buscar"><LuSearch aria-hidden="true" /></button>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" aria-label="Buscar produtos" />
          </form>
          <button className="nav-icon-button bag-button" type="button" aria-label="Favoritos" onClick={() => goTo("favoritos")}>
            <LuHeart aria-hidden="true" />
            {favoriteCount > 0 && <span className="cart-pill">{favoriteCount}</span>}
          </button>
          <button className="nav-icon-button account-button" type="button" aria-label={user ? "Minha conta" : "Entrar"} onClick={() => goTo(user ? "minha-conta" : "login")}>
            <LuUserRound aria-hidden="true" />
          </button>
          <button className="nav-icon-button bag-button" type="button" aria-label="Carrinho" onClick={() => goTo("carrinho")}>
            <LuShoppingBag aria-hidden="true" />
            {cartCount > 0 && <span className="cart-pill">{cartCount}</span>}
          </button>
          <button className="menu-toggle icon-button" type="button" aria-label="Abrir menu" onClick={() => setMenuOpen((open) => !open)}>
            <LuMenu aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={`mobile-menu-panel ${menuOpen ? "open" : ""}`}>
        <nav aria-label="Menu mobile">
          {mainLinks.map(({ label, filter }) => (
            <a key={label} href="#produtos" onClick={() => handleNavFilter(filter)}>{label}</a>
          ))}
          <a href="#favoritos" onClick={() => goAndClose("favoritos")}>Favoritos</a>
          {user ? (
            <>
              <a href="#minha-conta" onClick={() => goAndClose("minha-conta")}>Minha conta</a>
              {isAdmin && <a href="#admin" onClick={() => goAndClose("admin")}>Admin</a>}
              <a href="#home" onClick={(event) => {
                event.preventDefault();
                setMenuOpen(false);
                onLogout();
              }}>Sair</a>
            </>
          ) : (
            <>
              <a href="#login" onClick={() => goAndClose("login")}>Entrar</a>
              <a href="#cadastro" onClick={() => goAndClose("cadastro")}>Cadastre-se</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
