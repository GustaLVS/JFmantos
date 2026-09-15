const columns = [
  ["Numero do pedido", ({ order }) => order.order_number || order.id],
  ["ID do pedido", ({ order }) => order.id],
  ["Data do pedido", ({ order }) => formatDateForCsv(order.created_at)],
  ["Status", ({ order, paymentStatus }) => paymentStatus],
  ["Cliente", ({ order }) => order.customer_name],
  ["E-mail", ({ order }) => order.customer_email],
  ["Telefone", ({ order }) => order.customer_phone],
  ["Documento", ({ order }) => order.customer_document],
  ["Endereco", ({ order }) => order.address],
  ["Cidade", ({ order }) => order.city],
  ["Estado", ({ order }) => order.state],
  ["CEP", ({ order }) => order.zip || order.zip_code],
  ["Metodo de pagamento", ({ order }) => order.payment_method],
  ["Status no pagamento", ({ payment }) => payment?.provider_status || payment?.status],
  ["ID no provedor", ({ order, payment }) => payment?.provider_payment_id || order.payment_provider_payment_id],
  ["Subtotal", ({ order }) => formatMoneyForCsv(order.subtotal)],
  ["Frete", ({ order }) => formatMoneyForCsv(order.shipping)],
  ["Desconto", ({ order }) => formatMoneyForCsv(order.discount)],
  ["Cupom", ({ order }) => order.promo_code],
  ["Desconto do cupom", ({ order }) => formatMoneyForCsv(order.promo_discount)],
  ["Total do pedido", ({ order }) => formatMoneyForCsv(order.total)],
  ["Codigo de rastreio", ({ order }) => order.tracking_code],
  ["Transportadora", ({ order }) => order.tracking_carrier],
  ["Produto", ({ item }) => item?.product_name],
  ["Time", ({ item }) => item?.team],
  ["Categoria", ({ item }) => item?.category],
  ["Temporada", ({ item }) => item?.season],
  ["Tamanho", ({ item }) => item?.size],
  ["Quantidade", ({ item }) => item?.quantity],
  ["Preco unitario", ({ item }) => formatMoneyForCsv(item?.unit_price)],
  ["Total do item", ({ item }) => formatMoneyForCsv(item?.total_price ?? item?.total)],
];

function formatDateForCsv(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function formatMoneyForCsv(value) {
  if (value === null || value === undefined || value === "") return "";
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2).replace(".", ",") : "";
}

function safeCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  const protectedText = /^[=+@]/.test(text) || /^-\D/.test(text) ? `'${text}` : text;
  return `"${protectedText.replaceAll('"', '""')}"`;
}

function getPaymentStatus(order) {
  const payment = order.payments?.[0];
  if (["cancelled", "canceled"].includes(order.status) || ["cancelled", "canceled"].includes(payment?.status)) return "Cancelado";
  if (order.status === "failed" || payment?.status === "rejected") return "Falhou";
  if (order.status === "paid" || payment?.status === "approved" || payment?.provider_status === "approved") return "Pago";
  return order.status || payment?.status || "Pendente";
}

export function createOrdersCsv(orders) {
  const header = columns.map(([label]) => safeCell(label)).join(";");
  const rows = orders.flatMap((order) => {
    const items = order.items?.length ? order.items : [null];
    const context = {
      order,
      payment: order.payments?.[0],
      paymentStatus: getPaymentStatus(order),
    };

    return items.map((item) => columns
      .map(([, getValue]) => safeCell(getValue({ ...context, item })))
      .join(";"));
  });

  return `\uFEFF${[header, ...rows].join("\r\n")}`;
}

export function downloadOrdersCsv(orders, filename) {
  if (!orders.length) throw new Error("Nao ha pedidos para exportar.");
  const blob = new Blob([createOrdersCsv(orders)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function ordersExportFilename(label = "pedidos") {
  const date = new Intl.DateTimeFormat("sv-SE").format(new Date());
  return `jfmantos-${label}-${date}.csv`;
}
