import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Loader from './components/Loader.jsx';

const PokemonPage = lazy(() => import('./pages/PokemonPage.jsx'));
const TypesPage = lazy(() => import('./pages/TypesPage.jsx'));
const MovesPage = lazy(() => import('./pages/MovesPage.jsx'));
const PartidasPage = lazy(() => import('./pages/PartidasPage.jsx'));

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Suspense fallback={<Loader label="Cargando sección..." />}>
          <Routes>
            <Route path="/" element={<Navigate to="/pokemon" replace />} />
            <Route path="/pokemon" element={<PokemonPage />} />
            <Route path="/pokemon/:name" element={<PokemonPage />} />
            <Route path="/tipos" element={<TypesPage />} />
            <Route path="/movimientos" element={<MovesPage />} />
            <Route path="/partidas" element={<PartidasPage />} />
            <Route path="*" element={<div className="not-found">404 — Página no encontrada</div>} />
          </Routes>
        </Suspense>
      </main>
      <footer className="app-footer">
        Datos: <a href="https://pokeapi.co" target="_blank" rel="noreferrer">PokéAPI</a> · Pokémon Battle Helper
      </footer>
    </div>
  );
}
