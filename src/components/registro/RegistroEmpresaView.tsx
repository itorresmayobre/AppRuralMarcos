import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  Send,
  ShieldCheck,
  Wheat,
  Mail,
  User,
  Phone,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { solicitudRegistroSchema } from '../../schemas/solicitudSchema';

interface RegistroEmpresaViewProps {
  onVolverALogin?: () => void;
}

export const RegistroEmpresaView: React.FC<RegistroEmpresaViewProps> = ({ onVolverALogin }) => {
  const navigate = useNavigate();

  const [solicitanteNombre, setSolicitanteNombre] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');
  const [solicitanteTelefono, setSolicitanteTelefono] = useState('');
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  const [enviadoExitoso, setEnviadoExitoso] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFormulario(null);
    setErroresCampo({});

    // Validar con Zod antes de enviar
    const validacion = solicitudRegistroSchema.safeParse({
      nombreContacto: solicitanteNombre,
      email: solicitanteEmail,
      telefono: solicitanteTelefono || undefined,
    });

    if (!validacion.success) {
      const mapaErrores: Record<string, string> = {};
      validacion.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          mapaErrores[issue.path[0].toString()] = issue.message;
        }
      });
      setErroresCampo(mapaErrores);
      setErrorFormulario('Por favor corrige los errores indicados en el formulario.');
      return;
    }

    const datosValidados = validacion.data;
    setCargandoEnvio(true);

    const { enviarSolicitudRegistroBD } = await import('../../services/supabase');
    const res = await enviarSolicitudRegistroBD({
      nombreContacto: datosValidados.nombreContacto,
      email: datosValidados.email,
      telefono: datosValidados.telefono,
    });

    setCargandoEnvio(false);

    if (res.exito) {
      setEnviadoExitoso(true);
    } else {
      setErrorFormulario(res.error || 'Ocurrió un error al enviar la solicitud de registro.');
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
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">¡Solicitud Registrada!</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Tu solicitud para sumarte a AgroUY fue enviada con éxito.
            </p>
          </div>

          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-left text-xs space-y-1.5 font-medium text-amber-950">
            <p><strong className="text-amber-900">Solicitante:</strong> {solicitanteNombre}</p>
            <p><strong className="text-amber-900">Email de Contacto:</strong> {solicitanteEmail.toLowerCase()}</p>
            <p><strong className="text-amber-900">Estado:</strong> PENDIENTE DE APROBACIÓN POR SUPERADMIN</p>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            El SuperAdministrador revisará tu solicitud y habilitará tu cuenta. Luego ingresarás y configurarás tu empresa y campos.
          </p>

          <button
            type="button"
            onClick={handleVolver}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          >
            Volver al Inicio de Sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-md w-full mx-auto space-y-6">
        
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-950 border border-emerald-700/60 rounded-2xl text-emerald-400 shadow-lg">
            <Wheat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Solicitar Acceso a AgroUY
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Registro rápido de cuenta. Configuras tu empresa y campos al ingresar.
          </p>
        </header>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={handleVolver}
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Login</span>
            </button>

            <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Validación Zod</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs" noValidate>
            
            {/* Nombre y Apellido del Solicitante */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Nombre y Apellido *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="ej: Marcos Torres"
                  value={solicitanteNombre}
                  onChange={(e) => setSolicitanteNombre(e.target.value)}
                  className={`w-full bg-slate-50 border rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold text-slate-900 focus:ring-2 min-h-[40px] ${
                    erroresCampo.nombreContacto ? 'border-rose-400 ring-rose-400/30' : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {erroresCampo.nombreContacto && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">{erroresCampo.nombreContacto}</p>
              )}
            </div>

            {/* Email de Contacto */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Email de Contacto *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="ej: marcos@estancia.com"
                  value={solicitanteEmail}
                  onChange={(e) => setSolicitanteEmail(e.target.value)}
                  className={`w-full bg-slate-50 border rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold text-slate-900 focus:ring-2 min-h-[40px] ${
                    erroresCampo.email ? 'border-rose-400 ring-rose-400/30' : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {erroresCampo.email && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">{erroresCampo.email}</p>
              )}
            </div>

            {/* Teléfono de Contacto (Opcional) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Teléfono de Contacto (Opcional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="ej: 099 123 456"
                  value={solicitanteTelefono}
                  onChange={(e) => setSolicitanteTelefono(e.target.value)}
                  className={`w-full bg-slate-50 border rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold text-slate-900 focus:ring-2 min-h-[40px] ${
                    erroresCampo.telefono ? 'border-rose-400 ring-rose-400/30' : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {erroresCampo.telefono && (
                <p className="text-[11px] text-rose-600 font-medium pl-1">{erroresCampo.telefono}</p>
              )}
            </div>

            {errorFormulario && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{errorFormulario}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargandoEnvio}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center space-x-2 min-h-[42px] mt-2 disabled:opacity-50"
            >
              {cargandoEnvio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Validando y Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Solicitud de Acceso</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
