import { useEffect, useMemo, useState } from "react";
import { LuFileSpreadsheet, LuPackageCheck, LuRefreshCw, LuTrash2 } from "react-icons/lu";
import { deleteOrder, fetchAdminOrders, updateOrderTracking } from "../services/ordersApi.js";
import { downloadOrdersCsv, ordersExportFilename } from "../utils/exportOrdersCsv.js";
import { formatPrice } from "../utils/format.js";

const statusLabels = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
  failed: "Falhou",
  refunded: "Reembolsado",
};

const paymentLabels = {
  pix: "Pix",
  credit_card: "Cartao",
  boleto: "Boleto",
};

function getOrderPaymentStatus(order) {
  const payment = order.payments?.[0];
  if (["cancelled", "canceled"].includes(order.status) || ["cancelled", "canceled"].includes(payment?.status)) return "cancelled";
  if (order.status === "failed" || payment?.status === "rejected") return "failed";
  if (order.status === "paid" || payment?.status === "approved" || payment?.provider_status === "approved") return "paid";
  return order.status || payment?.status || "pending";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminOrdersPanel({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingTrackingId, setSavingTrackingId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (error) {
      console.error(error);
      showToast("Nao foi possivel carregar os pedidos. Verifique as policies do Supabase.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const stats = useMemo(() => {
    return orders.reduce((acc, order) => {
      const status = getOrderPaymentStatus(order);
      acc.total += Number(order.total || 0);
      if (status === "paid") acc.paid += Number(order.total || 0);
      acc.count += 1;
      acc.pending += status === "pending" ? 1 : 0;
      acc.paidCount += status === "paid" ? 1 : 0;
      acc.cancelled += status === "cancelled" ? 1 : 0;
      return acc;
    }, { count: 0, pending: 0, paidCount: 0, cancelled: 0, total: 0, paid: 0 });
  }, [orders]);

  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter((order) => getOrderPaymentStatus(order) === statusFilter);

  const saveTracking = async (event, orderId) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const trackingCode = form.get("trackingCode")?.toString();

    try {
      setSavingTrackingId(orderId);
      const updatedOrder = await updateOrderTracking(orderId, trackingCode);
      setOrders((current) => current.map((order) => (
        order.id === orderId ? { ...order, ...updatedOrder, items: order.items, payments: order.payments } : order
      )));
      showToast("Codigo de rastreio salvo para o cliente.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Nao foi possivel salvar o codigo de rastreio.");
    } finally {
      setSavingTrackingId(null);
    }
  };

  const removeOrder = async (order) => {
    const orderLabel = `#${order.order_number || order.id.slice(0, 8)}`;
    const confirmed = window.confirm(`Apagar o pedido ${orderLabel}? Esta acao tambem remove itens e pagamentos vinculados e nao pode ser desfeita. Se precisar guardar o registro, cancele e use "Salvar no Excel" primeiro.`);
    if (!confirmed) return;

    try {
      setDeletingOrderId(order.id);
      await deleteOrder(order.id);
      setOrders((current) => current.filter((item) => item.id !== order.id));
      if (expandedId === order.id) setExpandedId(null);
      showToast(`Pedido ${orderLabel} apagado.`);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Nao foi possivel apagar o pedido.");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const exportOrders = (ordersToExport, label = "pedidos") => {
    try {
      downloadOrdersCsv(ordersToExport, ordersExportFilename(label));
      showToast(`${ordersToExport.length} pedido(s) salvo(s) em arquivo compativel com Excel.`);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Nao foi possivel exportar os pedidos.");
    }
  };

  return (
    <section className="admin-users-panel admin-orders-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Pedidos</span>
          <h2>Pedidos recebidos</h2>
          <p>Acompanhe pedidos criados, status do pagamento e itens comprados.</p>
        </div>
        <div className="admin-panel-actions">
          <button
            className="button ghost"
            type="button"
            onClick={() => exportOrders(filteredOrders, statusFilter === "all" ? "pedidos" : `pedidos-${statusFilter}`)}
            disabled={loading || !filteredOrders.length}
          >
            <LuFileSpreadsheet aria-hidden="true" />
            Exportar para Excel
          </button>
          <button className="button ghost" type="button" onClick={loadOrders} disabled={loading}>
            <LuRefreshCw aria-hidden="true" />
            {loading ? "Atualizando" : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="order-stats">
        <article><span>Total de pedidos</span><strong>{stats.count}</strong></article>
        <article><span>Pagos</span><strong>{stats.paidCount}</strong></article>
        <article><span>Pendentes</span><strong>{stats.pending}</strong></article>
        <article><span>Cancelados</span><strong>{stats.cancelled}</strong></article>
        <article><span>Receita paga</span><strong>{formatPrice(stats.paid)}</strong></article>
      </div>

      <div className="order-filter-tabs" aria-label="Filtrar pedidos">
        {[
          ["all", "Todos"],
          ["pending", "Pendentes"],
          ["paid", "Pagos"],
          ["failed", "Falhos"],
          ["cancelled", "Cancelados"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={statusFilter === value ? "active" : ""}
            type="button"
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="orders-list">
        {loading && <div className="empty-state">Carregando pedidos...</div>}
        {!loading && filteredOrders.map((order) => {
          const payment = order.payments?.[0];
          const paymentStatus = getOrderPaymentStatus(order);
          const isOpen = expandedId === order.id;
          return (
            <article className="order-card" key={order.id}>
              <button className="order-summary" type="button" onClick={() => setExpandedId(isOpen ? null : order.id)}>
                <span className="order-number">#{order.order_number || order.id.slice(0, 8)}</span>
                <span>
                  <strong>{order.customer_name || "Cliente"}</strong>
                  <small>{order.customer_email}</small>
                </span>
                <span>
                  <strong>{formatPrice(Number(order.total || 0))}</strong>
                  <small>{formatDate(order.created_at)}</small>
                </span>
                <span className={`order-status ${paymentStatus}`}>
                  {statusLabels[paymentStatus] || paymentStatus || "Pendente"}
                </span>
              </button>

              {isOpen && (
                <div className="order-details">
                  <div className="order-detail-grid">
                    <div>
                      <h3>Cliente</h3>
                      <p>{order.customer_name}</p>
                      <p>{order.customer_email}</p>
                      <p>{order.customer_phone || "Telefone nao informado"}</p>
                    </div>
                    <div>
                      <h3>Entrega</h3>
                      <p>{order.address || "Endereco nao informado"}</p>
                      <p>{order.city || "-"} / {order.state || "-"}</p>
                      <p>CEP {order.zip || order.zip_code || "-"}</p>
                    </div>
                    <div>
                      <h3>Pagamento</h3>
                      <p>{paymentLabels[order.payment_method] || order.payment_method || "-"}</p>
                      <p>Status: {statusLabels[paymentStatus] || paymentStatus}</p>
                      <p>Mercado Pago: {payment?.provider_status || payment?.status || "pending"}</p>
                      {order.promo_code && <p>Cupom {order.promo_code}: -{formatPrice(Number(order.promo_discount || 0))}</p>}
                    </div>
                  </div>

                  <form className="tracking-form" onSubmit={(event) => saveTracking(event, order.id)}>
                    <div>
                      <h3><LuPackageCheck aria-hidden="true" /> Rastreio</h3>
                      <p>
                        {order.tracking_code
                          ? `Enviado pelos ${order.tracking_carrier || "Correios"}: ${order.tracking_code}`
                          : "Nenhum codigo enviado ao cliente ainda."}
                      </p>
                    </div>
                    <label>
                      Codigo dos Correios
                      <input name="trackingCode" defaultValue={order.tracking_code || ""} placeholder="Ex: BR123456789BR" />
                    </label>
                    <button className="button dark" type="submit" disabled={savingTrackingId === order.id}>
                      {savingTrackingId === order.id ? "Salvando..." : "Enviar codigo"}
                    </button>
                  </form>

                  <div className="order-items">
                    <h3>Itens</h3>
                    {order.items?.length ? order.items.map((item) => (
                      <div className="order-item-row" key={item.id}>
                        <span>{item.quantity}x</span>
                        <strong>{item.product_name}</strong>
                        <span>Tam. {item.size}</span>
                        <span>{formatPrice(Number(item.total_price || item.total || 0))}</span>
                      </div>
                    )) : <p>Nenhum item encontrado.</p>}
                  </div>

                  <div className="order-danger-zone">
                    <div>
                      <h3>Apagar pedido</h3>
                      <p>Salve uma copia antes se o registro puder ser necessario no futuro. A exclusao remove tambem itens e pagamentos vinculados.</p>
                    </div>
                    <div className="order-danger-actions">
                      <button
                        className="button ghost"
                        type="button"
                        onClick={() => exportOrders([order], `pedido-${order.order_number || order.id.slice(0, 8)}`)}
                        disabled={deletingOrderId === order.id}
                      >
                        <LuFileSpreadsheet aria-hidden="true" />
                        Salvar no Excel
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        onClick={() => removeOrder(order)}
                        disabled={deletingOrderId === order.id}
                      >
                        <LuTrash2 aria-hidden="true" />
                        {deletingOrderId === order.id ? "Apagando..." : "Apagar pedido"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
        {!loading && !filteredOrders.length && <div className="empty-state">Nenhum pedido encontrado.</div>}
      </div>
    </section>
  );
}
