import { useState } from 'react';
import { clockLabel } from '../../universe/archive';
import type { DeepReadonly } from '../../universe/freeze';
import type { CanonicalState, FamiliarityMemory, WorldEvent } from '../../universe/types';
import type { ServiceRecord } from '../../career/service';
import { activeRestrictions } from '../../career/service';
import { rankOf, NPC_ONLY_RANKS } from '../../career/ranks';
import { NAME_MAX, fullTitle, validateCaptainName } from '../../career/name';
import type { CaptainProfile } from '../../career/profile';
import type { Evaluation, TrainingRecord } from '../../evaluation/types';
import { BAND_LABEL } from '../../evaluation/competencies';
import { competencyViews } from '../../evaluation/record';
import { CONDUCT_LABEL, TIER_LABEL } from '../../evaluation/evaluate';
import { AfterActionReport } from './AfterActionReport';

const CLASS: Record<WorldEvent['classification'], string> = {
  assignment: 'Voluntary',
  distress: 'Distress',
  directive: 'Directive (mandatory)',
  mission: 'Mission',
  consequence: 'Consequence',
  bulletin: 'Bulletin',
  disciplinary: 'Disciplinary',
  exploration: 'Exploration',
};

export type RecordSection = 'overview' | 'training' | 'history' | 'requests';
const SECTION_LABEL: Record<RecordSection, string> = { overview: 'Career Overview', training: 'Training', history: 'Service History', requests: 'Fleet Requests' };

export interface RecordProps {
  canon: DeepReadonly<CanonicalState> | null;
  familiarity: FamiliarityMemory;
  profile: CaptainProfile;
  service: ServiceRecord;
  training: TrainingRecord;
  onRename(name: string): { ok: true } | { ok: false; reason: string };
  initialSection?: RecordSection;
  initialReport?: string | null;
}

/**
 * v0.7 Service Record: an official ISA personnel file. Career Overview (personnel, rank,
 * assignment, canonical career), Training (competencies in words, after-action reports: never
 * canon), Service History (the canonical record) and Fleet Requests. Simulator familiarity stays
 * visibly separate.
 */
export function RecordPanel(props: RecordProps) {
  const { profile, service, training } = props;
  const [section, setSection] = useState<RecordSection>(props.initialSection ?? 'overview');
  const [report, setReport] = useState<string | null>(props.initialReport ?? null);
  const name = profile.name ?? 'Captain';
  const captain = fullTitle(profile.name, service.rank);
  const all: Evaluation[] = [...service.evaluations, ...training.evaluations];
  const open = report ? all.find((e) => e.id === report) : undefined;
  if (open) return <div className="record" data-testid="record"><AfterActionReport e={open} captain={captain} onClose={() => setReport(null)} /></div>;
  return (
    <div className="record" data-testid="record">
      <p className="ceremony-header">ISA PERSONNEL · SERVICE RECORD · {name.toUpperCase()}</p>
      <nav className="hub-tabs record-tabs" role="tablist" aria-label="Service Record sections">
        {(Object.keys(SECTION_LABEL) as RecordSection[]).map((s) => (
          <button key={s} role="tab" aria-selected={section === s} className={`chip ${section === s ? 'on' : ''}`} onClick={() => setSection(s)} data-testid={`record-tab-${s}`}>
            {SECTION_LABEL[s]}
          </button>
        ))}
      </nav>
      {section === 'overview' && <Overview {...props} captain={captain} />}
      {section === 'training' && <Training training={training} familiarity={props.familiarity} onOpen={setReport} />}
      {section === 'requests' && (
        <div data-testid="record-requests">
          <h3>Fleet Requests</h3>
          <p className="muted">No requests on file. The secure channel to ISA Fleet Command (personnel, logistics, operations, training and legal) opens in a later update. The request system behind it is built and tested: requests are decided on the record, deferred requests are reconsidered when conditions change, and nothing is carried out without your confirmation.</p>
        </div>
      )}
      {section === 'history' && <History canon={props.canon} service={service} onOpen={setReport} />}
    </div>
  );
}

