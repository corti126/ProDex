import { TYPE_ES } from '../data/typeChart.js';

export default function TypeBadge({ type, size = 'md', as = 'span', onClick }) {
  const Tag = as;
  return (
    <Tag
      className={`type-badge type-${type} size-${size}${onClick ? ' clickable' : ''}`}
      onClick={onClick}
      title={TYPE_ES[type] || type}
    >
      {TYPE_ES[type] || type}
    </Tag>
  );
}
