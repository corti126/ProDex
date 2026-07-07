import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pbh::partidas';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { partidas: [], activeId: null };
    const parsed = JSON.parse(raw);
    return { partidas: parsed.partidas || [], activeId: parsed.activeId || null };
  } catch {
    return { partidas: [], activeId: null };
  }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PartidasPage() {
  const [state, setState] = useState(() => loadState());
  const [newPartida, setNewPartida] = useState('');
  const [newRoute, setNewRoute] = useState('');

  useEffect(() => { saveState(state); }, [state]);

  const active = useMemo(
    () => state.partidas.find(p => p.id === state.activeId) || null,
    [state]
  );

  function createPartida(e) {
    e.preventDefault();
    const name = newPartida.trim();
    if (!name) return;
    const p = { id: uid(), name, deaths: 0, routes: [], createdAt: Date.now() };
    setState(s => ({ partidas: [...s.partidas, p], activeId: p.id }));
    setNewPartida('');
  }

  function selectPartida(id) {
    setState(s => ({ ...s, activeId: id }));
  }

  function deletePartida(id) {
    if (!confirm('¿Eliminar esta partida?')) return;
    setState(s => {
      const partidas = s.partidas.filter(p => p.id !== id);
      return { partidas, activeId: s.activeId === id ? (partidas[0]?.id || null) : s.activeId };
    });
  }

  function renamePartida(id, name) {
    setState(s => ({
      ...s,
      partidas: s.partidas.map(p => p.id === id ? { ...p, name } : p)
    }));
  }

  function updateActive(fn) {
    setState(s => ({
      ...s,
      partidas: s.partidas.map(p => p.id === s.activeId ? fn(p) : p)
    }));
  }

  function addRoute(e) {
    e.preventDefault();
    const name = newRoute.trim();
    if (!name || !active) return;
    updateActive(p => ({
      ...p,
      routes: [...p.routes, { id: uid(), name, done: false, pokemon: '' }]
    }));
    setNewRoute('');
  }

  function toggleRoute(rid) {
    updateActive(p => ({
      ...p,
      routes: p.routes.map(r => r.id === rid ? { ...r, done: !r.done } : r)
    }));
  }

  function setPokemon(rid, value) {
    updateActive(p => ({
      ...p,
      routes: p.routes.map(r => r.id === rid ? { ...r, pokemon: value } : r)
    }));
  }

  function removeRoute(rid) {
    updateActive(p => ({ ...p, routes: p.routes.filter(r => r.id !== rid) }));
  }

  function changeDeaths(delta) {
    updateActive(p => ({ ...p, deaths: Math.max(0, (p.deaths || 0) + delta) }));
  }

  const captured = active?.routes.filter(r => r.done).length || 0;

  return (
    <section className="page page-partidas">
      <div className="page-head">
        <h1>Partidas</h1>
        <p className="page-sub">Gestiona tus partidas: rutas, capturas y muertes.</p>
      </div>

      <div className="partidas-layout">
        <aside className="partidas-list">
          <form className="partidas-new" onSubmit={createPartida}>
            <input
              className="search-input"
              placeholder="Nombre de la partida (ej: Nuzlocke Rojo)"
              value={newPartida}
              onChange={e => setNewPartida(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">Crear</button>
          </form>

          {state.partidas.length === 0 ? (
            <div className="empty-state small">Aún no tienes partidas.</div>
          ) : (
            <ul className="partidas-ul">
              {state.partidas.map(p => (
                <li key={p.id}>
                  <button
                    className={'partida-item' + (p.id === state.activeId ? ' active' : '')}
                    onClick={() => selectPartida(p.id)}
                  >
                    <span className="partida-item-name">{p.name}</span>
                    <span className="partida-item-meta">
                      {p.routes.filter(r => r.done).length}/{p.routes.length} · ☠ {p.deaths}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="partidas-detail">
          {!active ? (
            <div className="empty-state">Crea o selecciona una partida para empezar.</div>
          ) : (
            <>
              <section className="card partida-head-card">
                <input
                  className="partida-title-input"
                  value={active.name}
                  onChange={e => renamePartida(active.id, e.target.value)}
                  aria-label="Nombre de la partida"
                />
                <div className="partida-head-actions">
                  <div className="partida-summary">
                    <span><strong>{captured}</strong> capturas</span>
                    <span><strong>{active.routes.length}</strong> rutas</span>
                  </div>
                  <button className="btn btn-danger" onClick={() => deletePartida(active.id)}>
                    Eliminar partida
                  </button>
                </div>
              </section>

              <section className="card deaths-card">
                <h3>Contador de muertes</h3>
                <div className="deaths-counter">
                  <button className="deaths-btn" onClick={() => changeDeaths(-1)} aria-label="Restar muerte">−</button>
                  <div className="deaths-value">{active.deaths}</div>
                  <button className="deaths-btn" onClick={() => changeDeaths(1)} aria-label="Sumar muerte">+</button>
                </div>
              </section>

              <section className="card">
                <h3>Rutas y capturas</h3>
                <form className="route-new" onSubmit={addRoute}>
                  <input
                    className="search-input"
                    placeholder="Nueva ruta (ej: Ruta 1, Bosque Verde)"
                    value={newRoute}
                    onChange={e => setNewRoute(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit">Añadir</button>
                </form>

                {active.routes.length === 0 ? (
                  <p className="muted" style={{ marginTop: '.75rem' }}>Todavía no has añadido ninguna ruta.</p>
                ) : (
                  <ul className="routes-ul">
                    {active.routes.map(r => (
                      <li key={r.id} className={'route-row' + (r.done ? ' done' : '')}>
                        <label className="route-check">
                          <input
                            type="checkbox"
                            checked={r.done}
                            onChange={() => toggleRoute(r.id)}
                          />
                          <span className="route-name">{r.name}</span>
                        </label>
                        <input
                          className="route-pokemon"
                          placeholder={r.done ? 'Pokémon capturado' : 'Marca la ruta para anotar captura'}
                          value={r.pokemon}
                          onChange={e => setPokemon(r.id, e.target.value)}
                          disabled={!r.done}
                        />
                        <button
                          className="route-remove"
                          onClick={() => removeRoute(r.id)}
                          aria-label="Eliminar ruta"
                          title="Eliminar ruta"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
