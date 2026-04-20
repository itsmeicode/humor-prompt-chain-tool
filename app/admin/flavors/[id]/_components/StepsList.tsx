"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteStep, reorderSteps, updateStep } from "../actions";
import {
  StepFormFields,
  type LookupOptions,
} from "./StepFormFields";

export type Step = {
  id: string | number;
  order_by: number;
  description: string | null;
  humor_flavor_step_type_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  llm_model_id: number;
  llm_temperature: number | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
};

export function StepsList({
  flavorId,
  steps: initialSteps,
  options,
}: {
  flavorId: string;
  steps: Step[];
  options: LookupOptions;
}) {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSteps(initialSteps);
  }, [initialSteps]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => String(s.id) === String(active.id));
    const newIndex = steps.findIndex((s) => String(s.id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(steps, oldIndex, newIndex);
    setSteps(next);
    setError(null);
    startTransition(async () => {
      const res = await reorderSteps(
        flavorId,
        next.map((s) => s.id)
      );
      if (res.error) {
        setError(res.error);
        setSteps(steps);
      }
    });
  }

  if (steps.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No steps yet. Add one above.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={steps.map((s) => String(s.id))}
          strategy={verticalListSortingStrategy}
        >
          <ol className="flex flex-col gap-3">
            {steps.map((step, idx) => (
              <SortableStep
                key={String(step.id)}
                step={step}
                index={idx}
                flavorId={flavorId}
                options={options}
                disabled={pending}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableStep({
  step,
  index,
  flavorId,
  options,
  disabled,
}: {
  step: Step;
  index: number;
  flavorId: string;
  options: LookupOptions;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(step.id) });

  const [editing, setEditing] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const stepType = options.stepTypes.find(
    (r) => r.id === step.humor_flavor_step_type_id
  );
  const inputType = options.inputTypes.find(
    (r) => r.id === step.llm_input_type_id
  );
  const outputType = options.outputTypes.find(
    (r) => r.id === step.llm_output_type_id
  );
  const model = options.models.find((m) => m.id === step.llm_model_id);

  function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRowError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("flavor_id", flavorId);
    fd.set("id", String(step.id));
    startTransition(async () => {
      const res = await updateStep(fd);
      if (res.error) setRowError(res.error);
      else setEditing(false);
    });
  }

  function onDelete() {
    if (!confirm(`Delete step ${index + 1}?`)) return;
    setRowError(null);
    const fd = new FormData();
    fd.set("flavor_id", flavorId);
    fd.set("id", String(step.id));
    startTransition(async () => {
      const res = await deleteStep(fd);
      if (res.error) setRowError(res.error);
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md border border-zinc-200 text-zinc-400 hover:bg-zinc-100 active:cursor-grabbing dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ⋮⋮
        </button>
        <div className="flex w-8 shrink-0 items-start justify-center pt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {index + 1}.
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={onSave} className="flex flex-col gap-4">
              <StepFormFields
                options={options}
                disabled={pending || disabled}
                idPrefix={`step-${step.id}`}
                defaults={{
                  description: step.description,
                  humor_flavor_step_type_id: step.humor_flavor_step_type_id,
                  llm_input_type_id: step.llm_input_type_id,
                  llm_output_type_id: step.llm_output_type_id,
                  llm_model_id: step.llm_model_id,
                  llm_temperature: step.llm_temperature,
                  llm_system_prompt: step.llm_system_prompt,
                  llm_user_prompt: step.llm_user_prompt,
                }}
              />
              <div className="flex items-center justify-between gap-3">
                {rowError ? (
                  <p className="text-xs text-red-700 dark:text-red-300">
                    {rowError}
                  </p>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setRowError(null);
                    }}
                    disabled={pending || disabled}
                    className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending || disabled}
                    className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    {pending ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {step.description || (
                    <span className="italic text-zinc-500">
                      (no description)
                    </span>
                  )}
                </p>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {stepType?.slug ?? `step-type ${step.humor_flavor_step_type_id}`}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {model?.name ?? `model ${step.llm_model_id}`} ·{" "}
                {inputType?.slug ?? "?"} → {outputType?.slug ?? "?"}
                {step.llm_temperature != null && (
                  <> · temp {step.llm_temperature}</>
                )}
              </p>
              {step.llm_user_prompt && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {step.llm_user_prompt}
                </p>
              )}
              {step.llm_system_prompt && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-zinc-500 dark:text-zinc-400">
                    System prompt
                  </summary>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400">
                    {step.llm_system_prompt}
                  </p>
                </details>
              )}
              {rowError && (
                <p className="mt-2 text-xs text-red-700 dark:text-red-300">
                  {rowError}
                </p>
              )}
            </div>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={pending || disabled}
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending || disabled}
              className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            >
              {pending ? "…" : "Delete"}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
