import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Toast from "./components/Toast.jsx";
import { baseProducts } from "./data/products.js";
import AccountPage from "./pages/AccountPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import FavoritesPage from "./pages/FavoritesPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import { fetchCustomerProfile, getCurrentSession, signOutCustomer, watchAuthState } from "./services/authApi.js";
import { createProduct, deleteProduct, fetchProducts, updateProduct } from "./services/productsApi.js";
import { getStored } from "./utils/format.js";

const defaultFilters = { category: "", team: "", size: "", price: 420, type: "", audience: "", search: "" };
const ADMIN_EMAILS = ["alvesgustavosouza2022@gmail.com"];

export default function App() {
  const [page, setPage] = useState(() => window.location.hash.replace("#", "") || "home");
  const [products, setProducts] = useState(() => [...baseProducts, ...getStored("jfmantos_products", [])]);
  const [cart, setCart] = useState(() => getStored("jfmantos_cart", []));
  const [filters, setFilters] = useState(defaultFilters);
  const [sort, setSort] = useState("featured");
  const [selectedProductId, setSelectedProductId] = useState("fla-25-home");
  const [favoriteIds, setFavoriteIds] = useState(() => getStored("jfmantos_favorites", []));
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const onHashChange = () => setPage(window.location.hash.replace("#", "") || "home");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      const customerProfile = await fetchCustomerProfile(user.id);
      if (isMounted) setProfile(customerProfile);
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    localStorage.setItem("jfmantos_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const session = await getCurrentSession();
        if (isMounted) setUser(session?.user || null);
      } catch (error) {
        console.error(error);
      }
    }

    loadSession();
    const unsubscribe = watchAuthState((session) => {
      setUser(session?.user || null);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const databaseProducts = await fetchProducts();
        if (isMounted && databaseProducts.length) {
          setProducts(databaseProducts);
          showToast("Produtos carregados do Supabase.");
        }
      } catch (error) {
        console.error(error);
        if (isMounted) showToast("Nao foi possivel carregar o Supabase. Usando produtos locais.");
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("jfmantos_products", JSON.stringify(products.filter((product) => product.source === "local")));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("jfmantos_favorites", JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const goTo = (nextPage) => {
    window.location.hash = nextPage;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showToast = (message) => setToast(message);

  const addToCart = (productId, size = "M", quantity = 1) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const finalSize = product.sizes.includes(size) ? size : product.sizes[0];
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId && item.size === finalSize);
      if (existing) {
        return current.map((item) => item === existing ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...current, { productId, size: finalSize, quantity }];
    });
    showToast(`${product.name} adicionada ao carrinho.`);
  };

  const cartItems = cart
    .map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }))
    .filter((item) => item.product);

  const totals = cartItems.reduce((acc, item) => {
    acc.subtotal += item.product.price * item.quantity;
    return acc;
  }, { subtotal: 0, shipping: 0, discount: 0, total: 0 });
  totals.shipping = totals.subtotal > 0 ? 24.9 : 0;
  totals.discount = totals.subtotal >= 500 ? 35 : 0;
  totals.total = Math.max(0, totals.subtotal + totals.shipping - totals.discount);

  const changeQuantity = (productId, size, delta) => {
    setCart((current) => current
      .map((item) => item.productId === productId && item.size === size ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  };

  const removeItem = (productId, size) => {
    setCart((current) => current.filter((item) => !(item.productId === productId && item.size === size)));
  };

  const showDetails = (id) => {
    setSelectedProductId(id);
    goTo("detalhes");
  };

  const toggleFavorite = (productId) => {
    setFavoriteIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  };

  const applyNavFilter = (filter) => {
    setFilters({ ...defaultFilters, ...filter });
    goTo("produtos");
  };

  const isAdmin = Boolean(
    profile?.role === "admin"
    || (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))
  );

  useEffect(() => {
    if (page !== "admin") return;
    if (!user) {
      showToast("Entre com uma conta admin para acessar essa area.");
      goTo("login");
      return;
    }
    if (!isAdmin) {
      showToast("Seu usuario nao tem acesso ao admin.");
      goTo("home");
    }
  }, [page, user, isAdmin]);

  useEffect(() => {
    if (page !== "minha-conta" || user) return;
    showToast("Entre para acessar sua conta.");
    goTo("login");
  }, [page, user]);

  const logout = async () => {
    try {
      await signOutCustomer();
      setUser(null);
      setProfile(null);
      showToast("Voce saiu da sua conta.");
      goTo("home");
    } catch (error) {
      console.error(error);
      showToast("Nao foi possivel sair agora.");
    }
  };

  const selectedProduct = products.find((product) => product.id === selectedProductId) || products[0];

  return (
    <>
      <Header
        page={page}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        favoriteCount={favoriteIds.length}
        search={filters.search}
        filters={filters}
        setSearch={(search) => setFilters((current) => ({ ...current, search }))}
        goTo={goTo}
        applyNavFilter={applyNavFilter}
        user={user}
        isAdmin={isAdmin}
        onLogout={logout}
      />
      <main>
        {page === "home" && <HomePage products={products} onBuy={addToCart} onDetails={showDetails} goTo={goTo} applyNavFilter={applyNavFilter} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />}
        {page === "produtos" && <ProductsPage products={products} filters={filters} setFilters={setFilters} defaultFilters={defaultFilters} sort={sort} setSort={setSort} onBuy={addToCart} onDetails={showDetails} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />}
        {page === "favoritos" && <FavoritesPage products={products} favoriteIds={favoriteIds} onDetails={showDetails} onToggleFavorite={toggleFavorite} goTo={goTo} />}
        {page === "detalhes" && <ProductDetailPage product={selectedProduct} onAdd={addToCart} />}
        {page === "carrinho" && <CartPage items={cartItems} totals={totals} changeQuantity={changeQuantity} removeItem={removeItem} goTo={goTo} />}
        {page === "checkout" && <CheckoutPage totals={totals} cartItems={cartItems} user={user} profile={profile} showToast={showToast} goTo={goTo} />}
        {page === "minha-conta" && user && <AccountPage user={user} profile={profile} cartItems={cartItems} totals={totals} favoriteCount={favoriteIds.length} isAdmin={isAdmin} showToast={showToast} goTo={goTo} onProfileSaved={setProfile} onLogout={logout} />}
        {page === "login" && <LoginPage showToast={showToast} goTo={goTo} />}
        {page === "cadastro" && <SignupPage showToast={showToast} goTo={goTo} />}
        {page === "admin" && isAdmin && <AdminPage products={products} currentUser={user} showToast={showToast} addProduct={async (product) => {
          try {
            const savedProduct = await createProduct(product);
            setProducts((current) => [savedProduct, ...current]);
            showToast("Camisa cadastrada no Supabase.");
          } catch (error) {
            console.error(error);
            showToast("Nao foi possivel cadastrar no Supabase. Verifique a policy de insert.");
          }
        }} updateProduct={async (product) => {
          try {
            const savedProduct = await updateProduct(product);
            setProducts((current) => current.map((item) => item.id === savedProduct.id ? savedProduct : item));
            showToast("Camisa atualizada no Supabase.");
          } catch (error) {
            console.error(error);
            showToast("Nao foi possivel editar no Supabase. Verifique a policy de update.");
          }
        }} removeProduct={async (productId) => {
          try {
            await deleteProduct(productId);
            setProducts((current) => current.filter((item) => item.id !== productId));
            showToast("Camisa removida do catalogo.");
          } catch (error) {
            console.error(error);
            showToast("Nao foi possivel remover no Supabase. Verifique a policy de update/delete.");
          }
        }} />}
      </main>
      <Toast message={toast} />
    </>
  );
}
