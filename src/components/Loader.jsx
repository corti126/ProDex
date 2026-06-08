export default function Loader({ label = 'Cargando...' }) {
  return (
    <div className="loader">
      <span className="loader-ball" />
      <span className="loader-text">{label}</span>
    </div>
  );
}
