import React, { useState } from 'react';
import { X, Building2, Sprout, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, MapPin, Hash, Phone, Mail } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useEmpresasStore } from '../../stores/useEmpresasStore';
import { useEstanciasStore } from '../../stores/useEstanciasStore';
import { supabase } from '../../services/supabase';
import type { TipoTenencia } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEPARTAMENTOS_URUGUAY = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores',
  'Florida', 'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro',
  'Rivera', 'Rocha', 'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres'
];

export const OnboardingEmpresaModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { usuario, actualizarEmpresasUsuario } = useAuthStore();
  const { cargarEmpresasDesdeSupabase, seleccionarEmpresa } = useEmpresasStore();
  const { cargarEstanciasDesdeSupabase, seleccionarEstancia } = useEstanciasStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Step 1: Empresa
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreFantasia, setNombreFantasia] = useState('');
  const [rut, setRut] = useState('');
  const [departamentoSede, setDepartamentoSede] = useState('Soriano');
  const [emailContacto, setEmailContacto] = useState(usuario?.email || '');
  const [telefonoContacto, setTelefonoContacto] = useState('');

  // Form Step 2: Campo / Establecimiento
  const [nombreEstablecimiento, setNombreEstablecimiento] = useState('');
  const [dicose, setDicose] = useState('');
  const [hectareasTotales, setHectareasTotales] = useState<number | ''>('');
  const [hectareasPastoreables, setHectareasPastoreables] = useState<number | ''>('');
  const [departamentoCampo, setDepartamentoCampo] = useState('Soriano');
  const [ubicacionLocalidad, setUbicacionLocalidad] = useState('');
  const [tipoTenencia, setTipoTenencia] = useState<TipoTenencia>('PROPIO');

  if (!isOpen) return null;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!razonSocial.trim()) {
      setErrorMsg('Por favor ingresa la Razón Social de tu empresa.');
      return;
    }
    if (rut.trim() && rut.trim().length !== 12) {
      setErrorMsg('El RUT en Uruguay debe tener exactamente 12 dígitos.');
      return;
    }

    setStep(2);
  };

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombreEstablecimiento.trim()) {
      setErrorMsg('Por favor ingresa el Nombre de tu Establecimiento o Campo.');
      return;
    }

    if (!dicose.trim()) {
      setErrorMsg('El número DICOSE es requerido.');
      return;
    }

    if (!hectareasTotales || Number(hectareasTotales) <= 0) {
      setErrorMsg('Las Hectáreas Totales deben ser mayor a 0.');
      return;
    }

    const totalHa = Number(hectareasTotales);
    const pastHa = hectareasPastoreables === '' ? totalHa : Number(hectareasPastoreables);

    if (pastHa > totalHa) {
      setErrorMsg('Las Hectáreas Pastoreables no pueden superar las Hectáreas Totales.');
      return;
    }

    setGuardando(true);

    try {
      // 1. Guardar Empresa en Supabase
      const payloadEmpresa = {
        razon_social: razonSocial.trim(),
        nombre_fantasia: nombreFantasia.trim() || razonSocial.trim(),
        rut: rut.trim() || '210000000000',
        email_contacto: emailContacto.trim() || usuario?.email || '',
        telefono_contacto: telefonoContacto.trim() || '',
        departamento_sede: departamentoSede,
        activa: true,
      };

      let createdEmpresaId = `emp-${Date.now()}`;

      const { data: empRes, error: empErr } = await supabase
        .from('empresas')
        .insert([payloadEmpresa])
        .select('id')
        .single();

      if (!empErr && empRes) {
        createdEmpresaId = empRes.id;
      } else if (empErr) {
        console.warn('Aviso insertando empresa en Supabase:', empErr);
      }

      // 2. Asociar Empresa al Usuario en perfiles
      const empresaIdsActuales = usuario?.empresa_ids || [];
      const nuevosEmpresaIds = [...new Set([...empresaIdsActuales, createdEmpresaId])];
      await actualizarEmpresasUsuario(nuevosEmpresaIds);

      // 3. Guardar Establecimiento en Supabase
      const payloadEstablecimiento = {
        empresa_id: createdEmpresaId,
        nombre: nombreEstablecimiento.trim(),
        dicose: dicose.trim().toUpperCase(),
        hectareas_totales: totalHa,
        hectareas_pastoreables: pastHa,
        departamento: departamentoCampo,
        ubicacion_localidad: ubicacionLocalidad.trim() || departamentoCampo,
        tipo_tenencia: tipoTenencia,
        activa: true,
      };

      let createdEstanciaId = `est-${Date.now()}`;

      const { data: estRes, error: estErr } = await supabase
        .from('establecimientos')
        .insert([payloadEstablecimiento])
        .select('id')
        .single();

      if (!estErr && estRes) {
        createdEstanciaId = estRes.id;
      } else if (estErr) {
        console.warn('Aviso insertando establecimiento en Supabase:', estErr);
      }

      // 4. Recargar Stores y Seleccionar
      await Promise.all([
        cargarEmpresasDesdeSupabase(),
        cargarEstanciasDesdeSupabase(),
      ]);

      seleccionarEmpresa(createdEmpresaId);
      seleccionarEstancia(createdEstanciaId);

      setGuardando(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al completar onboarding:', err);
      setErrorMsg('Ocurrió un error al guardar la información. Por favor reintenta.');
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con Progreso */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Configuración Inicial AgroUY</span>
          </div>

          <h3 className="text-lg font-bold text-white">
            {step === 1 ? 'Paso 1: Registra tu Empresa Agropecuaria' : 'Paso 2: Configura tu Campo Principal'}
          </h3>

          {/* Stepper Bar */}
          <div className="mt-4 flex items-center space-x-2">
            <div className={`flex-1 h-2 rounded-full transition-all ${step >= 1 ? 'bg-amber-500' : 'bg-slate-700'}`} />
            <div className={`flex-1 h-2 rounded-full transition-all ${step >= 2 ? 'bg-amber-500' : 'bg-slate-700'}`} />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center space-x-2">
              <span className="font-bold">Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <form id="step1-form" onSubmit={handleNextStep} className="space-y-4">
              <p className="text-xs text-slate-600">
                Ingresa los datos fiscales y de contacto de tu empresa o sociedad agropecuaria.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Razón Social *
                </label>
                <input
                  type="text"
                  required
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej: Agropecuaria Del Sur S.A."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nombre Fantasía (Opcional)</label>
                  <input
                    type="text"
                    value={nombreFantasia}
                    onChange={(e) => setNombreFantasia(e.target.value)}
                    placeholder="Ej: Estancia Las Marías"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    RUT (12 Dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={rut}
                    onChange={(e) => setRut(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 219999990019"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Departamento Sede
                  </label>
                  <select
                    value={departamentoSede}
                    onChange={(e) => setDepartamentoSede(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {DEPARTAMENTOS_URUGUAY.map((dep) => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Teléfono Contacto
                  </label>
                  <input
                    type="tel"
                    value={telefonoContacto}
                    onChange={(e) => setTelefonoContacto(e.target.value)}
                    placeholder="Ej: 099 123 456"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Contacto
                </label>
                <input
                  type="email"
                  value={emailContacto}
                  onChange={(e) => setEmailContacto(e.target.value)}
                  placeholder="ejemplo@agrouy.uy"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </form>
          ) : (
            <form id="step2-form" onSubmit={handleFinalizar} className="space-y-4">
              <p className="text-xs text-slate-600">
                Configura tu primer establecimiento o campo físico para vincular hacienda, lluvias y finanzas.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  Nombre del Establecimiento / Campo *
                </label>
                <input
                  type="text"
                  required
                  value={nombreEstablecimiento}
                  onChange={(e) => setNombreEstablecimiento(e.target.value)}
                  placeholder="Ej: Campo El Ombú"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">DICOSE *</label>
                  <input
                    type="text"
                    required
                    value={dicose}
                    onChange={(e) => setDicose(e.target.value)}
                    placeholder="Ej: 12088899"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Departamento Campo</label>
                  <select
                    value={departamentoCampo}
                    onChange={(e) => setDepartamentoCampo(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {DEPARTAMENTOS_URUGUAY.map((dep) => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Hectáreas Totales *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={hectareasTotales}
                    onChange={(e) => setHectareasTotales(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej: 500"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Hectáreas Pastoreables</label>
                  <input
                    type="number"
                    min={0}
                    value={hectareasPastoreables}
                    onChange={(e) => setHectareasPastoreables(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej: 450"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Ubicación / Localidad</label>
                  <input
                    type="text"
                    value={ubicacionLocalidad}
                    onChange={(e) => setUbicacionLocalidad(e.target.value)}
                    placeholder="Ej: Ruta 2 km 210"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tipo Tenencia</label>
                  <select
                    value={tipoTenencia}
                    onChange={(e) => setTipoTenencia(e.target.value as TipoTenencia)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="PROPIO">Propio</option>
                    <option value="ARRENDADO">Arrendado</option>
                    <option value="APARCERIA">Aparcería</option>
                    <option value="PASTOREO">Pastoreo</option>
                  </select>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={guardando}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Paso 1</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <button
              type="submit"
              form="step1-form"
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition-all text-xs"
            >
              <span>Siguiente: Agregar Campo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="step2-form"
              disabled={guardando}
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all text-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>{guardando ? 'Guardando...' : 'Finalizar Configuración'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
