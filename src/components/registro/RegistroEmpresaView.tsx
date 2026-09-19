import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  Send,
  Mail,
  User,
  Phone,
  Loader2,
  AlertCircle,
  IdCard,
  Tractor
} from 'lucide-react';
import { solicitudRegistroSchema } from '../../schemas/solicitudSchema';
import { formatearCIUruguaya, formatearTelefonoUruguayo } from '../../utils/validacionesUruguay';

interface RegistroEmpresaViewProps {
  onVolverALogin?: () => void;
}

export const RegistroEmpresaView: React.FC<RegistroEmpresaViewProps> = ({ onVolverALogin }) => {
  const navigate = useNavigate();

  const [solicitanteNombre, setSolicitanteNombre] = useState('');
  const [solicitanteApellido, setSolicitanteApellido] = useState('');
  const [solicitanteCI, setSolicitanteCI] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');
  const [solicitanteTelefono, setSolicitanteTelefono] = useState('');
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  const [enviadoExitoso, setEnviadoExitoso] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);

  const handleCIChange = (val: string) => {
    setSolicitanteCI(formatearCIUruguaya(val));
  };

  const handleTelefonoChange = (val: string) => {
    setSolicitanteTelefono(formatearTelefonoUruguayo(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFormulario(null);

    // Validar datos antes de enviar
    const validacion = solicitudRegistroSchema.safeParse({
      nombre: solicitanteNombre,
      apellido: solicitanteApellido,
      ci: solicitanteCI,
      email: solicitanteEmail,
      telefono: solicitanteTelefono || undefined,
    });

    if (!validacion.success) {
      setErrorFormulario('Por favor completa todos los campos requeridos en el formato correcto.');
      return;
    }

    const datosValidados = validacion.data;
    setCargandoEnvio(true);

    const { enviarSolicitudRegistroBD } = await import('../../services/supabase');
    const res = await enviarSolicitudRegistroBD({
      nombre: datosValidados.nombre,
      apellido: datosValidados.apellido,
      ci: datosValidados.ci,
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
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 border border-slate-800 shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-800/80 shadow-md">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">¡Solicitud Registrada!</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Tu solicitud para sumarte a AgroUY fue enviada con éxito.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left text-xs space-y-1.5 font-medium text-slate-300">
            <p><strong className="text-emerald-400">Solicitante:</strong> {solicitanteNombre} {solicitanteApellido}</p>
            <p><strong className="text-emerald-400">C.I.:</strong> {solicitanteCI}</p>
            <p><strong className="text-emerald-400">Email de Contacto:</strong> {solicitanteEmail.toLowerCase()}</p>
            <p><strong className="text-emerald-400">Estado:</strong> PENDIENTE DE APROBACIÓN POR SUPERADMIN</p>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            El SuperAdministrador revisará tu solicitud y habilitará tu cuenta. Luego ingresarás y configurarás tu empresa y campos.
          </p>

          <button
            type="button"
            onClick={handleVolver}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg cursor-pointer transition-all active:scale-98 min-h-[46px]"
          >
            Volver al Inicio de Sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950">
      
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Header con Marca AgroUY identico a Login */}
        <header className="text-center space-y-2">
          <div className="inline-flex bg-gradient-to-br from-emerald-500 to-emerald-700 p-3.5 rounded-2xl text-white shadow-xl shadow-emerald-950/80 border border-emerald-400/30 mb-2">
            <Tractor className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
            AGRO<span className="text-emerald-400">UY</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Gestión Rural Uruguay • Solicitud de Alta de Empresa
          </p>
        </header>

        {/* Tarjeta de Formulario Oscura sin blur */}
        <section aria-label="Formulario de Solicitud de Alta" className="bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={handleVolver}
              className="inline-flex items-center space-x-2 text-xs font-extrabold text-emerald-400 hover:text-emerald-300 bg-slate-950 hover:bg-slate-800/80 border border-emerald-500/40 hover:border-emerald-500/70 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-sm active:scale-95 group"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Volver a Iniciar Sesión</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Nombre *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ej: Marcos"
                    value={solicitanteNombre}
                    onChange={(e) => setSolicitanteNombre(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 font-bold placeholder-slate-400 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Apellido *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ej: Torres"
                    value={solicitanteApellido}
                    onChange={(e) => setSolicitanteApellido(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 font-bold placeholder-slate-400 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Cédula de Identidad */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Cédula de Identidad (C.I.) *</label>
              <div className="relative">
                <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="ej: 1.234.567-8"
                  value={solicitanteCI}
                  onChange={(e) => handleCIChange(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 font-bold placeholder-slate-400 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            {/* Email de Contacto */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Correo Electrónico *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ej: marcos@estancia.com"
                  value={solicitanteEmail}
                  onChange={(e) => setSolicitanteEmail(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 font-bold placeholder-slate-400 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            {/* Teléfono de Contacto */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Teléfono de Contacto *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="ej: 099 123 456"
                  value={solicitanteTelefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 font-bold placeholder-slate-400 text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            {errorFormulario && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center space-x-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorFormulario}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={cargandoEnvio}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-98 transition-all duration-200 flex items-center justify-center space-x-2 min-h-[46px] mt-2 cursor-pointer disabled:opacity-50"
            >
              {cargandoEnvio ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Enviando Solicitud...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Solicitud de Acceso</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-600">
          AgroUY • Sistema de Gestión de Empresa Rural en Uruguay
        </footer>

      </div>
    </main>
  );
};
