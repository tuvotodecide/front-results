import React, { useState, FormEvent } from "react";

interface SearchField {
  key: string;
  label: string;
  placeholder?: string;
}

interface SearchFormProps {
  fields: SearchField[];
  onSearch: (values: Record<string, string>) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ fields, onSearch }) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(formValues);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClear = () => {
    setFormValues({});
    onSearch({});
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      {fields.map((field) => (
        <div key={field.key} className="flex-1 min-w-[200px]">
          <label
            htmlFor={field.key}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {field.label}
          </label>
          <input
            type="text"
            id={field.key}
            value={formValues[field.key] || ""}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
