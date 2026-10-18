import type { ReactNode } from 'react';

interface Props {
  title: string;
  code?: string;
  accent?: 'amber' | 'lilac' | 'sky' | 'rose' | 'mint';
  className?: string;
  children: ReactNode;
  testId?: string;
}

/** LCARS-inspired framed panel: a coloured elbow header with a numeric code. */
export function Panel({ title, code, accent = 'amber', className = '', children, testId }: Props) {
  return (
    <section className={`panel accent-${accent} ${className}`} aria-label={title} data-testid={testId}>
      <header className="panel-head">
        <span className="panel-elbow" aria-hidden="true" />
        <h2>{title}</h2>
        <span className="panel-rule" aria-hidden="true" />
        {code && <span className="panel-code">{code}</span>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
