package tipy.Stockify.dtos;

public class ProductoMenosVendidosDto {

    private Long productoId;
    private String nombreProducto;
    private Long cantidadVendida;

    public ProductoMenosVendidosDto() { }

    public ProductoMenosVendidosDto(Long productoId, String nombreProducto, Long cantidadVendida) {
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.cantidadVendida = cantidadVendida;
    }

    // Getters y setters
    public Long getProductoId() {
        return productoId;
    }
    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }
    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public Long getCantidadVendida() {
        return cantidadVendida;
    }
    public void setCantidadVendida(Long cantidadVendida) {
        this.cantidadVendida = cantidadVendida;
    }
}
