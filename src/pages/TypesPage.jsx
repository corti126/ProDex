import { useMemo, useState } from 'react';
import { TYPES, TYPE_ES, getAttackMultiplier, defensiveProfile, bucketize, offensiveProfile } from '../data/typeChart.js';
import TypeBadge from '../components/TypeBadge.jsx';

export default function TypesPage() {
  const [selected, setSelected] = useState('fire');
  const [t1, setT1] = useState('water');
  const [t2, setT2] = useState('flying');

  const off = useMemo(() => offensiveProfile(selected), [selected]);
  const defendingAs = useMemo(() => {
    const recv = {};
    for (const atk of TYPES) recv[atk] = getAttackMultiplier(atk, selected);
    return recv;
  }, [selected]);

  const comboTypes = t2 && t2 !== 'none' ? [t1, t2] : [t1];
  const comboBuckets = useMemo(() => bucketize(defensiveProfile(comboTypes)), [comboTypes]);

  return (
    <section className="page page-types">
      <div className="page-head">
        <h1>Tipos</h1>
        <p className="page-sub">18 tipos · efectividades oficiales · calculadora de combinaciones.</p>
      </div>

      <div className="types-grid">
        {TYPES.map(t => (
          <button
            key={t}
            className={'type-pick' + (selected === t ? ' active' : '')}
            onClick={() => setSelected(t)}
          >
            <TypeBadge type={t} size="md" />
          </button>
        ))}
      </div>

      <section className="card">
        <h3>{TYPE_ES[selected]} — Ofensiva</h3>
        <div className="effect-rows">
          <Row label="Súper eficaz contra" items={off.sup} />
          <Row label="No es muy eficaz contra" items={off.notVery} />
          <Row label="No afecta a" items={off.no} />
        </div>
        <h3 style={{ marginTop: '1.5rem' }}>{TYPE_ES[selected]} — Defensiva</h3>
        <div className="effect-rows">
          <Row label="Débil contra" items={Object.entries(defendingAs).filter(([,m])=>m>1).map(([t])=>t)} />
          <Row label="Resiste a" items={Object.entries(defendingAs).filter(([,m])=>m>0&&m<1).map(([t])=>t)} />
          <Row label="Inmune a" items={Object.entries(defendingAs).filter(([,m])=>m===0).map(([t])=>t)} />
        </div>
      </section>

      <section className="card combo-card">
        <h3>Calculadora de combinación</h3>
        <p className="muted">Selecciona uno o dos tipos para ver el perfil defensivo combinado.</p>
        <div className="combo-selects">
          <label>
            Tipo 1
            <select value={t1} onChange={e => setT1(e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_ES[t]}</option>)}
            </select>
          </label>
          <label>
            Tipo 2 (opcional)
            <select value={t2} onChange={e => setT2(e.target.value)}>
              <option value="none">— Ninguno —</option>
              {TYPES.filter(t => t !== t1).map(t => <option key={t} value={t}>{TYPE_ES[t]}</option>)}
            </select>
          </label>
        </div>
        <div className="combo-preview">
          {comboTypes.map(t => <TypeBadge key={t} type={t} size="lg" />)}
        </div>
        <Buckets buckets={comboBuckets} />
      </section>
    </section>
  );
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

function Buckets({ buckets }) {
  const rows = [
    { key: 'x4', label: 'Débil x4', cls: 'bucket-weak4' },
    { key: 'x2', label: 'Débil x2', cls: 'bucket-weak2' },
    { key: 'x05', label: 'Resiste x0.5', cls: 'bucket-res' },
    { key: 'x025', label: 'Resiste x0.25', cls: 'bucket-res2' },
    { key: 'x0', label: 'Inmune', cls: 'bucket-imm' },
  ];
  return (
    <div className="buckets">
      {rows.map(r => (
        <div key={r.key} className={`bucket ${r.cls}`}>
          <div className="bucket-label">{r.label}</div>
          <div className="bucket-list">
            {buckets[r.key].length === 0 ? <span className="muted">—</span> :
              buckets[r.key].map(t => <TypeBadge key={t} type={t} size="sm" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
