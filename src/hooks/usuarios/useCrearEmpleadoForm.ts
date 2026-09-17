import { useState } from 'react';
import { useUsuariosStore } from '../../stores/useUsuariosStore';
import { useToastStore } from '../../stores/useToastStore';
import { usuariosService } from '../../services/api/usuariosService';
import type { UserRole } from '../../types';
import { UserCheck, Tractor, DollarSign, HardHat } from 'lucide-react';

export const useCrearEmpleadoForm = () => {
  const { crearUsuario } = useUsuariosStore();
  const { mostrarToast } = useToastStore();

  const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [rolForm, setRolForm] = useState<UserRole>('CAPATAZ');
  const [estanciasSeleccionadasForm, setEstanciasSeleccionadasForm] = useState<string[]>(['est-1']);
  const [cargandoAltaEmpleado, setCargandoAltaEmpleado] = useState(false);

  const usernameGeneradoPreview = (nombre || apellido)
    ? `${nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '')}.${apellido.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '')}`
    : 'nombre.apellido';

  const handleToggleEstanciaForm = (estanciaId: string) => {
    if (estanciaId === 'TODAS') {
      setEstanciasSeleccionadasForm(['TODAS']);
      return;
    }

    let nuevas = estanciasSeleccionadasForm.filter(id => id !== 'TODAS');
    if (nuevas.includes(estanciaId)) {
      nuevas = nuevas.filter(id => id !== estanciaId);
    } else {
      nuevas.push(estanciaId);
    }

    if (nuevas.length === 0) {
      nuevas = ['TODAS'];
    }

    setEstanciasSeleccionadasForm(nuevas);
  };

  const handleCrearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email) return;

    setCargandoAltaEmpleado(true);
    try {
      const res = await usuariosService.crearUsuarioEmpleado({
        nombre,
        apellido,
        email,
        rol: rolForm,
        empresa_ids: [],
        estancias_asignadas_ids: estanciasSeleccionadasForm,
      });

      if (res.exito) {
        const usernameGenerado = `${nombre.trim().toLowerCase()}.${apellido.trim().toLowerCase()}`;
        crearUsuario({
          nombre,
          apellido,
          email,
          rol: rolForm,
          empresa_ids: [],
          estancias_asignadas_ids: estanciasSeleccionadasForm,
        });

        setCargandoAltaEmpleado(false);
        setMostrarModalAlta(false);
        setNombre('');
        setApellido('');
        setEmail('');

        mostrarToast(
          '¡Empleado Registrado!',
          `Usuario generado: ${usernameGenerado} asignado a ${estanciasSeleccionadasForm.length} campo(s).`,
          'EXITO'
        );
      } else {
        setCargandoAltaEmpleado(false);
        mostrarToast('Error al Guardar Empleado', res.error || 'No se pudo crear el empleado', 'ERROR');
      }
    } catch (err: unknown) {
      setCargandoAltaEmpleado(false);
      const mensaje = err instanceof Error ? err.message : 'Error al registrar el empleado';
      mostrarToast('Error al Guardar Empleado', mensaje, 'ERROR');
    }
  };

  const opcionesRolesForm: { rol: UserRole; titulo: string; icono: React.ElementType; color: string }[] = [
    { rol: 'ADMIN', titulo: 'Admin / Propietario', icono: UserCheck, color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
    { rol: 'CAPATAZ', titulo: 'Capataz de Campo', icono: Tractor, color: 'border-amber-500 bg-amber-50 text-amber-900' },
    { rol: 'CONTADOR', titulo: 'Contador / Asesor', icono: DollarSign, color: 'border-blue-500 bg-blue-50 text-blue-900' },
    { rol: 'OPERARIO', titulo: 'Operario de Campo', icono: HardHat, color: 'border-slate-400 bg-slate-100 text-slate-900' },
  ];

  return {
    mostrarModalAlta,
    setMostrarModalAlta,
    nombre,
    setNombre,
    apellido,
    setApellido,
    email,
    setEmail,
    rolForm,
    setRolForm,
    estanciasSeleccionadasForm,
    handleToggleEstanciaForm,
    cargandoAltaEmpleado,
    usernameGeneradoPreview,
    handleCrearEmpleado,
    opcionesRolesForm,
  };
};
