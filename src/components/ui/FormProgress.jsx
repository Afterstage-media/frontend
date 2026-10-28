export function FormProgress({ current, steps, label = `Paso ${current} de ${steps.length}` }) {
  return (
    <div aria-label={label} className="form-progress">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const state = stepNumber === current ? "is-active" : stepNumber < current ? "is-complete" : "";
        return (
          <span className={state} key={step}>
            {String(stepNumber).padStart(2, "0")} · {step}
          </span>
        );
      })}
    </div>
  );
}
