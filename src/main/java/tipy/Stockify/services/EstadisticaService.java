package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.entities.ConteoProducto;
import tipy.Stockify.business.repositories.RepositorioConteoProducto;
import tipy.Stockify.dtos.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EstadisticaService {

    private final RepositorioConteoProducto repositorioConteoProducto;

    public EstadisticaService(RepositorioConteoProducto repositorioConteoProducto) {
        this.repositorioConteoProducto = repositorioConteoProducto;
    }

    public List<ProductoFaltanteDto> obtenerProductosConMayorFaltante(LocalDateTime desde, LocalDateTime hasta, Long sucursalId) {
        List<ConteoProducto> conteos = repositorioConteoProducto.findByConteoFinalizadoAndFechaHoraBetweenAndSucursal(desde, hasta, sucursalId);
        Map<Long, ProductoFaltanteDto> faltantes = new HashMap<>();

        for (ConteoProducto cp : conteos) {
            long diferencia = cp.getCantidadEsperada() - cp.getCantidadContada();
            if (diferencia > 0) {
                Long productoId = cp.getProducto().getId();
                String nombre = cp.getProducto().getNombre();
                faltantes.compute(productoId, (id, dto) -> {
                    if (dto == null) {
                        return new ProductoFaltanteDto(productoId, nombre, diferencia);
                    } else {
                        dto.setCantidadFaltante(dto.getCantidadFaltante() + diferencia);
                        return dto;
                    }
                });
            }
        }

        return faltantes.values().stream()
                .sorted((a, b) -> Long.compare(b.getCantidadFaltante(), a.getCantidadFaltante()))
                .collect(Collectors.toList());
    }

    public List<ProductoSobranteDto> obtenerProductosConMayorSobrante(LocalDateTime desde, LocalDateTime hasta, Long sucursalId) {
        List<ConteoProducto> conteos = repositorioConteoProducto.findByConteoFinalizadoAndFechaHoraBetweenAndSucursal(desde, hasta, sucursalId);
        Map<Long, ProductoSobranteDto> sobrantes = new HashMap<>();

        for (ConteoProducto cp : conteos) {
            long diferencia = cp.getCantidadContada() - cp.getCantidadEsperada();
            if (diferencia > 0) {
                Long productoId = cp.getProducto().getId();
                String nombre = cp.getProducto().getNombre();
                sobrantes.compute(productoId, (id, dto) -> {
                    if (dto == null) {
                        return new ProductoSobranteDto(productoId, nombre, diferencia);
                    } else {
                        dto.setCantidadSobrante(dto.getCantidadSobrante() + diferencia);
                        return dto;
                    }
                });
            }
        }

        return sobrantes.values().stream()
                .sorted((a, b) -> Long.compare(b.getCantidadSobrante(), a.getCantidadSobrante()))
                .collect(Collectors.toList());
    }

    public List<DineroFaltanteMesDto> obtenerDineroFaltantePorMes(Integer anio, Long sucursalId) {
        List<ConteoProducto> conteos = repositorioConteoProducto.findByConteoFinalizadoAndYearAndSucursal(anio, sucursalId);
        Map<Integer, Double> dineroPorMes = new HashMap<>();

        for (ConteoProducto cp : conteos) {
            long diferencia = cp.getCantidadEsperada() - cp.getCantidadContada();
            if (diferencia > 0) {
                int mes = cp.getConteo().getFechaHora().getMonthValue();
                double monto = diferencia * cp.getPrecioActual();
                dineroPorMes.merge(mes, monto, Double::sum);
            }
        }

        return dineroPorMes.entrySet().stream()
                .map(e -> new DineroFaltanteMesDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingInt(DineroFaltanteMesDto::getMes))
                .collect(Collectors.toList());
    }

    public List<DineroSobranteMesDto> obtenerDineroSobrantePorMes(Integer anio, Long sucursalId) {
        List<ConteoProducto> conteos = repositorioConteoProducto.findByConteoFinalizadoAndYearAndSucursal(anio, sucursalId);
        Map<Integer, Double> dineroPorMes = new HashMap<>();

        for (ConteoProducto cp : conteos) {
            long diferencia = cp.getCantidadContada() - cp.getCantidadEsperada();
            if (diferencia > 0) {
                int mes = cp.getConteo().getFechaHora().getMonthValue();
                double monto = diferencia * cp.getPrecioActual();
                dineroPorMes.merge(mes, monto, Double::sum);
            }
        }

        return dineroPorMes.entrySet().stream()
                .map(e -> new DineroSobranteMesDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingInt(DineroSobranteMesDto::getMes))
                .collect(Collectors.toList());
    }

    public List<CategoriaFaltanteDto> obtenerCategoriasConMayorFaltante(LocalDateTime desde, LocalDateTime hasta, Long sucursalId) {
        List<ConteoProducto> conteos = repositorioConteoProducto.findByConteoFinalizadoAndFechaHoraBetweenAndSucursal(desde, hasta, sucursalId);
        Map<Long, CategoriaFaltanteDto> faltantes = new HashMap<>();

        for (ConteoProducto cp : conteos) {
            long diferencia = cp.getCantidadEsperada() - cp.getCantidadContada();
            if (diferencia > 0) {
                Long categoriaId = cp.getProducto().getCategoria().getId();
                String nombreCategoria = cp.getProducto().getCategoria().getNombre();
                faltantes.compute(categoriaId, (id, dto) -> {
                    if (dto == null) {
                        return new CategoriaFaltanteDto(categoriaId, nombreCategoria, diferencia);
                    } else {
                        dto.setCantidadFaltante(dto.getCantidadFaltante() + diferencia);
                        return dto;
                    }
                });
            }
        }

        return faltantes.values().stream()
                .sorted((a, b) -> Long.compare(b.getCantidadFaltante(), a.getCantidadFaltante()))
                .collect(Collectors.toList());
    }

    public List<CategoriaSobranteDto> obtenerCategoriasConMayorSobrante(LocalDateTime desde, LocalDateTime hasta, Long sucursalId) {
        List<ConteoProducto> conteos = repositorioConteoProducto.findByConteoFinalizadoAndFechaHoraBetweenAndSucursal(desde, hasta, sucursalId);
        Map<Long, CategoriaSobranteDto> sobrantes = new HashMap<>();

        for (ConteoProducto cp : conteos) {
            long diferencia = cp.getCantidadContada() - cp.getCantidadEsperada();
            if (diferencia > 0) {
                Long categoriaId = cp.getProducto().getCategoria().getId();
                String nombreCategoria = cp.getProducto().getCategoria().getNombre();
                sobrantes.compute(categoriaId, (id, dto) -> {
                    if (dto == null) {
                        return new CategoriaSobranteDto(categoriaId, nombreCategoria, diferencia);
                    } else {
                        dto.setCantidadSobrante(dto.getCantidadSobrante() + diferencia);
                        return dto;
                    }
                });
            }
        }

        return sobrantes.values().stream()
                .sorted((a, b) -> Long.compare(b.getCantidadSobrante(), a.getCantidadSobrante()))
                .collect(Collectors.toList());
    }
}