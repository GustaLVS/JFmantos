export function cardBackground(product) {
  const [a, b] = product.colors || ["#eaf1f0", "#ffffff"];
  return `linear-gradient(135deg, ${a}22, ${b}88)`;
}

export function productImages(product) {
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  if (images.length) return images;
  return product.image ? [product.image] : [];
}

export function ShirtArt({ product, compact = false }) {
  const [primary, secondary, accent] = product.colors || ["#0d7c3f", "#ffffff", "#101114"];
  const gradientId = `g-${product.id}-${compact ? "small" : "big"}`;

  return (
    <svg className="shirt-art" viewBox="0 0 320 390" role="img" aria-label={product.name} style={{ maxHeight: compact ? 220 : 420 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={primary} />
          <stop offset="1" stopColor={secondary} />
        </linearGradient>
      </defs>
      <path d="M99 38 53 57 22 122l50 27 18-35v216c0 16 13 29 29 29h82c16 0 29-13 29-29V114l18 35 50-27-31-65-46-19-35 38h-52L99 38Z" fill={`url(#${gradientId})`} />
      <path d="M134 76h52l20-22c-11 31-82 31-93 0l21 22Z" fill={accent} opacity=".92" />
      <path d="M94 118h132v34H94z" fill={accent} opacity=".16" />
      <path d="M106 182h108v13H106zM106 214h108v13H106z" fill={accent} opacity=".28" />
      <circle cx="160" cy="137" r="28" fill={accent} opacity=".82" />
      <text x="160" y="146" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="900" fill="#fff">
        {product.team.slice(0, 2).toUpperCase()}
      </text>
      <path d="M99 38 53 57 22 122l50 27 18-35v216c0 16 13 29 29 29h82c16 0 29-13 29-29V114l18 35 50-27-31-65-46-19-35 38h-52L99 38Z" fill="none" stroke="rgba(16,17,20,.22)" strokeWidth="5" />
    </svg>
  );
}

export function ProductImage({ product, compact = false, src }) {
  const image = src || productImages(product)[0];
  if (image) return <img src={image} alt={product.name} />;
  return <ShirtArt product={product} compact={compact} />;
}
