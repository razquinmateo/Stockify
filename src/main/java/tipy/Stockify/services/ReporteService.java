package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Reporte;
import tipy.Stockify.business.repositories.ReporteRepository;
import tipy.Stockify.dtos.ReporteDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReporteService {

    private final ReporteRepository reporteRepository;

    public ReporteService(ReporteRepository reporteRepository) {
        this.reporteRepository = reporteRepository;
    }

    public List<ReporteDto> getAllActive() {
        return reporteRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ReporteDto> getAllIncludingInactive() {
        return reporteRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ReporteDto getById(Long id) {
        return reporteRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public ReporteDto create(ReporteDto reporteDto) {
        Reporte reporte = mapToEntity(reporteDto);
        // aseguramos que activo sea true para nuevos reportes
        reporte.setActivo(true);
        return mapToDto(reporteRepository.save(reporte));
    }

    public ReporteDto update(Long id, ReporteDto reporteDto) {
        return reporteRepository.findById(id)
                .map(existingReporte -> {
                    updateReporteFields(existingReporte, reporteDto);
                    return mapToDto(reporteRepository.save(existingReporte));
                })
                .orElse(null);
    }

    public void deactivate(Long id) {
        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte no encontrado con id: " + id));
        reporte.setActivo(false);
        reporteRepository.save(reporte);
    }

    private void updateReporteFields(Reporte reporte, ReporteDto reporteDto) {
        if (reporteDto.getFechaGeneracion() != null) {
            reporte.setFechaGeneracion(reporteDto.getFechaGeneracion());
        }
        if (reporteDto.getTotalFaltante() != 0) {
            reporte.setTotalFaltante(reporteDto.getTotalFaltante());
        }
        if (reporteDto.getTotalSobrante() != 0) {
            reporte.setTotalSobrante(reporteDto.getTotalSobrante());
        }
        if (reporteDto.getDiferenciaMonetaria() != 0) {
            reporte.setDiferenciaMonetaria(reporteDto.getDiferenciaMonetaria());
        }
        if (reporteDto.getActivo() != null) {
            reporte.setActivo(reporteDto.getActivo());
        }
    }

    public Reporte mapToEntity(ReporteDto reporteDto) {
        Reporte reporte = new Reporte();
        reporte.setFechaGeneracion(reporteDto.getFechaGeneracion());
        reporte.setTotalFaltante(reporteDto.getTotalFaltante());
        reporte.setTotalSobrante(reporteDto.getTotalSobrante());
        reporte.setDiferenciaMonetaria(reporteDto.getDiferenciaMonetaria());
        //activo se establece explícitamente en los métodos create/update
        return reporte;
    }

    public ReporteDto mapToDto(Reporte reporte) {
        ReporteDto reporteDto = new ReporteDto();
        reporteDto.setId(reporte.getId());
        reporteDto.setFechaGeneracion(reporte.getFechaGeneracion());
        reporteDto.setTotalFaltante(reporte.getTotalFaltante());
        reporteDto.setTotalSobrante(reporte.getTotalSobrante());
        reporteDto.setDiferenciaMonetaria(reporte.getDiferenciaMonetaria());
        reporteDto.setActivo(reporte.isActivo());
        return reporteDto;
    }
}