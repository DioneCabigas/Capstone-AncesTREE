'use client'

/**
 * Reusable Form Input component
 */
export default function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = null,
  disabled = false,
  name = '',
  autoComplete = 'off'
}) {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-gray-700 text-sm font-bold mb-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        name={name}
        autoComplete={autoComplete}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
