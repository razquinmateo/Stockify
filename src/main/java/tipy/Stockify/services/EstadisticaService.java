package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.repositories.RepositorioConteoProducto;
import tipy.Stockify.dtos.*;

import java.time.LocalDateTime;  // <-- importamos LocalDateTime
import java.util.List;

@Service
public class EstadisticaService {

    private final RepositorioConteoProducto repositorioConteoProducto;

    public EstadisticaService(RepositorioConteoProducto repositorioConteoProducto) {
        this.repositorioConteoProducto = repositorioConteoProducto;
    }

    public List<ProductoVendidosDto> obtenerProductosMasVendidos(LocalDateTime desde, LocalDateTime hasta) {
        return repositorioConteoProducto.obtenerProductosMasVendidos(desde, hasta);
    }

    public List<ProductoFaltanteDto> obtenerProductosConMayorFaltante(LocalDateTime desde, LocalDateTime hasta) {
        return repositorioConteoProducto.obtenerProductosConMayorFaltante(desde, hasta);
    }

    public List<ProductoMenosVendidosDto> obtenerProductosMenosVendidos(LocalDateTime desde, LocalDateTime hasta) {
        return repositorioConteoProducto.obtenerProductosMenosVendidos(desde, hasta);
    }

    public List<DineroFaltanteMesDto> obtenerDineroFaltantePorMes(Integer anio) {
        return repositorioConteoProducto.obtenerDineroFaltantePorMes(anio);
    }

    public List<CategoriaVendidaDto> obtenerCategoriasMasVendidas(LocalDateTime desde, LocalDateTime hasta) {
        return repositorioConteoProducto.obtenerCategoriasMasVendidas(desde, hasta);
    }

    public List<DineroSobranteMesDto> obtenerDineroSobrantePorMes(Integer anio) {
        return repositorioConteoProducto.obtenerDineroSobrantePorMes(anio);
    }
}
