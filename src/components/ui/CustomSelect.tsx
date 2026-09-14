import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  description?: string;
  disabled?: boolean;
}

export interface CustomSelectProps<T = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'emerald';
  fullWidth?: boolean;
}

export function CustomSelect<T extends string = string>({
  value,
  options,
  onChange,
  label,
  placeholder = 'Seleccionar...',
  icon,
  disabled = false,
  className = '',
  variant = 'light',
  fullWidth = true,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  // Variantes de Estilo
  const buttonVariantStyles = {
    light: 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300 focus:ring-emerald-500',
    dark: 'bg-slate-900 hover:bg-slate-850 text-white border-slate-700/80 focus:ring-emerald-500',
    emerald: 'bg-emerald-950 hover:bg-emerald-900 text-emerald-100 border-emerald-800/80 focus:ring-emerald-500',
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative text-left select-none ${fullWidth ? 'w-full' : 'inline-block'} ${className}`}
    >
      {/* Etiqueta Superior Opcional */}
      {label && (
        <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">
          {label}
        </label>
      )}

      {/* Botón Disparador del Select */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full font-bold text-xs rounded-xl px-3 py-2.5 border shadow-xs flex items-center justify-between space-x-2 transition-all duration-200 min-h-[42px] cursor-pointer active:scale-98 focus:outline-none focus:ring-2 ${
          buttonVariantStyles[variant]
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center space-x-2 truncate">
          {selectedOption?.icon || icon ? (
            <span className="flex-shrink-0 text-emerald-600">
              {selectedOption?.icon || icon}
            </span>
          ) : null}

          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {selectedOption?.badge && (
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                selectedOption.badgeColor || 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-extrabold text-left flex items-center justify-between space-x-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : option.disabled
                        ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {option.icon && (
                      <span className={`flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {option.icon}
                      </span>
                    )}

                    <div className="truncate">
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className={`text-[10px] block truncate font-medium ${
                          isSelected ? 'text-slate-300' : 'text-slate-400'
                        }`}>
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {option.badge && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : option.badgeColor || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}

                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
