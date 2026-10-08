export default function PersonalizationDetails({ name, number }) {
  if (!name && !number) return null;
  return (
    <p className="personalization-details">
      {name && <span>Nome: <strong>{name}</strong></span>}
      {number && <span>Numero: <strong>{number}</strong></span>}
    </p>
  );
}
