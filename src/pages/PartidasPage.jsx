import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pbh::partidas';
const PAGE_SIZE = 10;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { partidas: [], activeId: null };
    const parsed = JSON.parse(raw);
    // Migración: rutas antiguas { done, pokemon } -> { status, pokemon }
    const partidas = (parsed.partidas || []).map(p => ({
      ...p,
      createdAt: p.createdAt || Date.now(),
      sessionBase: p.sessionBase ?? (p.routes?.length || 0),
      routes: (p.routes || []).map(r => ({
        id: r.id,
        name: r.name,
        pokemon: r.pokemon || '',
        // status: 'pending' | 'alive' | 'dead'
        status: r.status || (r.done ? (r.pokemon ? 'alive' : 'pending') : 'pending'),
      })),
    }));
    return { partidas, activeId: parsed.activeId || null };
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

function fmtDate(ts) {
  try { return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return ''; }
}

function statsFor(p) {
  const total = p.routes.length;
  const dead = p.routes.filter(r => r.status === 'dead').length;
  const alive = p.routes.filter(r => r.status === 'alive').length;
  const captured = alive + dead;
  const progress = total ? Math.round((captured / total) * 100) : 0;
  return { total, dead, alive, captured, progress };
}

export default function PartidasPage() {
  const [state, setState] = useState(() => loadState());
  const [newPartida, setNewPartida] = useState('');
  const [quickRoute, setQuickRoute] = useState('');
  const [quickPokemon, setQuickPokemon] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { setPage(1); }, [state.activeId, query, statusFilter, sortBy]);

  const active = useMemo(
    () => state.partidas.find(p => p.id === state.activeId) || null,
    [state]
  );

  function createPartida(e) {
    e.preventDefault();
    const name = newPartida.trim();
    if (!name) return;
    const p = { id: uid(), name, routes: [], createdAt: Date.now(), sessionBase: 0 };
    setState(s => ({ partidas: [...s.partidas, p], activeId: p.id }));
    setNewPartida('');
  }

  function selectPartida(id) {
    setState(s => {
      const partidas = s.partidas.map(p =>
        p.id === id ? { ...p, sessionBase: p.routes.length } : p
      );
      return { partidas, activeId: id };
    });
  }

  function deletePartida(id) {
    if (!confirm('¿Eliminar esta partida?')) return;
    setState(s => {
      const partidas = s.partidas.filter(p => p.id !== id);
      return { partidas, activeId: s.activeId === id ? (partidas[0]?.id || null) : s.activeId };
    });
  }

  function renamePartida(id, name) {
    setState(s => ({ ...s, partidas: s.partidas.map(p => p.id === id ? { ...p, name } : p) }));
  }

  function updateActive(fn) {
    setState(s => ({
      ...s,
      partidas: s.partidas.map(p => p.id === s.activeId ? fn(p) : p),
    }));
  }

  function quickCapture(e) {
    e.preventDefault();
    if (!active) return;
    const rname = quickRoute.trim();
    const poke = quickPokemon.trim();
    if (!rname || !poke) return;
    updateActive(p => ({
      ...p,
      routes: [...p.routes, { id: uid(), name: rname, pokemon: poke, status: 'alive' }],
    }));
    setQuickRoute('');
    setQuickPokemon('');
  }

  function setStatus(rid, status) {
    updateActive(p => ({
      ...p,
      routes: p.routes.map(r => r.id === rid ? { ...r, status } : r),
    }));
  }

  function setPokemon(rid, value) {
    updateActive(p => ({
      ...p,
      routes: p.routes.map(r => r.id === rid ? { ...r, pokemon: value } : r),
    }));
  }

  function removeRoute(rid) {
    updateActive(p => ({ ...p, routes: p.routes.filter(r => r.id !== rid) }));
  }

  const stats = active ? statsFor(active) : null;
  const newThisSession = active ? Math.max(0, active.routes.length - (active.sessionBase || 0)) : 0;

  const filteredRoutes = useMemo(() => {
    if (!active) return [];
    let list = [...active.routes];
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(r =>
      r.name.toLowerCase().includes(q) || (r.pokemon || '').toLowerCase().includes(q)
    );
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    if (sortBy === 'recent') list.reverse();
    else if (sortBy === 'route') list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    else if (sortBy === 'pokemon') list.sort((a, b) => (a.pokemon || '').localeCompare(b.pokemon || '', 'es'));
    return list;
  }, [active, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRoutes = filteredRoutes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className="page page-partidas">
      <div className="page-head">
        <h1>Partidas · Nuzlocke Tracker</h1>
        <p className="page-sub">Registra capturas por ruta y controla qué Pokémon siguen vivos.</p>
      </div>

      <div className="partidas-layout">
        {/* SIDEBAR */}
        <aside className="partidas-list nuzlocke-sidebar">
          <form className="partidas-new" onSubmit={createPartida}>
            <input
              className="search-input"
              placeholder="Nueva partida…"
              value={newPartida}
              onChange={e => setNewPartida(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">+ Crear</button>
          </form>

          {state.partidas.length === 0 ? (
            <div className="empty-state small">Aún no tienes partidas.</div>
          ) : (
            <ul className="partidas-ul">
              {state.partidas.map(p => {
                const st = statsFor(p);
                return (
                  <li key={p.id}>
                    <button
                      className={'partida-item nz-partida' + (p.id === state.activeId ? ' active' : '')}
                      onClick={() => selectPartida(p.id)}
                    >
                      <span className="partida-item-name">{p.name}</span>
                      <span className="nz-partida-date">{fmtDate(p.createdAt)}</span>
                      <span className="nz-partida-metrics">
                        <span className="nz-metric nz-metric-progress">{st.captured}/{st.total}</span>
                        <span className="nz-metric nz-metric-dead">☠ {st.dead}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* DETAIL */}
        <div className="partidas-detail">
          {!active ? (
            <div className="empty-state">Crea o selecciona una partida para empezar.</div>
          ) : (
            <>
              {/* HEADER */}
              <section className="card nz-head-card">
                <div className="nz-head-title">
                  <span className="nz-badge nz-badge-blue">Partida activa</span>
                  <input
                    className="partida-title-input"
                    value={active.name}
                    onChange={e => renamePartida(active.id, e.target.value)}
                    aria-label="Nombre de la partida"
                  />
                </div>
                <button className="btn btn-danger nz-delete-btn" onClick={() => deletePartida(active.id)}>
                  Eliminar
                </button>
              </section>

              {/* STATS */}
              <section className="nz-stats-grid">
                <div className="nz-stat-card">
                  <div className="nz-stat-label"><span aria-hidden="true">🗺</span> Rutas registradas</div>
                  <div className="nz-stat-value">{stats.total}</div>
                  <div className="nz-stat-sub">{newThisSession > 0 ? `+${newThisSession} esta sesión` : 'Sin cambios esta sesión'}</div>
                </div>
                <div className="nz-stat-card nz-stat-alive">
                  <div className="nz-stat-label"><span aria-hidden="true">✓</span> Capturas vivas</div>
                  <div className="nz-stat-value">{stats.alive}</div>
                  <div className="nz-stat-sub">Disponibles para usar</div>
                </div>
                <div className="nz-stat-card nz-stat-dead">
                  <div className="nz-stat-label"><span aria-hidden="true">☠</span> Muertes</div>
                  <div className="nz-stat-value">{stats.dead}</div>
                  <div className="nz-stat-sub">Pokémon perdidos</div>
                </div>
                <div className="nz-stat-card nz-stat-progress">
                  <div className="nz-stat-label"><span aria-hidden="true">%</span> Progreso</div>
                  <div className="nz-stat-value">{stats.progress}%</div>
                  <div className="nz-stat-sub">{stats.captured} de {stats.total} rutas</div>
                </div>
              </section>

              {/* QUICK CAPTURE */}
              <section className="card nz-capture-card">
                <h3 className="nz-section-title">Añadir captura</h3>
                <form className="nz-capture-form" onSubmit={quickCapture}>
                  <input
                    className="search-input"
                    placeholder="Ruta (ej: Ruta 2, Bosque Verde)"
                    value={quickRoute}
                    onChange={e => setQuickRoute(e.target.value)}
                  />
                  <input
                    className="search-input"
                    placeholder="Pokémon capturado"
                    value={quickPokemon}
                    onChange={e => setQuickPokemon(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit">Registrar captura</button>
                </form>
              </section>

              {/* ROUTES TABLE */}
              <section className="card nz-routes-card">
                <div className="nz-routes-toolbar">
                  <input
                    className="search-input nz-toolbar-search"
                    placeholder="Buscar ruta o Pokémon"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  <select
                    className="nz-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    aria-label="Filtrar por estado"
                  >
                    <option value="all">Todos</option>
                    <option value="alive">Vivos</option>
                    <option value="dead">Muertos</option>
                    <option value="pending">Pendientes</option>
                  </select>
                  <select
                    className="nz-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    aria-label="Ordenar"
                  >
                    <option value="recent">Recientes</option>
                    <option value="route">Ruta A-Z</option>
                    <option value="pokemon">Pokémon A-Z</option>
                  </select>
                </div>

                {filteredRoutes.length === 0 ? (
                  <p className="muted" style={{ marginTop: '.75rem' }}>
                    {active.routes.length === 0
                      ? 'Todavía no has registrado ninguna captura.'
                      : 'Ninguna ruta coincide con los filtros.'}
                  </p>
                ) : (
                  <ul className="nz-routes-list">
                    {pageRoutes.map(r => (
                      <li key={r.id} className={`nz-route-row nz-route-${r.status}`}>
                        <span className="nz-route-icon" aria-hidden="true">
                          {r.status === 'alive' ? '✓' : r.status === 'dead' ? '✕' : '○'}
                        </span>
                        <span className="nz-route-name">{r.name}</span>
                        <input
                          className="nz-route-poke-input"
                          placeholder="Pokémon"
                          value={r.pokemon}
                          onChange={e => setPokemon(r.id, e.target.value)}
                        />
                        <span className={`nz-badge nz-badge-${r.status}`}>
                          {r.status === 'alive' ? 'Vivo' : r.status === 'dead' ? 'Muerto' : 'Pendiente'}
                        </span>
                        <div className="nz-route-actions">
                          {r.status === 'dead' ? (
                            <button
                              className="nz-action-btn nz-action-revoke"
                              onClick={() => setStatus(r.id, 'alive')}
                              title="Revocar muerte"
                            >
                              ↺ Revocar
                            </button>
                          ) : (
                            <button
                              className="nz-action-btn nz-action-kill"
                              onClick={() => setStatus(r.id, 'dead')}
                              title="Marcar como muerto"
                            >
                              ☠ Marcar muerto
                            </button>
                          )}
                          <button
                            className="nz-action-btn nz-action-remove"
                            onClick={() => removeRoute(r.id)}
                            title="Eliminar ruta"
                            aria-label="Eliminar ruta"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {filteredRoutes.length > 0 && (
                  <div className="nz-pagination">
                    <span className="nz-pagination-info">
                      Mostrando {pageRoutes.length} de {filteredRoutes.length} rutas
                    </span>
                    <div className="nz-pagination-controls">
                      <button
                        className="nz-page-btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >‹ Anterior</button>
                      <span className="nz-page-current">{currentPage} / {totalPages}</span>
                      <button
                        className="nz-page-btn"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >Siguiente ›</button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
