import React from 'react';
import { Field, type FieldProps } from 'formik';

interface ToggleOptionFieldProps {
  name: string;
  title: string;
  description: string;
  warningText?: string;
  ariaLabel: string;
}

const ToggleOptionField: React.FC<ToggleOptionFieldProps> = ({
  name,
  title,
  description,
  warningText,
  ariaLabel,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">{title}</p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <Field name={name}>
          {({ field, form }: FieldProps<boolean>) => (
            <button
              type="button"
              role="switch"
              aria-label={ariaLabel}
              aria-checked={field.value}
              onClick={() => {
                void form.setFieldValue(name, !field.value, true);
                void form.setFieldTouched(name, true, false);
              }}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
                field.value ? 'bg-[#459151]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  field.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}
        </Field>
      </div>

      {warningText ? (
        <Field name={name}>
          {({ field }: FieldProps<boolean>) =>
            field.value ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {warningText}
              </div>
            ) : null
          }
        </Field>
      ) : null}
    </div>
  );
};

export default ToggleOptionField;
