import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../stores/useToastStore';
import { CustomSelect, type SelectOption } from '../ui/CustomSelect';
import {
  Building2,
  CheckCircle2,
  ArrowLeft,
  Send,
  MapPin,
  ShieldCheck,
  Wheat,
  Phone,
  Mail,
  User,
  Lock,
  Loader2
} from 'lucide-react';

const DEPARTAMENTOS_URUGUAY: SelectOption[] = [
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

interface RegistroEmpresaViewProps {
  onVolverALogin?: () => void;
}

export const RegistroEmpresaView: React.FC<RegistroEmpresaViewProps> = ({ onVolverALogin }) => {
  const navigate = useNavigate();
  const { mostrarToast } = useToastStore();

  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [rut, setRut] = useState('');
  const [solicitanteNombre, setSolicitanteNombre] = useState('');
  const [solicitanteApellido, setSolicitanteApellido] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');
  const [solicitantePassword, setSolicitantePassword] = useState('');
  const [solicitanteTelefono, setSolicitanteTelefono] = useState('');
  const [departamento, setDepartamento] = useState('Soriano');
  const [nombreCampoInicial, setNombreCampoInicial] = useState('Estancia El Ombú');
  const [hectareasEstimadas, setHectareasEstimadas] = useState('1200');
  const [estanciasEstimadas, setEstanciasEstimadas] = useState('1');
  const [observaciones, setObservaciones] = useState('');
  const [cargandoEnvio, setCargandoEnvio] = useState(false);

  const [enviadoExitoso, setEnviadoExitoso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreEmpresa.trim() || !solicitanteNombre.trim() || !solicitanteEmail.trim() || !solicitantePassword.trim()) {
      mostrarToast('Campos Incompletos', 'Por favor completa todos los campos requeridos (*), incluyendo correo y contraseña', 'ERROR');
      return;
    }

    setCargandoEnvio(true);
    const ha = parseFloat(hectareasEstimadas);

    // Intentar alta directa autónoma en Supabase (Empresa + Campo + User Auth + Perfil PROPIETARIO)
    const { registrarClienteAutonomoSupabase } = await import('../../services/supabase');
    const res = await registrarClienteAutonomoSupabase({
      nombreEmpresa: nombreEmpresa.trim(),
      rut: rut.trim() || '210000000000',
      nombreContacto: solicitanteNombre.trim(),
      apellidoContacto: solicitanteApellido.trim() || 'Propietario',
      email: solicitanteEmail.trim(),
      password: solicitantePassword.trim(),
      departamento,
      nombreCampoInicial: nombreCampoInicial.trim() || 'Estancia El Ombú',
      hectareas: isNaN(ha) ? 500 : ha,
    });

    setCargandoEnvio(false);

    if (res.exito) {
      mostrarToast(
        '¡Registro Completado!',
        'Tu Empresa y tu Cuenta de Propietario han sido creadas exitosamente. Ya puedes ingresar.',
        'EXITO'
      );
      setEnviadoExitoso(true);
    } else {
      mostrarToast(
        'Error en el Registro',
        res.error || 'Ocurrió un error al dar de alta la empresa en la base de datos.',
        'ERROR'
      );
    }
  };

  const handleVolver = () => {
    if (onVolverALogin) {
      onVolverALogin();
    } else {
      navigate('/login');
    }
  };

  if (enviadoExitoso) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 border border-slate-200 shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">¡Empresa y Cuenta Creadas con Éxito!</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Se ha completado el alta autónoma para <strong>"{nombreEmpresa}"</strong> en la plataforma AppRural Uruguay.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-1.5 font-medium text-slate-700">
            <p><strong className="text-slate-900">Titular Propietario:</strong> {solicitanteNombre} {solicitanteApellido}</p>
            <p><strong className="text-slate-900">Email de Ingreso:</strong> {solicitanteEmail}</p>
            <p><strong className="text-slate-900">Establecimiento Inicial:</strong> {nombreCampoInicial}</p>
            <p><strong className="text-slate-900">Departamento:</strong> {departamento}</p>
            <p><strong className="text-slate-900">Hectáreas Totales:</strong> {parseFloat(hectareasEstimadas).toLocaleString('es-UY')} Ha</p>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            Tu cuenta tiene rol <strong>PROPIETARIO</strong> activo y tu empresa está vinculada automáticamente en Supabase.
          </p>

          <button
            type="button"
            onClick={handleVolver}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
          >
            ← Ir a Iniciar Sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Contenedor Tarjeta Principal */}
      <div className="max-w-2xl w-full mx-auto space-y-6">
        
        {/* Cabecera / Branding Top */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-950 border border-emerald-700/60 rounded-2xl text-emerald-400 shadow-lg">
            <Wheat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Registro Autónomo de Empresa en AppRural
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Alta 1-Click de Empresa Agropecuaria, Campo Inicial y Usuario Propietario en Uruguay.
          </p>
        </header>

        {/* Tarjeta Formulario de Registro */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-8 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={handleVolver}
              className="inline-flex items-center space-x-1.5 text-xs font-black text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer min-h-[36px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Login</span>
            </button>

            <span className="text-[11px] font-extrabold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Alta Autónomo Productor</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Sección 1: Datos de la Empresa / Establecimiento */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>1. Datos de la Empresa y Campo Inicial</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Razón Social */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Nombre o Razón Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Agropecuaria Del Sur S.A."
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                </div>

                {/* RUT */}
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">RUT (12 dígitos)</label>
                  <input
                    type="text"
                    placeholder="ej: 218765430012"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Nombre de Campo Inicial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Nombre de la Estancia / Campo Principal *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Estancia El Ombú"
                    value={nombreCampoInicial}
                    onChange={(e) => setNombreCampoInicial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Hectáreas Totales *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="ej: 1200"
                    value={hectareasEstimadas}
                    onChange={(e) => setHectareasEstimadas(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Departamento y Dimensiones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <CustomSelect
                    label="Departamento Sede:"
                    value={departamento}
                    options={DEPARTAMENTOS_URUGUAY}
                    onChange={(val) => setDepartamento(val)}
                    icon={<MapPin className="w-4 h-4 text-emerald-600" />}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cantidad Estancias Iniciales</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="ej: 1"
                    value={estanciasEstimadas}
                    onChange={(e) => setEstanciasEstimadas(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Datos del Productor / Solicitante */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>2. Datos de Acceso del Propietario</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Nombre *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="ej: Marcos"
                      value={solicitanteNombre}
                      onChange={(e) => setSolicitanteNombre(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Apellido</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ej: Torres"
                      value={solicitanteApellido}
                      onChange={(e) => setSolicitanteApellido(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Correo Electrónico (Login) *</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="ej: marcos@empresa.com.uy"
                      value={solicitanteEmail}
                      onChange={(e) => setSolicitanteEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Contraseña de Acceso *</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={solicitantePassword}
                      onChange={(e) => setSolicitantePassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Teléfono / Celular</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ej: +598 99 123 456"
                      value={solicitanteTelefono}
                      onChange={(e) => setSolicitanteTelefono(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Comentarios Adicionales</label>
                  <input
                    type="text"
                    placeholder="ej: Producción Ganadera y Agrícola"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                  />
                </div>
              </div>
            </div>

            {/* Botón de Alta Autónoma */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={cargandoEnvio}
                className="w-full bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 text-white font-black text-xs py-4 rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoEnvio ? (
                  <>
                    <Loader2 className="w-4 h-4 text-emerald-300 animate-spin" />
                    <span>Creando Empresa y Cuenta Supabase...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-300" />
                    <span>Registrar Empresa y Cuenta Propietario</span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Footer Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleVolver}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
            >
              ¿Ya tienes una cuenta registrada en AppRural? <strong>Inicia sesión aquí</strong>
            </button>
          </div>

        </div>
      </div>

    </main>
  );
};

