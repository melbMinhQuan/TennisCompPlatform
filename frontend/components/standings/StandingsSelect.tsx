import { STANDINGS_CONTROL_CLASS } from "./standings-helpers";

type StandingsSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
};

export default function StandingsSelect({ label, value, onChange, options }: StandingsSelectProps) {
  return (
    <label className="min-w-0 text-xs font-semibold text-muted">
      {label}
      <select
        className={STANDINGS_CONTROL_CLASS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!options.length}
      >
        <option value="" disabled>
          {options.length ? "Select…" : "None available"}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
