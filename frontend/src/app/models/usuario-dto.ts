export interface UsuarioDto {
    id: number;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    contrasenia: string | null;
    rol: 'SUPERADMINISTRADOR' | 'ADMINISTRADOR' | 'EMPLEADO';
    sucursalId: number | null;
    activo: boolean;
}