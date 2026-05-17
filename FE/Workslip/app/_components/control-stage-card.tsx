import { ChevronDown, Check } from "lucide-react";
import type { ControlStage, ActiveControlColumn, ControlItem } from "../../lib/4v05-schema";
import { controlColumns } from "../../lib/4v05-schema";

export function ControlStageCard({
  stage,
  columns,
  expanded,
  selected,
  values,
  onToggleStage,
  onToggleItem
}: {
  stage: ControlStage;
  columns: ActiveControlColumn[];
  expanded: boolean;
  selected: boolean;
  values: Record<string, boolean>;
  onToggleStage: () => void;
  onToggleItem: (itemId: string) => void;
}) {
  const itemCount = columns.reduce((count, column) => count + (stage.items[column]?.length ?? 0), 0);
  const checkedCount = columns.reduce(
    (count, column) => count + (stage.items[column] ?? []).filter((item) => values[item.id]).length,
    0
  );

  return (
    <article className={`control-stage ${expanded ? "expanded" : ""}`}>
      <button className="control-stage-header" type="button" aria-expanded={expanded} onClick={onToggleStage}>
        <div>
          <h2>{stage.title}</h2>
          <span>
            {selected ? `${checkedCount} af ${itemCount} markeret` : `${itemCount} underkategorier`}
          </span>
        </div>
        <ChevronDown size={20} strokeWidth={2.5} />
      </button>
      {expanded && (
        <div className="control-columns">
          {columns.map((column) => {
            const columnConfig = controlColumns.find((item) => item.id === column);
            const items = stage.items[column] ?? [];
            if (items.length === 0) return null;

            return (
              <section className="control-column" key={`${stage.id}-${column}`}>
                <h3>{columnConfig?.label}</h3>
                <div className="control-items">
                  {items.map((item) => (
                    <ControlItemRow
                      key={item.id}
                      item={item}
                      checked={values[item.id] ?? false}
                      onToggle={() => onToggleItem(item.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}

function ControlItemRow({
  item,
  checked,
  onToggle
}: {
  item: ControlItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button className={`control-item ${checked ? "checked" : ""}`} type="button" onClick={onToggle}>
      <span>{checked && <Check size={16} strokeWidth={3} />}</span>
      <strong>{item.label}</strong>
    </button>
  );
}
