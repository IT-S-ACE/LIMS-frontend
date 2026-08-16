/* eslint-disable react-refresh/only-export-components */
import { Field } from "@/components/form-shell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TestCatalogItem } from "@/lib/types";

export type TestFormErrors = Partial<
  Record<"name" | "price" | "refRange" | "unit" | "resultOptions" | "criticalHigh", string>
>;

export function validateTest(
  value: TestCatalogItem,
  existing: TestCatalogItem[],
  currentCode?: string,
): TestFormErrors {
  const errors: TestFormErrors = {};
  const name = value.name.trim();
  if (!name) errors.name = "Test name is required.";
  else if (
    existing.some(
      (t) => t.name.trim().toLowerCase() === name.toLowerCase() && t.code !== currentCode,
    )
  )
    errors.name = "A test with this name already exists.";
  if (!Number.isFinite(value.price) || value.price <= 0)
    errors.price = "Price must be a number greater than zero.";
  if (!String(value.refRange ?? "").trim()) errors.refRange = "Reference range is required.";
  if (!String(value.unit ?? "").trim()) errors.unit = "Unit is required.";
  if (value.resultType === "choice" && (value.resultOptions ?? []).filter(Boolean).length < 2)
    errors.resultOptions = "Add at least two choices separated by commas.";
  if (
    value.criticalLow != null &&
    value.criticalHigh != null &&
    value.criticalHigh <= value.criticalLow
  )
    errors.criticalHigh = "Critical high must be greater than critical low.";
  return errors;
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

export function TestFields({
  value,
  onChange,
  errors = {},
}: {
  value: TestCatalogItem;
  onChange: (v: TestCatalogItem) => void;
  errors?: TestFormErrors;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="Test Name" required>
        <Input
          value={value.name}
          aria-invalid={!!errors.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="e.g. Complete Blood Count (CBC)"
        />
        <ErrorText msg={errors.name} />
      </Field>
      <Field label="Price ($)" required>
        <Input
          type="number"
          min={0}
          step="0.01"
          aria-invalid={!!errors.price}
          value={value.price}
          onChange={(e) => onChange({ ...value, price: Number(e.target.value) })}
        />
        <ErrorText msg={errors.price} />
      </Field>
      <Field label="Reference Range" required>
        <Input
          value={value.refRange ?? ""}
          aria-invalid={!!errors.refRange}
          onChange={(e) => onChange({ ...value, refRange: e.target.value })}
          placeholder="e.g. 70-99"
        />
        <ErrorText msg={errors.refRange} />
      </Field>
      <Field label="Unit" required>
        <Input
          value={value.unit ?? ""}
          aria-invalid={!!errors.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value })}
          placeholder="e.g. mg/dL"
        />
        <ErrorText msg={errors.unit} />
      </Field>
      <Field label="Result Type" required>
        <Select
          value={value.resultType ?? "text"}
          onValueChange={(resultType) =>
            onChange({ ...value, resultType: resultType as "numeric" | "text" | "choice" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="numeric">Numeric</SelectItem>
            <SelectItem value="text">Free Text</SelectItem>
            <SelectItem value="choice">Choice List</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {value.resultType === "choice" && (
        <Field label="Allowed Choices" required hint="Comma-separated values">
          <Input
            value={(value.resultOptions ?? []).join(", ")}
            aria-invalid={!!errors.resultOptions}
            onChange={(event) =>
              onChange({
                ...value,
                resultOptions: event.target.value.split(",").map((option) => option.trim()),
              })
            }
            placeholder="Negative, Positive, Inconclusive"
          />
          <ErrorText msg={errors.resultOptions} />
        </Field>
      )}
      {value.resultType === "numeric" && (
        <>
          <Field label="Critical Low" hint="Optional — values below are flagged critical">
            <Input
              type="number"
              step="any"
              value={value.criticalLow ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  criticalLow: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
          </Field>
          <Field label="Critical High" hint="Optional — values above are flagged critical">
            <Input
              type="number"
              step="any"
              aria-invalid={!!errors.criticalHigh}
              value={value.criticalHigh ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  criticalHigh: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
            <ErrorText msg={errors.criticalHigh} />
          </Field>
        </>
      )}
    </div>
  );
}
