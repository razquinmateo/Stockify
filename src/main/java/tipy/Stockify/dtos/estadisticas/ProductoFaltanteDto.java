package tipy.Stockify.dtos.estadisticas;

public class ProductoFaltanteDto {

    private Long productoId;
    private String nombreProducto;
    private Long cantidadFaltante;  // Debe ser Long, no Integer

    public ProductoFaltanteDto() { }

    // Constructor requerido por JPQL: Long, String, Long (en ese orden)
    public ProductoFaltanteDto(Long productoId, String nombreProducto, Long cantidadFaltante) {
        this.productoId       = productoId;
        this.nombreProducto   = nombreProducto;
        this.cantidadFaltante = cantidadFaltante;
    }

    // Getters / setters
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

    public Long getCantidadFaltante() {
        return cantidadFaltante;
    }
    public void setCantidadFaltante(Long cantidadFaltante) {
        this.cantidadFaltante = cantidadFaltante;
    }
}