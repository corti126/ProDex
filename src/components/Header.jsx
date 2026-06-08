import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <NavLink to="/pokemon" className="brand">
          <span className="pokeball" aria-hidden="true" />
          <span className="brand-text">
            Pokémon <span className="brand-text-accent">Battle Helper</span>
          </span>
        </NavLink>
        <nav className="main-nav">
          <NavLink to="/pokemon" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Pokémon</NavLink>
          <NavLink to="/tipos" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Tipos</NavLink>
          <NavLink to="/movimientos" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Movimientos</NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
