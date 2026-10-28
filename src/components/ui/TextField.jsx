import { FormField } from "./FormField.jsx";

export function TextField({ label, name, type = "text", hint, optional, className = "", ...props }) {
  return (
    <FormField className={className} hint={hint} htmlFor={name} label={label} optional={optional}>
      <input id={name} name={name} type={type} {...props} />
    </FormField>
  );
}
