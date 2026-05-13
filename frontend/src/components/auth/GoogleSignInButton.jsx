export default function GoogleSignInButton({ label, onClick, disabled, style }) {
  return (
    <button className="btn-primary" onClick={onClick} disabled={disabled} style={style}>
      <span style={{ marginRight: 6 }}>
        <svg width="18" height="18" viewBox="0 0 48 48" style={{ verticalAlign: 'middle' }}>
          <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3L37.5 9.4C34.1 6.3 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3L37.5 9.4C34.1 6.3 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5L31.8 34c-2 1.6-4.6 2.5-7.8 2.5-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l5.6 4.9C40.3 36.3 44 30.6 44 24c0-1.3-.1-2.6-.4-3.9z"/>
        </svg>
      </span>
      {label || 'Continuar com Google'}
    </button>
  );
}
