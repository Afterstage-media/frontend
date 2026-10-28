import { Toggle } from "./Toggle.jsx";

export function SegmentedControl({ options, value, onChange, label, ariaLabel, className = "", ...props }) {
  return (
    <div aria-label={ariaLabel || label} className={`segmented-control ${className}`.trim()} role="group" {...props}>
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const optionLabel = typeof option === "string" ? option : option.label;
        const active = value === optionValue;
        return (
          <Toggle
            className={`button ${active ? "dark" : "ghost"}`}
            key={optionValue}
            onClick={() => onChange(optionValue)}
            pressed={active}
          >
            {optionLabel}
          </Toggle>
        );
      })}
    </div>
  );
}
