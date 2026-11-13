import { useEffect, useRef, useState } from 'react';
import type { Line } from '../types';
import type { GroupNode } from '../lib/geo';
import { primaryName, secondaryName } from '../lib/text';
import { LineBullet, StatusBadge, Icon } from './bits';

interface Props {
  tree: GroupNode[];
  hidden: ReadonlySet<string>;
  /** Lines with something visible at the current year/status filter. */
  active: ReadonlySet<string>;
  selectedLine: string | null;
  onSetLines(ids: string[], visible: boolean): void;
  onSelectLine(id: string): void;
  onHoverLine(id: string | null): void;
}

function TriCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange(next: boolean): void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="check"
      checked={checked}
      aria-label={label}
      aria-checked={indeterminate ? 'mixed' : checked}
      onChange={() => onChange(indeterminate ? true : !checked)}
    />
  );
}

function lineYear(line: Line): string {
  const years = line.segments.map((s) => s.year).filter((y): y is number => y !== undefined);
  const first = line.opened ?? (years.length ? Math.min(...years) : undefined);
  if (first === undefined) return '';
  return line.status === 'operating' ? String(first) : `→ ${first}`;
}

export default function GroupTree(props: Props) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderLine = (line: Line) => {
    const visible = !props.hidden.has(line.id);
    const active = props.active.has(line.id);
    const year = lineYear(line);
    return (
      <li
        key={line.id}
        className={`line-row${props.selectedLine === line.id ? ' is-selected' : ''}${active ? '' : ' is-inactive'}`}
        onMouseEnter={() => visible && props.onHoverLine(line.id)}
        onMouseLeave={() => props.onHoverLine(null)}
      >
        <input
          type="checkbox"
          className="check"
          checked={visible}
          aria-label={`Show ${line.name}`}
          onChange={() => props.onSetLines([line.id], !visible)}
        />
        <button type="button" className="line-btn" onClick={() => props.onSelectLine(line.id)}>
          <LineBullet line={line} />
          <span className="line-text">
            <span className="line-name" title={secondaryName(line)}>
              {primaryName(line)}
            </span>
            <span className="line-meta">
              <StatusBadge status={line.status} short />
              {year && <span className="line-year">{year}</span>}
            </span>
          </span>
        </button>
      </li>
    );
  };

  const renderGroup = (g: GroupNode, depth: number) => {
    const shown = g.allLineIds.filter((id) => !props.hidden.has(id)).length;
    const all = shown === g.allLineIds.length;
    const none = shown === 0;
    const isCollapsed = collapsed.has(g.id);
    return (
      <li key={g.id} className={`group depth-${Math.min(depth, 3)}`}>
        <div className="group-head">
          <TriCheckbox
            checked={all}
            indeterminate={!all && !none}
            label={`Show all ${g.name}`}
            onChange={(next) => props.onSetLines(g.allLineIds, next)}
          />
          <button
            type="button"
            className={`group-btn${isCollapsed ? ' is-collapsed' : ''}`}
            aria-expanded={!isCollapsed}
            onClick={() => toggleCollapsed(g.id)}
            title={g.description}
          >
            <span className="chev">
              <Icon name="chevron" />
            </span>
            {g.color && <span className="group-dot" style={{ background: g.color }} />}
            <span className="group-name">
              {g.name}
              {g.nameLocal && g.nameLocal !== g.name && <span className="local"> {g.nameLocal}</span>}
            </span>
            <span className="group-count">
              {shown}/{g.allLineIds.length}
            </span>
          </button>
        </div>
        {!isCollapsed && (
          <ul className="group-body">
            {g.children.map((c) => renderGroup(c, depth + 1))}
            {g.lines.map(renderLine)}
          </ul>
        )}
      </li>
    );
  };

  // A single root group adds nothing: flatten it.
  const roots = props.tree.length === 1 && props.tree[0].children.length > 0 ? props.tree[0].children : props.tree;
  const rootLines = props.tree.length === 1 && props.tree[0].children.length > 0 ? props.tree[0].lines : [];

  return (
    <ul className="tree">
      {roots.map((g) => renderGroup(g, 0))}
      {rootLines.map(renderLine)}
    </ul>
  );
}
