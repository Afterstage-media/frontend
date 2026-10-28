import { FormField } from "./FormField.jsx";

export function TextAreaField({ label, name, hint, optional, className = "", ...props }) {
  return (
    <FormField className={className} hint={hint} htmlFor={name} label={label} optional={optional}>
      <textarea id={name} name={name} {...props} />
    </FormField>
  );
}