function Personnel({ profile, service, onRename, captain }: RecordProps & { captain: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(profile.name ?? '');
  const [msg, setMsg] = useState('');
  const rank = rankOf(service.rank);
  const save = () => {
    const v = validateCaptainName(value);
    if (!v.ok) return setMsg(v.reason);
    const r = onRename(v.name);
    if (!r.ok) return setMsg(r.reason);
    setMsg('Name entered in the record. Nothing else changed.');
    setEditing(false);
  };
  return (
    <section className="personnel" data-testid="personnel">
      <h3>Personnel</h3>
      <dl className="personnel-grid">
        <dt>Name</dt>
        <dd data-testid="personnel-name">{profile.name ?? 'Not yet entered'}</dd>
        <dt>Rank</dt>
        <dd data-testid="personnel-rank">{rank.title} <span className="muted small">({rank.insignia})</span></dd>
        <dt>Formal address</dt>
        <dd data-testid="personnel-address">{captain}</dd>
        <dt>Assignment</dt>
        <dd>{service.assignment.position}, {service.assignment.ship} <span className="muted small">({service.assignment.shipClass})</span></dd>
        <dt>Service</dt>
        <dd className="small">Single-ship command at every rank. Promotions are reviewed on training, service, judgment and qualifications, never hours or points, and can be accepted, deferred or declined. Admirals are staff officers: {NPC_ONLY_RANKS.join(', ')} are not player ranks.</dd>
      </dl>
      {activeRestrictions(service, Number.MAX_SAFE_INTEGER - 1).length > 0 && <p className="notice small">Disciplinary restrictions are on file (temporary and appealable).</p>}
      {editing ? (
        <form className="row" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <input value={value} onChange={(e) => { setValue(e.target.value); setMsg(''); }} maxLength={NAME_MAX + 8} autoFocus autoComplete="off" spellCheck={false} data-testid="rename-input" aria-label="Captain's name" />
          <button className="btn" type="submit" data-testid="rename-save">Save name</button>
          <button className="btn ghost" type="button" onClick={() => { setEditing(false); setValue(profile.name ?? ''); setMsg(''); }}>Cancel</button>
        </form>
      ) : (
        <button className="btn ghost" onClick={() => setEditing(true)} data-testid="rename-open">Change my name</button>
      )}
      {msg && <p className="small" role="status" data-testid="rename-msg">{msg}</p>}
      <p className="muted small">Only your own name can be changed. Ships, crew, other people, worlds, factions and ISA departments keep their names.</p>
      {profile.history.length > 1 && <p className="muted small">Previously recorded as: {profile.history.slice(0, -1).map((h) => h.to).join(', ')}.</p>}
    </section>
  );
}

function Overview(props: RecordProps & { captain: string }) {
  const { canon, training } = props;
  const views = competencyViews(training).filter((v) => v.band !== 'unassessed');
  return (
    <div data-testid="record-overview">
      <Personnel {...props} />
      <h3>Training profile</h3>
      {views.length === 0 ? <p className="muted small">No evaluations yet. Every simulation you finish is assessed by ISA Training Command.</p> : (
        <p className="small" data-testid="overview-competencies">{views.map((v) => `${v.label}: ${BAND_LABEL[v.band]}`).join(' · ')}</p>
      )}
      {!canon ? (
        <p className="muted">The canonical career appears here once you have been commissioned to Active Duty.</p>
      ) : (
        <>
          <h3>Career (canonical)</h3>
          {canon.captain.career.length === 0 && <p className="muted">No canonical service yet.</p>}
          <ul className="career" data-testid="career">
            {canon.captain.career.map((c) => (
              <li key={c.id}><span className="muted small">{clockLabel(c.at)}</span> {c.text}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function EvalRow({ e, onOpen }: { e: Evaluation; onOpen(id: string): void }) {
  return (
    <li data-testid={`eval-${e.id}`} data-outcome={e.outcome.id}>
      <strong>{e.title.replace(/^Training Simulation \d+: /, '')}</strong>: {e.outcome.title} <span className="muted small">({TIER_LABEL[e.outcome.tier]}; conduct {CONDUCT_LABEL[e.conduct].split(':')[0].toLowerCase()}; {e.atIso.slice(0, 10)})</span>{' '}
      <button className="btn ghost small-btn" onClick={() => onOpen(e.id)} data-testid={`eval-open-${e.id}`}>Read report</button>
    </li>
  );
}

function Training({ training, familiarity, onOpen }: { training: TrainingRecord; familiarity: FamiliarityMemory; onOpen(id: string): void }) {
  const views = competencyViews(training);
  return (
    <div data-testid="record-training">
      <h3>Training Record <span className="tag sim">NOT CANONICAL</span></h3>
      <p className="muted small">Simulations are official ISA training exercises. They are assessed and kept here, separately from your service history; nothing in them ever happened in the real universe.</p>
      <h4>Competencies</h4>
      <ul className="competencies" data-testid="competencies">
        {views.map((v) => (
          <li key={v.id} data-testid={`competency-${v.id}`} data-band={v.band}>
            <strong>{v.label}</strong>: <span className={`tag band-${v.band}`}>{BAND_LABEL[v.band]}</span>
            {v.evidence.map((x, i) => (
              <div key={i} className="muted small">{x}</div>
            ))}
          </li>
        ))}
      </ul>
      <h4>After-action reports</h4>
      {training.evaluations.length === 0 ? <p className="muted small" data-testid="no-evaluations">No simulation has been assessed yet.</p> : (
        <ul className="evaluations" data-testid="evaluations">
          {training.evaluations.slice().reverse().map((e) => <EvalRow key={e.id} e={e} onOpen={onOpen} />)}
        </ul>
      )}
      {training.archived.length > 0 && <p className="muted small">Older reports are kept in summary: {training.archived.slice(-5).map((a) => `${a.title.replace(/^Training Simulation \d+: /, '')} (${a.outcome})`).join('; ')}{training.archived.length > 5 ? ' and earlier' : ''}.</p>}
      <h3>Simulator familiarity <span className="tag sim">NOT CANONICAL</span></h3>
      <p className="muted small">Training memory shared by both modes: how you phrase orders and what the crew has drilled. Simulated events are never history; nobody lost in a simulation is dead.</p>
      <ul className="familiarity" data-testid="familiarity">
        <li>Simulation runs: {familiarity.training.simRuns}</li>
        <li>Drilled manoeuvres: {Object.entries(familiarity.training.drilled).map(([k, v]) => `${k} ×${v}`).join(', ') || 'none yet'}</li>
        <li>Learned phrases: {Object.keys(familiarity.aliases).length ? Object.entries(familiarity.aliases).map(([k, v]) => `"${k}" → "${v}"`).join('; ') : 'none'}</li>
        <li>Simulated casualties (training only): {familiarity.training.simulatedCasualties}</li>
      </ul>
    </div>
  );
}

/** The canonical record: missions, discipline, world events, crew experience. */
function History({ canon, service, onOpen }: { canon: DeepReadonly<CanonicalState> | null; service: ServiceRecord; onOpen(id: string): void }) {
  return (
    <div data-testid="record-history">
      {!canon ? (
        <p className="muted">Your service history appears here once you have been commissioned to Active Duty.</p>
      ) : (
        <>
          <h3>Active Duty after-action reports</h3>
          {service.evaluations.length === 0 ? <p className="muted small">No canonical mission has been assessed yet.</p> : (
            <ul className="evaluations" data-testid="service-evaluations">
              {service.evaluations.slice().reverse().map((e) => <EvalRow key={e.id} e={e} onOpen={onOpen} />)}
            </ul>
          )}
          {canon.discipline.length > 0 && (
            <>
              <h3>Disciplinary reviews</h3>
              <ul className="discipline" data-testid="discipline">
                {canon.discipline.map((d) => (
                  <li key={d.id} data-testid={`discipline-${d.id}`} data-finding={d.finding}>
                    <strong>{d.rule.split(':')[0]}</strong> ({d.trigger}): {d.finding === 'pending' ? `pending; finding due ${clockLabel(d.openedAt + 12 * 60)}` : d.finding === 'no-action' ? 'closed, no action' : 'formal reprimand'}
                    <div className="muted small">{d.rule} Evidence: {d.evidence.join(' ')}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3>World event log (canonical)</h3>
          <ul className="events" data-testid="event-log">
            {canon.events.slice().sort((a, b) => b.updatedAt - a.updatedAt || b.at - a.at).map((e) => (
              <li key={e.id} data-testid={`event-${e.id}`} data-class={e.classification} data-status={e.status}>
                <div>
                  <span className={`tag ev-${e.status}`}>{e.status.toUpperCase()}</span> <span className="tag">{CLASS[e.classification]}</span> <strong>{e.title}</strong>
                  <span className="muted small"> {e.id} · {clockLabel(e.at)} · {e.authority}{e.missionId ? ` · ${e.missionId}` : ''}{e.links.length ? ` · links ${e.links.join(', ')}` : ''}</span>
                </div>
                <div className="small">{e.summary}</div>
                {e.decisions.length > 0 && <div className="small">Decisions: {e.decisions.join(' ')}</div>}
                {e.consequences.length > 0 && <div className="small">Consequences: {e.consequences.join(' ')}</div>}
              </li>
            ))}
          </ul>
          <h3>Crew: canonical experience</h3>
          {Object.keys(canon.crew).length === 0 && <p className="muted">No canonical missions served together yet.</p>}
          <ul className="crew-exp" data-testid="crew-experience">
            {Object.values(canon.crew).map((x) => (
              <li key={x.id} data-testid={`crew-${x.id}`} data-status={x.status}>
                <strong>{x.name}</strong> <span className="muted small">{x.role} · {x.status} · trust {x.trust} · {x.missions.length} mission(s)</span>
                {x.experiences.length > 0 && <div className="small">{x.experiences[x.experiences.length - 1].text}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
