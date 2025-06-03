package tipy.Stockify.dtos;

public class ProductoVendidosDto {

    private Long productoId;
    private String nombreProducto;
    private Long cantidadVendida; // antes Integer, ahora Long

    public ProductoVendidosDto() { }

    public ProductoVendidosDto(Long productoId, String nombreProducto, Long cantidadVendida) {
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.cantidadVendida = cantidadVendida;
    }

    // Getters y setters actualizados
    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public Long getCantidadVendida() { return cantidadVendida; }
    public void setCantidadVendida(Long cantidadVendida) { this.cantidadVendida = cantidadVendida; }
}

