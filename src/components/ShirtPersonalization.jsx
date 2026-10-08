import { useId } from "react";
import { PERSONALIZATION_NAME_LIMIT } from "../../supabase/functions/_shared/personalization.js";

export default function ShirtPersonalization({ enabled, onToggle, value, onChange }) {
  const id = useId();
  return (
    <div className="shirt-personalization">
      <label className="personalization-toggle">
        <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} aria-controls={`${id}-fields`} />
        Personalizar camisa
      </label>
      {enabled && (
        <div className="personalization-fields" id={`${id}-fields`}>
          <label htmlFor={`${id}-name`}>
            Nome na camisa
            <input
              id={`${id}-name`}
              name="shirtName"
              value={value.name}
              onChange={(event) => onChange({ ...value, name: event.target.value })}
              maxLength={PERSONALIZATION_NAME_LIMIT}
              required={!value.number.trim()}
              placeholder="Ex: GUSTAVO"
              autoComplete="off"
              aria-describedby={`${id}-hint`}
            />
          </label>
          <label htmlFor={`${id}-number`}>
            Numero
            <input
              id={`${id}-number`}
              name="shirtNumber"
              value={value.number}
              onChange={(event) => onChange({ ...value, number: event.target.value })}
              inputMode="numeric"
              pattern="[0-9]{1,2}"
              maxLength={2}
              required={!value.name.trim()}
              placeholder="10"
              autoComplete="off"
              title="Informe um numero de 0 a 99."
              aria-describedby={`${id}-hint`}
            />
          </label>
          <small id={`${id}-hint`}>Nome de ate 20 caracteres e/ou numero de 0 a 99.</small>
        </div>
      )}
    </div>
  );
}
