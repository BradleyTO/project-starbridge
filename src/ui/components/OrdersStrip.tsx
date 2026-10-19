import type { TrackedOrder } from '../../engine/types';

const DEPT: Record<TrackedOrder['dept'], string> = { helm: 'HELM', tactical: 'TAC', ops: 'OPS', science: 'SCI', comms: 'COMMS', xo: 'XO' };

function statusText(o: TrackedOrder): string {
  if (o.status === 'completed' && o.maintaining) return o.persistent ? 'maintaining · no matter what' : 'maintaining';
  if (o.status === 'standing') return 'standing · waiting';
  if (o.status === 'underway' && o.etaSeconds) return `underway · ETA ${o.etaSeconds < 90 ? `${o.etaSeconds}s` : `${Math.round(o.etaSeconds / 6) / 10}m`}`;
  if (o.status === 'acknowledged' && o.etaSeconds) return `acknowledged · ETA ${o.etaSeconds}s`;
  return o.status;
}

/** Active orders and the outcome of the latest ones, with lifecycle status. */
export function OrdersStrip({ orders }: { orders: TrackedOrder[] }) {
  return (
    <section className="orders-strip" data-testid="orders-strip" aria-label="Active orders">
      <span className="orders-title">ORDERS</span>
      {orders.length === 0 && <span className="muted orders-empty">No active orders.</span>}
      {orders.map((o) => (
        <span key={o.id} className={`order order-${o.status}${o.maintaining ? ' order-maintaining' : ''}`} data-testid={`order-${o.id}`} data-status={o.maintaining ? 'maintaining' : o.status} data-dept={o.dept} title={o.detail || undefined}>
          <span className="order-dept">{DEPT[o.dept]}</span>
          <span className="order-label">{o.label}</span>
          <span className="order-status">{statusText(o)}</span>
        </span>
      ))}
    </section>
  );
}
