export default function ErrorMsg({ title = 'Algo salió mal', message, onRetry }) {
  return (
    <div className="error-msg">
      <div className="error-icon">!</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {onRetry && (
        <button className="btn" onClick={onRetry}>Reintentar</button>
      )}
    </div>
  );
}
