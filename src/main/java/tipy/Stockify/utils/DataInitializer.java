package tipy.Stockify.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import tipy.Stockify.business.entities.*;
import tipy.Stockify.business.entities.enums.*;
import tipy.Stockify.business.repositories.*;

import java.time.LocalDate;

public class DataInitializer implements CommandLineRunner {

    private final EmpresaRepository empresaRepository;
    private final SucursalRepository sucursalRepository;
    private final UsuarioRepository usuarioRepository;
    private final ConteoRepository conteoRepository;
    private final ReporteRepository reporteRepository;
    private final ProductoRepository productoRepository;
    private final LoteRepository loteRepository;
    private final ProveedorRepository proveedorRepository;
    private final CategoriaRepository categoriaRepository;
    private final ConteoProductoRepository conteoProductoRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public DataInitializer(
            EmpresaRepository empresaRepository,
            SucursalRepository sucursalRepository,
            UsuarioRepository usuarioRepository,
            ConteoRepository conteoRepository,
            ReporteRepository reporteRepository,
            ProductoRepository productoRepository,
            LoteRepository loteRepository,
            ProveedorRepository proveedorRepository,
            CategoriaRepository categoriaRepository,
            ConteoProductoRepository conteoProductoRepository) {
        this.empresaRepository = empresaRepository;
        this.sucursalRepository = sucursalRepository;
        this.usuarioRepository = usuarioRepository;
        this.conteoRepository = conteoRepository;
        this.reporteRepository = reporteRepository;
        this.productoRepository = productoRepository;
        this.loteRepository = loteRepository;
        this.proveedorRepository = proveedorRepository;
        this.categoriaRepository = categoriaRepository;
        this.conteoProductoRepository = conteoProductoRepository;
    }

