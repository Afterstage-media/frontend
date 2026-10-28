import { FormField } from "./FormField.jsx";

export function SelectField({ label, name, options, hint, optional, className = "", children, ...props }) {
  return (
    <FormField className={className} hint={hint} htmlFor={name} label={label} optional={optional}>
      <select id={name} name={name} {...props}>
        {children ||
          options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
    </FormField>
  );
}
