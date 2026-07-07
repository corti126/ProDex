import { useEffect, useMemo, useState } from 'react';
import { getMove, listAllMoves, pickEsName } from '../api/pokeapi.js';
import { offensiveProfile, TYPE_ES } from '../data/typeChart.js';
import TypeBadge from '../components/TypeBadge.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMsg from '../components/ErrorMsg.jsx';

const CAT_ES = { physical: 'Físico', special: 'Especial', status: 'Estado' };

export default function MovesPage() {
  const [allMoves, setAllMoves] = useState([]);
  const [listError, setListError] = useState(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [move, setMove] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listAllMoves()
      .then(d => setAllMoves(d.results))
      .catch(() => setListError('No se pudo cargar la lista de movimientos.'));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allMoves.slice(0, 60);
    return allMoves.filter(m => m.name.includes(q)).slice(0, 120);
  }, [query, allMoves]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true); setError(null);
    getMove(selected)
      .then(setMove)
      .catch(() => setError('No se pudo cargar ese movimiento.'))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <section className="page page-moves">
      <div className="page-head">
        <h1>Movimientos</h1>
        <p className="page-sub">Busca cualquier movimiento por nombre (coincidencia parcial).</p>
      </div>

      <div className="moves-layout">
        <aside className="moves-list">
          <input
            className="search-input"
            placeholder="Buscar movimiento (ej: thunderbolt)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {listError && <ErrorMsg message={listError} />}
          {!listError && allMoves.length === 0 && <Loader label="Cargando movimientos..." />}
          <ul className="moves-ul">
            {filtered.map(m => (
              <li key={m.name}>
                <button
                  className={'move-item' + (selected === m.name ? ' active' : '')}
                  onClick={() => setSelected(m.name)}
                >
                  {m.name.replace(/-/g, ' ')}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="muted" style={{padding:'.5rem'}}>Sin resultados</li>}
          </ul>
        </aside>

        <div className="moves-detail">
          {!selected && <div className="empty-state">Selecciona un movimiento para ver sus detalles.</div>}
          {loading && <Loader label="Cargando movimiento..." />}
          {error && <ErrorMsg message={error} />}
          {!loading && !error && move && <MoveDetail move={move} />}
        </div>
      </div>
    </section>
  );
}

function MoveDetail({ move }) {
  const type = move.type.name;
  const cat = move.damage_class?.name;
  const nameEs = pickEsName(move.names, move.name.replace(/-/g, ' '));
  const effectEntry = move.effect_entries?.find(e => e.language.name === 'en');
  const flavor = move.flavor_text_entries?.find(e => e.language.name === 'es')
    || move.flavor_text_entries?.find(e => e.language.name === 'en');
  const off = offensiveProfile(type);

  const effectText = effectEntry?.short_effect?.replace(/\$effect_chance/g, move.effect_chance ?? '');

  return (
    <article className="move-card">
      <header className={`move-head type-bg-${type}`}>
        <h2>{nameEs}</h2>
        <div className="move-head-meta">
          <TypeBadge type={type} size="md" />
          <span className={`cat cat-${cat}`}>{CAT_ES[cat] || cat || '—'}</span>
        </div>
      </header>


      <div className="move-stats">
        <Stat label="Potencia" value={move.power ?? '—'} />
        <Stat label="Precisión" value={move.accuracy ? move.accuracy + '%' : '—'} />
        <Stat label="PP" value={move.pp ?? '—'} />
        <Stat label="Prioridad" value={move.priority ?? 0} />
        {move.effect_chance != null && <Stat label="Prob. efecto" value={move.effect_chance + '%'} />}
      </div>

      {effectText && (
        <section className="card">
          <h3>Efecto</h3>
          <p>{effectText}</p>
        </section>
      )}

      {flavor && (
        <section className="card">
          <h3>Descripción</h3>
          <p className="flavor">{flavor.flavor_text.replace(/\f|\n/g,' ')}</p>
        </section>
      )}

      <section className="card">
        <h3>Efectividad de tipo ({TYPE_ES[type]})</h3>
        <div className="effect-rows">
          <Row label="Eficaz contra" items={off.sup} />
          <Row label="No es eficaz contra" items={off.notVery} />
          <Row label="No afecta a" items={off.no} />
        </div>
      </section>
    </article>
  );
}

function Stat({ label, value }) {
  return <div className="move-stat"><span>{label}</span><strong>{value}</strong></div>;
}
function Row({ label, items }) {
  return (
    <div className="effect-row">
      <div className="effect-label">{label}</div>
      <div className="effect-items">
        {items.length === 0 ? <span className="muted">—</span> :
          items.map(t => <TypeBadge key={t} type={t} size="sm" />)}
      </div>
    </div>
  );
}