    @Override
    public void run(String... args) {
        // 1. Empresa
        Empresa empresa1 = new Empresa();
        empresa1.setNombre("Minimercado San Pedro Ltda.");
        empresa1.setRut("76.123.456-7");
        empresa1.setDireccion("Av. Libertador Bernardo O'Higgins 2450, Santiago");
        empresa1.setTelefono("+562 2334 5678");
        empresaRepository.save(empresa1);

        Empresa empresa2 = new Empresa();
        empresa2.setNombre("Almacén La Familiar S.A.");
        empresa2.setRut("77.987.654-3");
        empresa2.setDireccion("Calle Los Alamos 780, Maipú");
        empresa2.setTelefono("+562 2555 6789");
        empresaRepository.save(empresa2);

        // 2. Sucursal
        Sucursal sucursal1 = new Sucursal();
        sucursal1.setNombre("San Pedro Centro");
        sucursal1.setDireccion("Av. Libertador 2450, Local 1, Santiago");
        sucursal1.setTelefono("+569 8765 4321");
        sucursal1.setEmpresa(empresa1);
        sucursalRepository.save(sucursal1);

        Sucursal sucursal2 = new Sucursal();
        sucursal2.setNombre("La Familiar Villa Sur");
        sucursal2.setDireccion("Pasaje Los Olmos 123, Maipú");
        sucursal2.setTelefono("+569 9123 4567");
        sucursal2.setEmpresa(empresa2);
        sucursalRepository.save(sucursal2);

        // 3. Usuario
        Usuario superadmin = new Usuario();
        superadmin.setNombre("Stockify");
        superadmin.setApellido("2025");
        superadmin.setNombreUsuario("stockify");
        superadmin.setContrasenia(passwordEncoder.encode("root"));
        superadmin.setRol(RolUsuario.SUPERADMINISTRADOR);
        superadmin.setSucursal(null);
        usuarioRepository.save(superadmin);

        // Sucursal 1: San Pedro Centro
        Usuario admin1 = new Usuario();
        admin1.setNombre("Prueba");
        admin1.setApellido("Test");
        admin1.setNombreUsuario("prueba.admin");
        admin1.setContrasenia(passwordEncoder.encode("root"));
        admin1.setRol(RolUsuario.ADMINISTRADOR);
        admin1.setSucursal(sucursal1);
        usuarioRepository.save(admin1);

        Usuario empleado1 = new Usuario();
        empleado1.setNombre("Prueba");
        empleado1.setApellido("Test");
        empleado1.setNombreUsuario("prueba.empleado");
        empleado1.setContrasenia(passwordEncoder.encode("root"));
        empleado1.setRol(RolUsuario.EMPLEADO);
        empleado1.setSucursal(sucursal1);
        usuarioRepository.save(empleado1);

        // Sucursal 2: La Familiar Villa Sur
        Usuario admin2 = new Usuario();
        admin2.setNombre("María Fernanda");
        admin2.setApellido("Rojas Díaz");
        admin2.setNombreUsuario("maria.rojas");
        admin2.setContrasenia(passwordEncoder.encode("mrojas2025"));
        admin2.setRol(RolUsuario.ADMINISTRADOR);
        admin2.setSucursal(sucursal2);
        usuarioRepository.save(admin2);

        Usuario empleado2 = new Usuario();
        empleado2.setNombre("Felipe Andrés");
        empleado2.setApellido("Torres Castillo");
        empleado2.setNombreUsuario("felipe.torres");
        empleado2.setContrasenia(passwordEncoder.encode("ftorres2025"));
        empleado2.setRol(RolUsuario.EMPLEADO);
        empleado2.setSucursal(sucursal2);
        usuarioRepository.save(empleado2);

        // 4. Categoria
        Categoria categoria1 = new Categoria();
        categoria1.setNombre("Lácteos");
        categoria1.setDescripcion("Leche, yogurt, queso y mantequilla");
        categoria1.setSucursal(sucursal1);
        categoriaRepository.save(categoria1);

        Categoria categoria2 = new Categoria();
        categoria2.setNombre("Cereales");
        categoria2.setDescripcion("Arroz, fideos, legumbres y cereales");
        categoria2.setSucursal(sucursal2);
        categoriaRepository.save(categoria2);

        Categoria categoria3 = new Categoria();
        categoria3.setNombre("Limpieza");
        categoria3.setDescripcion("Detergentes, limpiadores y accesorios de limpieza");
        categoria3.setSucursal(sucursal1);
        categoriaRepository.save(categoria3);

        // 5. Producto
        Producto producto1 = new Producto();
        producto1.setCodigoBarra("7801234567890");
        producto1.setImagen("leche_colun.jpg");
        producto1.setNombre("Leche Entera Colún");
        producto1.setDetalle("Leche entera pasteurizada, envase 1 litro");
        producto1.setPrecio(49f); // Precio en pesos uruguayos
        producto1.setCantidadStock(120L);
        producto1.setSucursal(sucursal1);
        producto1.setCategoria(categoria1);
        productoRepository.save(producto1);

        Producto producto2 = new Producto();
        producto2.setCodigoBarra("7809876543210");
        producto2.setImagen("arroz_tucapel.jpg");
        producto2.setNombre("Arroz Grado 1 Tücape");
        producto2.setDetalle("Arroz blanco grado 1, bolsa 1 kg");
        producto2.setPrecio(68f); // Precio en pesos uruguayos
        producto2.setCantidadStock(90L);
        producto2.setSucursal(sucursal2);
        producto2.setCategoria(categoria2);
        productoRepository.save(producto2);

        Producto producto3 = new Producto();
        producto3.setCodigoBarra("7801112223334");
        producto3.setImagen("detergente_omo.jpg");
        producto3.setNombre("Detergente Omo Matic");
        producto3.setDetalle("Detergente en polvo para ropa, bolsa 800 g");
        producto3.setPrecio(165f); // Precio en pesos uruguayos
        producto3.setCantidadStock(60L);
        producto3.setSucursal(sucursal1);
        producto3.setCategoria(categoria3);
        productoRepository.save(producto3);

        // 6. Conteo
        Conteo conteo1 = new Conteo();
        conteo1.setFechaHora(LocalDate.of(2025, 4, 20));
        conteo1.setConteoFinalizado(false);
        conteo1.setUsuario(admin1); // Asignado al administrador de Sucursal 1
        conteoRepository.save(conteo1);

        Conteo conteo2 = new Conteo();
        conteo2.setFechaHora(LocalDate.of(2025, 4, 21));
        conteo2.setConteoFinalizado(true);
        conteo2.setUsuario(admin2); // Asignado al administrador de Sucursal 2
        conteoRepository.save(conteo2);

        // 7. ConteoProducto
        ConteoProducto conteoProducto1 = new ConteoProducto();
        conteoProducto1.setPrecioActual(49f);
        conteoProducto1.setCantidadEsperada(120);
        conteoProducto1.setCantidadContada(118);
        conteoProducto1.setConteo(conteo1);
        conteoProducto1.setProducto(producto1);
        conteoProductoRepository.save(conteoProducto1);

        ConteoProducto conteoProducto2 = new ConteoProducto();
        conteoProducto2.setPrecioActual(68f);
        conteoProducto2.setCantidadEsperada(90);
        conteoProducto2.setCantidadContada(92);
        conteoProducto2.setConteo(conteo2);
        conteoProducto2.setProducto(producto2);
        conteoProductoRepository.save(conteoProducto2);

        ConteoProducto conteoProducto3 = new ConteoProducto();
        conteoProducto3.setPrecioActual(165f);
        conteoProducto3.setCantidadEsperada(60);
        conteoProducto3.setCantidadContada(58);
        conteoProducto3.setConteo(conteo1);
        conteoProducto3.setProducto(producto3);
        conteoProductoRepository.save(conteoProducto3);

        // 8. Reporte
        Reporte reporte1 = new Reporte();
        reporte1.setFechaGeneracion(LocalDate.of(2025, 4, 20));
        reporte1.setTotalFaltante(4f); // 2 leches + 2 detergentes
        reporte1.setTotalSobrante(0f);
        reporte1.setDiferenciaMonetaria(-428f); // -(2*49 + 2*165)
        reporteRepository.save(reporte1);

        Reporte reporte2 = new Reporte();
        reporte2.setFechaGeneracion(LocalDate.of(2025, 4, 21));
        reporte2.setTotalFaltante(0f);
        reporte2.setTotalSobrante(2f); // 2 arroces
        reporte2.setDiferenciaMonetaria(136f); // 2*68
        reporteRepository.save(reporte2);

        // 9. Proveedor
        Proveedor proveedor1 = new Proveedor();
        proveedor1.setRut("76.555.444-2");
        proveedor1.setNombre("Lácteos Colún S.A.");
        proveedor1.setDireccion("Ruta 5 Sur, Km 943, La Unión");
        proveedor1.setTelefono("+5664 2332 1122");
        proveedor1.setNombreVendedor("Rodrigo Esteban Castillo");
        proveedorRepository.save(proveedor1);

        Proveedor proveedor2 = new Proveedor();
        proveedor2.setRut("77.222.333-8");
        proveedor2.setNombre("Tücape Chile Ltda.");
        proveedor2.setDireccion("Camino Lonquen 1123, Talagante");
        proveedor2.setTelefono("+562 2856 3344");
        proveedor2.setNombreVendedor("Carolina Andrea Muñoz");
        proveedorRepository.save(proveedor2);

        // 10. Lote
        Lote lote1 = new Lote();
        lote1.setNumeroLote("L2025-001");
        lote1.setFechaIngreso(LocalDate.of(2025, 3, 10));
        lote1.setFechaVencimiento(LocalDate.of(2025, 8, 10)); // 5 meses, típico para leche
        loteRepository.save(lote1);

        Lote lote2 = new Lote();
        lote2.setNumeroLote("L2025-002");
        lote2.setFechaIngreso(LocalDate.of(2025, 3, 15));
        lote2.setFechaVencimiento(LocalDate.of(2026, 3, 15)); // 1 año, típico para arroz
        loteRepository.save(lote2);
    }
}