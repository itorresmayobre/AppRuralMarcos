export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: string;
}

// Los 19 Departamentos Oficiales de la República Oriental del Uruguay
export const DEPARTAMENTOS_URUGUAY: SelectOption[] = [
  { value: 'Soriano', label: 'Soriano' },
  { value: 'Tacuarembó', label: 'Tacuarembó' },
  { value: 'Durazno', label: 'Durazno' },
  { value: 'Paysandú', label: 'Paysandú' },
  { value: 'Salto', label: 'Salto' },
  { value: 'Río Negro', label: 'Río Negro' },
  { value: 'Florida', label: 'Florida' },
  { value: 'San José', label: 'San José' },
  { value: 'Colonia', label: 'Colonia' },
  { value: 'Rocha', label: 'Rocha' },
  { value: 'Treinta y Tres', label: 'Treinta y Tres' },
  { value: 'Cerro Largo', label: 'Cerro Largo' },
  { value: 'Lavalleja', label: 'Lavalleja' },
  { value: 'Maldonado', label: 'Maldonado' },
  { value: 'Canelones', label: 'Canelones' },
  { value: 'Artigas', label: 'Artigas' },
  { value: 'Rivera', label: 'Rivera' },
  { value: 'Flores', label: 'Flores' },
  { value: 'Montevideo', label: 'Montevideo' },
];

export const PAISES_REGION: SelectOption[] = [
  { value: 'Uruguay', label: 'Uruguay 🇺🇾' },
  { value: 'Argentina', label: 'Argentina 🇦🇷' },
  { value: 'Brasil', label: 'Brasil 🇧🇷' },
  { value: 'Paraguay', label: 'Paraguay 🇵🇾' },
];
