import { useEffect, useMemo, useState } from "react";
import { LuChevronDown, LuHeart, LuLogOut, LuPackage, LuShieldCheck, LuShoppingBag, LuTruck, LuUserRound } from "react-icons/lu";
import { saveCustomerProfile } from "../services/authApi.js";
import { fetchUserOrders } from "../services/ordersApi.js";
import { formatPrice } from "../utils/format.js";

const statusLabels = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  failed: "Falhou",
  refunded: "Reembolsado",
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getOrderPaymentStatus(order) {
  const payment = order.payments?.[0];
  if (["cancelled", "canceled"].includes(order.status) || ["cancelled", "canceled"].includes(payment?.status)) return "cancelled";
  if (order.status === "failed" || payment?.status === "rejected") return "failed";
  if (order.status === "paid" || payment?.status === "approved" || payment?.provider_status === "approved") return "paid";
  return order.status || payment?.status || "pending";
}

export default function AccountPage({ user, profile, cartItems, totals, favoriteCount, isAdmin, showToast, goTo, onProfileSaved, onLogout }) {
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const initialProfile = useMemo(() => ({
    name: profile?.name || user?.user_metadata?.full_name || "",
    email: profile?.email || user?.email || "",
    phone: profile?.phone || user?.user_metadata?.phone || "",
    document: profile?.document || user?.user_metadata?.document || "",
  }), [profile, user]);

  useEffect(() => {
    if (!user) goTo("login");
  }, [user, goTo]);

  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    async function loadOrders() {
      try {
        setOrdersLoading(true);
        const data = await fetchUserOrders(user.id);
        if (active) setOrders(data);
      } catch (error) {
        console.error(error);
        if (active) showToast("Nao foi possivel carregar seus pedidos.");
      } finally {
        if (active) setOrdersLoading(false);
      }
    }

    loadOrders();
    return () => {
      active = false;
    };
  }, [user?.id, showToast]);

  if (!user) return null;

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextProfile = {
      id: user.id,
      name: form.get("name")?.toString().trim(),
      email: initialProfile.email,
      phone: form.get("phone")?.toString().trim(),
      document: form.get("document")?.toString().trim(),
    };

    try {
      setSaving(true);
      const savedProfile = await saveCustomerProfile(nextProfile);
      onProfileSaved(savedProfile || nextProfile);
      showToast("Dados da conta atualizados.");
    } catch (error) {
      console.error(error);
      showToast("Nao foi possivel atualizar seus dados agora.");
    } finally {
      setSaving(false);
    }
  };

  const recentItems = cartItems.slice(0, 3);

  const copyTrackingCode = async (trackingCode) => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      showToast("Codigo de rastreio copiado.");
    } catch (error) {
      console.error(error);
      showToast("Nao foi possivel copiar o codigo.");
    }
  };

  return (
    <section className="page active account-page">
      <div className="account-hero">
        <div>
          <span className="eyebrow">Minha conta</span>
          <h1>Seu espaco JFMANTOS</h1>
          <p>Gerencie seus dados, acompanhe seus atalhos de compra e volte rapido para as camisas que voce salvou.</p>
        </div>
        <div className="account-status-card">
          <LuShieldCheck aria-hidden="true" />
          <strong>{isAdmin ? "Conta administradora" : "Conta cliente"}</strong>
          <span>{initialProfile.email}</span>
        </div>
      </div>

      <div className="account-layout">
        <form className="account-panel account-profile-form" onSubmit={submit}>
          <div className="account-panel-head">
            <LuUserRound aria-hidden="true" />
            <div>
              <h2>Dados pessoais</h2>
              <p>Essas informacoes ficam prontas para pedidos, entregas e futuras areas autenticadas.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="wide">Nome completo<input name="name" defaultValue={initialProfile.name} placeholder="Seu nome" /></label>
            <label className="wide">E-mail<input name="email" value={initialProfile.email} disabled /></label>
            <label>Telefone<input name="phone" defaultValue={initialProfile.phone} placeholder="(00) 00000-0000" /></label>
            <label>CPF<input name="document" defaultValue={initialProfile.document} placeholder="000.000.000-00" /></label>
          </div>

          <button className="button dark full" type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar dados"}
          </button>
        </form>

        <aside className="account-side">
          <div className="account-panel account-summary-card">
            <div className="account-panel-head">
              <LuShoppingBag aria-hidden="true" />
              <div>
                <h2>Resumo rapido</h2>
                <p>Itens em andamento na sua experiencia de compra.</p>
              </div>
            </div>
            <div className="account-metrics">
              <button type="button" onClick={() => goTo("favoritos")}>
                <LuHeart aria-hidden="true" />
                <strong>{favoriteCount}</strong>
                <span>Favoritos</span>
              </button>
              <button type="button" onClick={() => goTo("carrinho")}>
                <LuShoppingBag aria-hidden="true" />
                <strong>{cartItems.length}</strong>
                <span>Carrinho</span>
              </button>
              <button type="button" onClick={() => goTo("checkout")}>
                <LuPackage aria-hidden="true" />
                <strong>{formatPrice(totals.total)}</strong>
                <span>Total atual</span>
              </button>
            </div>
          </div>

          <div className="account-panel">
            <h2>Carrinho em andamento</h2>
            {recentItems.length ? (
              <div className="account-order-list">
                {recentItems.map(({ product, size, quantity }) => (
                  <article key={`${product.id}-${size}`}>
                    <span>{quantity}x</span>
                    <div>
                      <strong>{product.name}</strong>
                      <p>Tamanho {size} - {formatPrice(product.price * quantity)}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="account-muted">Seu carrinho esta vazio por enquanto.</p>
            )}
            <button className="button ghost full" type="button" onClick={() => goTo("produtos")}>Ver camisas</button>
          </div>

          <div className="account-panel customer-orders-panel">
            <div className="account-panel-head">
              <LuTruck aria-hidden="true" />
              <div>
                <h2>Meus pedidos</h2>
                <p>Veja pagamento, entrega e rastreio dos seus pedidos.</p>
              </div>
            </div>

            {ordersLoading && <p className="account-muted">Carregando seus pedidos...</p>}
            {!ordersLoading && !orders.length && <p className="account-muted">Voce ainda nao fez nenhum pedido.</p>}

            {!ordersLoading && orders.length > 0 && (
              <div className="customer-orders-list">
                {orders.map((order) => {
                  const isOpen = expandedOrderId === order.id;
                  const status = getOrderPaymentStatus(order);
                  return (
                    <article className="customer-order-card" key={order.id}>
                      <button type="button" className="customer-order-summary" onClick={() => setExpandedOrderId(isOpen ? null : order.id)}>
                        <span>
                          <strong>Pedido #{order.order_number || order.id.slice(0, 8)}</strong>
                          <small>{formatDate(order.created_at)}</small>
                        </span>
                        <span className={`order-status ${status}`}>{statusLabels[status] || status}</span>
                        <LuChevronDown aria-hidden="true" className={isOpen ? "open" : ""} />
                      </button>

                      {isOpen && (
                        <div className="customer-order-details">
                          <div className={`customer-order-message ${order.tracking_code ? "shipped" : "preparing"}`}>
                            <LuPackage aria-hidden="true" />
                            <div>
                              {order.tracking_code ? (
                                <>
                                  <strong>Seu pedido esta a caminho pelos Correios.</strong>
                                  <p>
                                    Acompanhe pelo codigo{" "}
                                    <button className="tracking-code-copy" type="button" onClick={() => copyTrackingCode(order.tracking_code)} title="Copiar codigo de rastreio">
                                      {order.tracking_code}
                                    </button>
                                  </p>
                                </>
                              ) : (
                                <>
                                  <strong>Estamos preparando seu pedido, aguarde.</strong>
                                  <p>Assim que o codigo de rastreio for enviado, ele aparecera aqui.</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="customer-order-lines">
                            <p><strong>Total:</strong> {formatPrice(Number(order.total || 0))}</p>
                            <p><strong>Pagamento:</strong> {statusLabels[status] || status}</p>
                            <p><strong>Entrega:</strong> {order.city || "-"} / {order.state || "-"} - CEP {order.zip || order.zip_code || "-"}</p>
                          </div>

                          <div className="account-order-list compact">
                            {order.items?.length ? order.items.map((item) => (
                              <article key={item.id}>
                                <span>{item.quantity}x</span>
                                <div>
                                  <strong>{item.product_name}</strong>
                                  <p>Tamanho {item.size} - {formatPrice(Number(item.total_price || item.total || 0))}</p>
                                </div>
                              </article>
                            )) : <p className="account-muted">Itens indisponiveis para este pedido.</p>}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="account-actions">
            {isAdmin && <button className="button dark full" type="button" onClick={() => goTo("admin")}>Abrir admin</button>}
            <button className="button ghost full" type="button" onClick={onLogout}><LuLogOut aria-hidden="true" />Sair da conta</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
