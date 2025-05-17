package tipy.Stockify.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import tipy.Stockify.business.entities.*;
import tipy.Stockify.business.entities.enums.*;
import tipy.Stockify.business.repositories.*;

import java.time.LocalDate;
import java.util.List;

//@Component
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
    private final SucursalProveedorRepository sucursalProveedorRepository;

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
            ConteoProductoRepository conteoProductoRepository,
            SucursalProveedorRepository sucursalProveedorRepository) {
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
        this.sucursalProveedorRepository = sucursalProveedorRepository;
    }

    @Override
    public void run(String... args) {
        // 1. Empresa
        Empresa empresa1 = new Empresa();
        empresa1.setNombre("Minimercado San Pedro Ltda.");
        empresa1.setRut("76.123.456-7");
        empresa1.setDireccion("Av. Libertador Bernardo O'Higgins 2450, Santiago");
        empresa1.setTelefono("+56223345678");
        empresaRepository.save(empresa1);

        Empresa empresa2 = new Empresa();
        empresa2.setNombre("Almacén La Familiar S.A.");
        empresa2.setRut("77.987.654-3");
        empresa2.setDireccion("Calle Los Alamos 780, Maipú");
        empresa2.setTelefono("+56225556789");
        empresaRepository.save(empresa2);

        // 2. Sucursal
        Sucursal sucursal1 = new Sucursal();
        sucursal1.setNombre("San Pedro Centro");
        sucursal1.setDireccion("Av. Libertador 2450, Local 1, Santiago");
        sucursal1.setTelefono("+56987654321");
        sucursal1.setEmpresa(empresa1);
        sucursalRepository.save(sucursal1);

        Sucursal sucursal2 = new Sucursal();
        sucursal2.setNombre("La Familiar Villa Sur");
        sucursal2.setDireccion("Pasaje Los Olmos 123, Maipú");
        sucursal2.setTelefono("+56991234567");
        sucursal2.setEmpresa(empresa2);
        sucursalRepository.save(sucursal2);

        Sucursal sucursal3 = new Sucursal();
        sucursal3.setNombre("San Pedro Norte");
        sucursal3.setDireccion("Calle Nueva 456, Santiago");
        sucursal3.setTelefono("+56998765432");
        sucursal3.setEmpresa(empresa1);
        sucursalRepository.save(sucursal3);

        // 3. Usuario
        // Superadmin
        Usuario superadmin = new Usuario();
        superadmin.setNombre("Stockify");
        superadmin.setApellido("2025");
        superadmin.setNombreUsuario("stockify");
        superadmin.setContrasenia(passwordEncoder.encode("root"));
        superadmin.setRol(RolUsuario.SUPERADMINISTRADOR);
        superadmin.setSucursal(null);
        usuarioRepository.save(superadmin);

        // Sucursal 1: San Pedro Centro (Expanded)
        Usuario admin1 = new Usuario();
        admin1.setNombre("Prueba");
        admin1.setApellido("Test");
        admin1.setNombreUsuario("prueba.admin");
        admin1.setContrasenia(passwordEncoder.encode("root"));
        admin1.setRol(RolUsuario.ADMINISTRADOR);
        admin1.setSucursal(sucursal1);
        usuarioRepository.save(admin1);

        Usuario empleado1 = new Usuario();
        empleado1.setNombre("Juan");
        empleado1.setApellido("Pérez");
        empleado1.setNombreUsuario("juan.perez");
        empleado1.setContrasenia(passwordEncoder.encode("jperez2025"));
        empleado1.setRol(RolUsuario.EMPLEADO);
        empleado1.setSucursal(sucursal1);
        usuarioRepository.save(empleado1);

        Usuario empleado1_2 = new Usuario();
        empleado1_2.setNombre("Sofía");
        empleado1_2.setApellido("López");
        empleado1_2.setNombreUsuario("sofia.lopez");
        empleado1_2.setContrasenia(passwordEncoder.encode("slopez2025"));
        empleado1_2.setRol(RolUsuario.EMPLEADO);
        empleado1_2.setSucursal(sucursal1);
        usuarioRepository.save(empleado1_2);

        Usuario empleado1_3 = new Usuario();
        empleado1_3.setNombre("Lucas");
        empleado1_3.setApellido("Vega");
        empleado1_3.setNombreUsuario("lucas.vega");
        empleado1_3.setContrasenia(passwordEncoder.encode("lvega2025"));
        empleado1_3.setRol(RolUsuario.EMPLEADO);
        empleado1_3.setSucursal(sucursal1);
        usuarioRepository.save(empleado1_3);

        Usuario admin1_2 = new Usuario();
        admin1_2.setNombre("Valentina");
        admin1_2.setApellido("Morales");
        admin1_2.setNombreUsuario("valentina.morales");
        admin1_2.setContrasenia(passwordEncoder.encode("vmorales2025"));
        admin1_2.setRol(RolUsuario.ADMINISTRADOR);
        admin1_2.setSucursal(sucursal1);
        usuarioRepository.save(admin1_2);

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

        // Sucursal 3: San Pedro Norte
        Usuario admin3 = new Usuario();
        admin3.setNombre("Carla");
        admin3.setApellido("Gómez");
        admin3.setNombreUsuario("carla.gomez");
        admin3.setContrasenia(passwordEncoder.encode("cgomez2025"));
        admin3.setRol(RolUsuario.ADMINISTRADOR);
        admin3.setSucursal(sucursal3);
        usuarioRepository.save(admin3);

        Usuario empleado3 = new Usuario();
        empleado3.setNombre("Diego");
        empleado3.setApellido("Martínez");
        empleado3.setNombreUsuario("diego.martinez");
        empleado3.setContrasenia(passwordEncoder.encode("dmartinez2025"));
        empleado3.setRol(RolUsuario.EMPLEADO);
        empleado3.setSucursal(sucursal3);
        usuarioRepository.save(empleado3);

        // 4. Categoria
        // Sucursal 1: San Pedro Centro (Expanded)
        Categoria categoria1 = new Categoria();
        categoria1.setNombre("Lácteos");
        categoria1.setDescripcion("Leche, yogurt, queso y mantequilla");
        categoria1.setSucursal(sucursal1);
        categoriaRepository.save(categoria1);

        Categoria categoria3 = new Categoria();
        categoria3.setNombre("Limpieza");
        categoria3.setDescripcion("Detergentes, limpiadores y accesorios de limpieza");
        categoria3.setSucursal(sucursal1);
        categoriaRepository.save(categoria3);

        Categoria categoria6 = new Categoria();
        categoria6.setNombre("Carnes");
        categoria6.setDescripcion("Carnes frescas, congeladas y embutidos");
        categoria6.setSucursal(sucursal1);
        categoriaRepository.save(categoria6);

        Categoria categoria7 = new Categoria();
        categoria7.setNombre("Frutas y Verduras");
        categoria7.setDescripcion("Frutas frescas, verduras y hierbas");
        categoria7.setSucursal(sucursal1);
        categoriaRepository.save(categoria7);

        Categoria categoria8 = new Categoria();
        categoria8.setNombre("Congelados");
        categoria8.setDescripcion("Productos congelados y precocidos");
        categoria8.setSucursal(sucursal1);
        categoriaRepository.save(categoria8);

        // Sucursal 2: La Familiar Villa Sur
        Categoria categoria2 = new Categoria();
        categoria2.setNombre("Cereales");
        categoria2.setDescripcion("Arroz, fideos, legumbres y cereales");
        categoria2.setSucursal(sucursal2);
        categoriaRepository.save(categoria2);

        Categoria categoria5 = new Categoria();
        categoria5.setNombre("Panadería");
        categoria5.setDescripcion("Pan, galletas y pasteles");
        categoria5.setSucursal(sucursal2);
        categoriaRepository.save(categoria5);

        // Sucursal 3: San Pedro Norte
        Categoria categoria4 = new Categoria();
        categoria4.setNombre("Bebidas");
        categoria4.setDescripcion("Bebidas gaseosas, jugos y aguas");
        categoria4.setSucursal(sucursal3);
        categoriaRepository.save(categoria4);

        // 5. Proveedor
        Proveedor proveedor1 = new Proveedor();
        proveedor1.setRut("76.555.444-2");
        proveedor1.setNombre("Lácteos Colún S.A.");
        proveedor1.setDireccion("Ruta 5 Sur, Km 943, La Unión");
        proveedor1.setTelefono("+566423321122");
        proveedor1.setNombreVendedor("Rodrigo Esteban Castillo");
        proveedor1.setActivo(true);
        proveedorRepository.save(proveedor1);

        Proveedor proveedor2 = new Proveedor();
        proveedor2.setRut("77.222.333-8");
        proveedor2.setNombre("Tücape Chile Ltda.");
        proveedor2.setDireccion("Camino Lonquen 1123, Talagante");
        proveedor2.setTelefono("+56228563344");
        proveedor2.setNombreVendedor("Carolina Andrea Muñoz");
        proveedor2.setActivo(true);
        proveedorRepository.save(proveedor2);

        Proveedor proveedor3 = new Proveedor();
        proveedor3.setRut("78.333.444-9");
        proveedor3.setNombre("Unilever Chile");
        proveedor3.setDireccion("Av. Apoquindo 3000, Las Condes");
        proveedor3.setTelefono("+56229001122");
        proveedor3.setNombreVendedor("Ana María López");
        proveedor3.setActivo(true);
        proveedorRepository.save(proveedor3);

        Proveedor proveedor4 = new Proveedor();
        proveedor4.setRut("79.444.555-0");
        proveedor4.setNombre("Coca-Cola Chile");
        proveedor4.setDireccion("Av. Vitacura 2670, Santiago");
        proveedor4.setTelefono("+56228003344");
        proveedor4.setNombreVendedor("Pablo Andrés Vargas");
        proveedor4.setActivo(true);
        proveedorRepository.save(proveedor4);

        Proveedor proveedor5 = new Proveedor();
        proveedor5.setRut("80.555.666-1");
        proveedor5.setNombre("Carnes Patagonia Ltda.");
        proveedor5.setDireccion("Ruta 5 Sur, Km 1000, Osorno");
        proveedor5.setTelefono("+56642234567");
        proveedor5.setNombreVendedor("José Miguel Fernández");
        proveedor5.setActivo(true);
        proveedorRepository.save(proveedor5);

        Proveedor proveedor6 = new Proveedor();
        proveedor6.setRut("81.666.777-2");
        proveedor6.setNombre("Frutícola Santiago S.A.");
        proveedor6.setDireccion("Camino Melipilla 1500, Maipú");
        proveedor6.setTelefono("+56227778899");
        proveedor6.setNombreVendedor("Clara Sofía Ramírez");
        proveedor6.setActivo(true);
        proveedorRepository.save(proveedor6);

        // 6. Producto
        // Sucursal 1: San Pedro Centro (Expanded)
        Producto producto1 = new Producto();
        producto1.setCodigoBarra("7801234567890");
        producto1.setImagen("leche_colun.jpg");
        producto1.setNombre("Leche Entera Colún");
        producto1.setDetalle("Leche entera pasteurizada, envase 1 litro");
        producto1.setPrecio(49f);
        producto1.setCantidadStock(200L); // 100 base + 50 lote1 + 50 lote6
        producto1.setActivo(true);
        producto1.setSucursal(sucursal1);
        producto1.setCategoria(categoria1);
        producto1.addProveedor(proveedor1);
        productoRepository.save(producto1);

        Producto producto2 = new Producto();
        producto2.setCodigoBarra("7801234567891");
        producto2.setImagen("detergente_omo.jpg");
        producto2.setNombre("Detergente Omo Matic");
        producto2.setDetalle("Detergente en polvo para ropa, bolsa 800 g");
        producto2.setPrecio(165f);
        producto2.setCantidadStock(120L); // 60 base + 60 lote4
        producto2.setActivo(true);
        producto2.setSucursal(sucursal1);
        producto2.setCategoria(categoria3);
        producto2.addProveedor(proveedor3);
        productoRepository.save(producto2);

        Producto producto7 = new Producto();
        producto7.setCodigoBarra("7801234567892");
        producto7.setImagen("pollo_congelado.jpg");
        producto7.setNombre("Pollo Entero Congelado");
        producto7.setDetalle("Pollo entero congelado, peso aprox. 2 kg");
        producto7.setPrecio(250f);
        producto7.setCantidadStock(80L); // 40 base + 40 lote7
        producto7.setActivo(true);
        producto7.setSucursal(sucursal1);
        producto7.setCategoria(categoria6);
        producto7.addProveedor(proveedor5);
        productoRepository.save(producto7);

        Producto producto8 = new Producto();
        producto8.setCodigoBarra("7801234567893");
        producto8.setImagen("manzanas_fuji.jpg");
        producto8.setNombre("Manzanas Fuji");
        producto8.setDetalle("Manzanas fuji frescas, bolsa 1 kg");
        producto8.setPrecio(60f);
        producto8.setCantidadStock(150L); // 100 base + 50 lote8
        producto8.setActivo(true);
        producto8.setSucursal(sucursal1);
        producto8.setCategoria(categoria7);
        producto8.addProveedor(proveedor6);
        productoRepository.save(producto8);

        Producto producto9 = new Producto();
        producto9.setCodigoBarra("7801234567894");
        producto9.setImagen("papas_fritas_congeladas.jpg");
        producto9.setNombre("Papas Fritas Congeladas");
        producto9.setDetalle("Papas fritas precocidas, bolsa 1 kg");
        producto9.setPrecio(120f);
        producto9.setCantidadStock(100L); // 50 base + 50 lote9
        producto9.setActivo(true);
        producto9.setSucursal(sucursal1);
        producto9.setCategoria(categoria8);
        producto9.addProveedor(proveedor5);
        productoRepository.save(producto9);

        Producto producto10 = new Producto();
        producto10.setCodigoBarra("7801234567895");
        producto10.setImagen("yogurt_natural.jpg");
        producto10.setNombre("Yogurt Natural Colún");
        producto10.setDetalle("Yogurt natural sin azúcar, envase 1 litro");
        producto10.setPrecio(70f);
        producto10.setCantidadStock(180L); // 100 base + 80 lote10
        producto10.setActivo(true);
        producto10.setSucursal(sucursal1);
        producto10.setCategoria(categoria1);
        producto10.addProveedor(proveedor1);
        productoRepository.save(producto10);

        // Sucursal 2: La Familiar Villa Sur
        Producto producto3 = new Producto();
        producto3.setCodigoBarra("7801234567896");
        producto3.setImagen("arroz_tucapel.jpg");
        producto3.setNombre("Arroz Grado 1 Tücape");
        producto3.setDetalle("Arroz blanco grado 1, bolsa 1 kg");
        producto3.setPrecio(68f);
        producto3.setCantidadStock(90L);
        producto3.setActivo(true);
        producto3.setSucursal(sucursal2);
        producto3.setCategoria(categoria2);
        producto3.addProveedor(proveedor2);
        productoRepository.save(producto3);

        Producto producto4 = new Producto();
        producto4.setCodigoBarra("7801234567897");
        producto4.setImagen("pan_integral.jpg");
        producto4.setNombre("Pan Integral Ideal");
        producto4.setDetalle("Pan integral, paquete 600 g");
        producto4.setPrecio(85f);
        producto4.setCantidadStock(50L);
        producto4.setActivo(true);
        producto4.setSucursal(sucursal2);
        producto4.setCategoria(categoria5);
        producto4.addProveedor(proveedor2);
        productoRepository.save(producto4);

        // Sucursal 3: San Pedro Norte
        Producto producto5 = new Producto();
        producto5.setCodigoBarra("7801234567898");
        producto5.setImagen("coca_cola.jpg");
        producto5.setNombre("Coca-Cola Original");
        producto5.setDetalle("Bebida gaseosa, botella 1.5 litros");
        producto5.setPrecio(75f);
        producto5.setCantidadStock(100L);
        producto5.setActivo(true);
        producto5.setSucursal(sucursal3);
        producto5.setCategoria(categoria4);
        producto5.addProveedor(proveedor4);
        productoRepository.save(producto5);

        Producto producto6 = new Producto();
        producto6.setCodigoBarra("7801234567899");
        producto6.setImagen("agua_vital.jpg");
        producto6.setNombre("Agua Mineral Vital");
        producto6.setDetalle("Agua sin gas, botella 1 litro");
        producto6.setPrecio(40f);
        producto6.setCantidadStock(120L);
        producto6.setActivo(true);
        producto6.setSucursal(sucursal3);
        producto6.setCategoria(categoria4);
        producto6.addProveedor(proveedor4);
        productoRepository.save(producto6);

        // 7. Lote
        // Sucursal 1: San Pedro Centro (Expanded)
        Lote lote1 = new Lote();
        lote1.setNumeroLote("L2025-001");
        lote1.setFechaIngreso(LocalDate.of(2025, 3, 10));
        lote1.setFechaVencimiento(LocalDate.of(2025, 8, 10));
        lote1.setCantidadStock(50);
        lote1.setActivo(true);
        lote1.setProducto(producto1);
        producto1.addLote(lote1);
        producto1.setCantidadStock(producto1.getCantidadStock());
        loteRepository.save(lote1);

        Lote lote6 = new Lote();
        lote6.setNumeroLote("L2025-006");
        lote6.setFechaIngreso(LocalDate.of(2025, 4, 15));
        lote6.setFechaVencimiento(LocalDate.of(2025, 9, 15));
        lote6.setCantidadStock(50);
        lote6.setActivo(true);
        lote6.setProducto(producto1);
        producto1.addLote(lote6);
        producto1.setCantidadStock(producto1.getCantidadStock());
        loteRepository.save(lote6);

        Lote lote4 = new Lote();
        lote4.setNumeroLote("L2025-004");
        lote4.setFechaIngreso(LocalDate.of(2025, 4, 5));
        lote4.setFechaVencimiento(null);
        lote4.setCantidadStock(60);
        lote4.setActivo(true);
        lote4.setProducto(producto2);
        producto2.addLote(lote4);
        producto2.setCantidadStock(producto2.getCantidadStock());
        loteRepository.save(lote4);

        Lote lote7 = new Lote();
        lote7.setNumeroLote("L2025-007");
        lote7.setFechaIngreso(LocalDate.of(2025, 4, 20));
        lote7.setFechaVencimiento(LocalDate.of(2025, 5, 20));
        lote7.setCantidadStock(40);
        lote7.setActivo(true);
        lote7.setProducto(producto7);
        producto7.addLote(lote7);
        producto7.setCantidadStock(producto7.getCantidadStock());
        loteRepository.save(lote7);

        Lote lote8 = new Lote();
        lote8.setNumeroLote("L2025-008");
        lote8.setFechaIngreso(LocalDate.of(2025, 4, 25));
        lote8.setFechaVencimiento(LocalDate.of(2025, 5, 5));
        lote8.setCantidadStock(50);
        lote8.setActivo(true);
        lote8.setProducto(producto8);
        producto8.addLote(lote8);
        producto8.setCantidadStock(producto8.getCantidadStock());
        loteRepository.save(lote8);

        Lote lote9 = new Lote();
        lote9.setNumeroLote("L2025-009");
        lote9.setFechaIngreso(LocalDate.of(2025, 4, 30));
        lote9.setFechaVencimiento(LocalDate.of(2026, 4, 30));
        lote9.setCantidadStock(50);
        lote9.setActivo(true);
        lote9.setProducto(producto9);
        producto9.addLote(lote9);
        producto9.setCantidadStock(producto9.getCantidadStock());
        loteRepository.save(lote9);

        Lote lote10 = new Lote();
        lote10.setNumeroLote("L2025-010");
        lote10.setFechaIngreso(LocalDate.of(2025, 5, 1));
        lote10.setFechaVencimiento(LocalDate.of(2025, 10, 1));
        lote10.setCantidadStock(80);
        lote10.setActivo(true);
        lote10.setProducto(producto10);
        producto10.addLote(lote10);
        producto10.setCantidadStock(producto10.getCantidadStock());
        loteRepository.save(lote10);

        // Sucursal 2: La Familiar Villa Sur
        Lote lote2 = new Lote();
        lote2.setNumeroLote("L2025-002");
        lote2.setFechaIngreso(LocalDate.of(2025, 3, 15));
        lote2.setFechaVencimiento(LocalDate.of(2026, 3, 15));
        lote2.setCantidadStock(30);
        lote2.setActivo(true);
        lote2.setProducto(producto3);
        producto3.addLote(lote2);
        producto3.setCantidadStock(producto3.getCantidadStock());
        loteRepository.save(lote2);

        Lote lote5 = new Lote();
        lote5.setNumeroLote("L2025-005");
        lote5.setFechaIngreso(LocalDate.of(2025, 4, 10));
        lote5.setFechaVencimiento(LocalDate.of(2025, 6, 10));
        lote5.setCantidadStock(15);
        lote5.setActivo(true);
        lote5.setProducto(producto4);
        producto4.addLote(lote5);
        producto4.setCantidadStock(producto4.getCantidadStock());
        loteRepository.save(lote5);

        // Sucursal 3: San Pedro Norte
        Lote lote3 = new Lote();
        lote3.setNumeroLote("L2025-003");
        lote3.setFechaIngreso(LocalDate.of(2025, 4, 1));
        lote3.setFechaVencimiento(LocalDate.of(2025, 7, 1));
        lote3.setCantidadStock(40);
        lote3.setActivo(true);
        lote3.setProducto(producto5);
        producto5.addLote(lote3);
        producto5.setCantidadStock(producto5.getCantidadStock());
        loteRepository.save(lote3);

        // 8. Conteo
        // Sucursal 1: San Pedro Centro (Expanded)
        Conteo conteo1 = new Conteo();
        conteo1.setFechaHora(LocalDate.of(2025, 4, 20));
        conteo1.setConteoFinalizado(false);
        conteo1.setUsuario(admin1);
        conteoRepository.save(conteo1);

        Conteo conteo4 = new Conteo();
        conteo4.setFechaHora(LocalDate.of(2025, 5, 1));
        conteo4.setConteoFinalizado(true);
        conteo4.setUsuario(admin1_2);
        conteoRepository.save(conteo4);

        Conteo conteo5 = new Conteo();
        conteo5.setFechaHora(LocalDate.of(2025, 5, 5));
        conteo5.setConteoFinalizado(false);
        conteo5.setUsuario(admin1);
        conteoRepository.save(conteo5);

        // Sucursal 2: La Familiar Villa Sur
        Conteo conteo2 = new Conteo();
        conteo2.setFechaHora(LocalDate.of(2025, 4, 21));
        conteo2.setConteoFinalizado(true);
        conteo2.setUsuario(admin2);
        conteoRepository.save(conteo2);

        // Sucursal 3: San Pedro Norte
        Conteo conteo3 = new Conteo();
        conteo3.setFechaHora(LocalDate.of(2025, 4, 22));
        conteo3.setConteoFinalizado(false);
        conteo3.setUsuario(admin3);
        conteoRepository.save(conteo3);

        // 9. ConteoProducto
        // Sucursal 1: San Pedro Centro (Expanded)
        ConteoProducto conteoProducto1 = new ConteoProducto();
        conteoProducto1.setPrecioActual(49f);
        conteoProducto1.setCantidadEsperada(200);
        conteoProducto1.setCantidadContada(195);
        conteoProducto1.setConteo(conteo1);
        conteoProducto1.setProducto(producto1);
        conteoProductoRepository.save(conteoProducto1);

        ConteoProducto conteoProducto3 = new ConteoProducto();
        conteoProducto3.setPrecioActual(165f);
        conteoProducto3.setCantidadEsperada(120);
        conteoProducto3.setCantidadContada(118);
        conteoProducto3.setConteo(conteo1);
        conteoProducto3.setProducto(producto2);
        conteoProductoRepository.save(conteoProducto3);

        ConteoProducto conteoProducto5 = new ConteoProducto();
        conteoProducto5.setPrecioActual(250f);
        conteoProducto5.setCantidadEsperada(80);
        conteoProducto5.setCantidadContada(78);
        conteoProducto5.setConteo(conteo4);
        conteoProducto5.setProducto(producto7);
        conteoProductoRepository.save(conteoProducto5);

        ConteoProducto conteoProducto6 = new ConteoProducto();
        conteoProducto6.setPrecioActual(60f);
        conteoProducto6.setCantidadEsperada(150);
        conteoProducto6.setCantidadContada(145);
        conteoProducto6.setConteo(conteo4);
        conteoProducto6.setProducto(producto8);
        conteoProductoRepository.save(conteoProducto6);

        ConteoProducto conteoProducto7 = new ConteoProducto();
        conteoProducto7.setPrecioActual(120f);
        conteoProducto7.setCantidadEsperada(100);
        conteoProducto7.setCantidadContada(102);
        conteoProducto7.setConteo(conteo5);
        conteoProducto7.setProducto(producto9);
        conteoProductoRepository.save(conteoProducto7);

        ConteoProducto conteoProducto8 = new ConteoProducto();
        conteoProducto8.setPrecioActual(70f);
        conteoProducto8.setCantidadEsperada(180);
        conteoProducto8.setCantidadContada(178);
        conteoProducto8.setConteo(conteo5);
        conteoProducto8.setProducto(producto10);
        conteoProductoRepository.save(conteoProducto8);

        // Sucursal 2: La Familiar Villa Sur
        ConteoProducto conteoProducto2 = new ConteoProducto();
        conteoProducto2.setPrecioActual(68f);
        conteoProducto2.setCantidadEsperada(90);
        conteoProducto2.setCantidadContada(92);
        conteoProducto2.setConteo(conteo2);
        conteoProducto2.setProducto(producto3);
        conteoProductoRepository.save(conteoProducto2);

        // Sucursal 3: San Pedro Norte
        ConteoProducto conteoProducto4 = new ConteoProducto();
        conteoProducto4.setPrecioActual(75f);
        conteoProducto4.setCantidadEsperada(100);
        conteoProducto4.setCantidadContada(98);
        conteoProducto4.setConteo(conteo3);
        conteoProducto4.setProducto(producto5);
        conteoProductoRepository.save(conteoProducto4);

        // 10. Reporte
        // Sucursal 1: San Pedro Centro (Expanded)
        Reporte reporte1 = new Reporte();
        reporte1.setFechaGeneracion(LocalDate.of(2025, 4, 20));
        reporte1.setTotalFaltante(7f); // 5 leches + 2 detergentes
        reporte1.setTotalSobrante(0f);
        reporte1.setDiferenciaMonetaria(-575f); // -(5*49 + 2*165)
        reporte1.setConteos(List.of(conteo1));
        reporteRepository.save(reporte1);

        Reporte reporte4 = new Reporte();
        reporte4.setFechaGeneracion(LocalDate.of(2025, 5, 1));
        reporte4.setTotalFaltante(7f); // 2 pollos + 5 manzanas
        reporte4.setTotalSobrante(0f);
        reporte4.setDiferenciaMonetaria(-800f); // -(2*250 + 5*60)
        reporte4.setConteos(List.of(conteo4));
        reporteRepository.save(reporte4);

        Reporte reporte5 = new Reporte();
        reporte5.setFechaGeneracion(LocalDate.of(2025, 5, 5));
        reporte5.setTotalFaltante(2f); // 2 yogures
        reporte5.setTotalSobrante(2f); // 2 papas fritas
        reporte5.setDiferenciaMonetaria(100f); // (2*120 - 2*70)
        reporte5.setConteos(List.of(conteo5));
        reporteRepository.save(reporte5);

        // Sucursal 2: La Familiar Villa Sur
        Reporte reporte2 = new Reporte();
        reporte2.setFechaGeneracion(LocalDate.of(2025, 4, 21));
        reporte2.setTotalFaltante(0f);
        reporte2.setTotalSobrante(2f);
        reporte2.setDiferenciaMonetaria(136f);
        reporte2.setConteos(List.of(conteo2));
        reporteRepository.save(reporte2);

        // Sucursal 3: San Pedro Norte
        Reporte reporte3 = new Reporte();
        reporte3.setFechaGeneracion(LocalDate.of(2025, 4, 22));
        reporte3.setTotalFaltante(2f);
        reporte3.setTotalSobrante(0f);
        reporte3.setDiferenciaMonetaria(-150f);
        reporte3.setConteos(List.of(conteo3));
        reporteRepository.save(reporte3);

        // 11. SucursalProveedor
        // Sucursal 1: San Pedro Centro (Expanded)
        SucursalProveedor sp1 = new SucursalProveedor();
        sp1.setSucursal(sucursal1);
        sp1.setProveedor(proveedor1);
        sucursalProveedorRepository.save(sp1);

        SucursalProveedor sp2 = new SucursalProveedor();
        sp2.setSucursal(sucursal1);
        sp2.setProveedor(proveedor3);
        sucursalProveedorRepository.save(sp2);

        SucursalProveedor sp5 = new SucursalProveedor();
        sp5.setSucursal(sucursal1);
        sp5.setProveedor(proveedor5);
        sucursalProveedorRepository.save(sp5);

        SucursalProveedor sp6 = new SucursalProveedor();
        sp6.setSucursal(sucursal1);
        sp6.setProveedor(proveedor6);
        sucursalProveedorRepository.save(sp6);

        // Sucursal 2: La Familiar Villa Sur
        SucursalProveedor sp3 = new SucursalProveedor();
        sp3.setSucursal(sucursal2);
        sp3.setProveedor(proveedor2);
        sucursalProveedorRepository.save(sp3);

        // Sucursal 3: San Pedro Norte
        SucursalProveedor sp4 = new SucursalProveedor();
        sp4.setSucursal(sucursal3);
        sp4.setProveedor(proveedor4);
        sucursalProveedorRepository.save(sp4);
    }
}