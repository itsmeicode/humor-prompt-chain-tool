"use client";

export type LookupRow = {
  id: number;
  slug: string;
  description?: string | null;
};

export type ModelRow = {
  id: number;
  name: string;
  is_temperature_supported: boolean;
};

export type StepDefaults = {
  description?: string | null;
  humor_flavor_step_type_id?: number | null;
  llm_input_type_id?: number | null;
  llm_output_type_id?: number | null;
  llm_model_id?: number | null;
  llm_temperature?: number | null;
  llm_system_prompt?: string | null;
  llm_user_prompt?: string | null;
};

export type LookupOptions = {
  stepTypes: LookupRow[];
  inputTypes: LookupRow[];
  outputTypes: LookupRow[];
  models: ModelRow[];
};

const labelClass =
  "block text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400";
const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";

function lookupLabel(r: LookupRow) {
  return r.description ? `${r.slug} — ${r.description}` : r.slug;
}

export function StepFormFields({
  options,
  defaults,
  disabled,
  idPrefix,
}: {
  options: LookupOptions;
  defaults?: StepDefaults;
  disabled?: boolean;
  idPrefix: string;
}) {
  const d = defaults ?? {};
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-description`} className={labelClass}>
          Description (optional)
        </label>
        <input
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={d.description ?? ""}
          placeholder="e.g. Describe the image"
          disabled={disabled}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-humor_flavor_step_type_id`}
          className={labelClass}
        >
          Step type
        </label>
        <select
          id={`${idPrefix}-humor_flavor_step_type_id`}
          name="humor_flavor_step_type_id"
          required
          defaultValue={d.humor_flavor_step_type_id ?? ""}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Select…</option>
          {options.stepTypes.map((r) => (
            <option key={r.id} value={r.id}>
              {lookupLabel(r)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-llm_model_id`} className={labelClass}>
          Model
        </label>
        <select
          id={`${idPrefix}-llm_model_id`}
          name="llm_model_id"
          required
          defaultValue={d.llm_model_id ?? ""}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Select…</option>
          {options.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-llm_input_type_id`} className={labelClass}>
          Input type
        </label>
        <select
          id={`${idPrefix}-llm_input_type_id`}
          name="llm_input_type_id"
          required
          defaultValue={d.llm_input_type_id ?? ""}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Select…</option>
          {options.inputTypes.map((r) => (
            <option key={r.id} value={r.id}>
              {lookupLabel(r)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-llm_output_type_id`}
          className={labelClass}
        >
          Output type
        </label>
        <select
          id={`${idPrefix}-llm_output_type_id`}
          name="llm_output_type_id"
          required
          defaultValue={d.llm_output_type_id ?? ""}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Select…</option>
          {options.outputTypes.map((r) => (
            <option key={r.id} value={r.id}>
              {lookupLabel(r)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-llm_temperature`} className={labelClass}>
          Temperature (optional)
        </label>
        <input
          id={`${idPrefix}-llm_temperature`}
          name="llm_temperature"
          type="number"
          step="0.01"
          min="0"
          max="2"
          defaultValue={d.llm_temperature ?? ""}
          placeholder="e.g. 0.7"
          disabled={disabled}
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-llm_system_prompt`} className={labelClass}>
          System prompt (optional)
        </label>
        <textarea
          id={`${idPrefix}-llm_system_prompt`}
          name="llm_system_prompt"
          rows={3}
          defaultValue={d.llm_system_prompt ?? ""}
          placeholder="Sets the model's role / behavior"
          disabled={disabled}
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-llm_user_prompt`} className={labelClass}>
          User prompt (optional)
        </label>
        <textarea
          id={`${idPrefix}-llm_user_prompt`}
          name="llm_user_prompt"
          rows={4}
          defaultValue={d.llm_user_prompt ?? ""}
          placeholder="The instruction for this step"
          disabled={disabled}
          className={inputClass}
        />
      </div>
    </div>
  );
}
