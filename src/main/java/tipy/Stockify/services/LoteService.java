package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tipy.Stockify.business.entities.Lote;
import tipy.Stockify.business.repositories.LoteRepository;
import tipy.Stockify.dtos.LoteDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoteService {

    private final LoteRepository loteRepository;

    public LoteService(LoteRepository loteRepository) {
        this.loteRepository = loteRepository;
    }

    public List<LoteDto> getAllActive() {
        return loteRepository.findByActivoTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<LoteDto> getAllIncludingInactive() {
        return loteRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public LoteDto getById(Long id) {
        return loteRepository.findByIdAndActivoTrue(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    public LoteDto create(LoteDto loteDto) {
        Lote lote = mapToEntity(loteDto);
        // Asegurar que activo sea true para nuevos lotes, incluso si no se especifica
        lote.setActivo(true);
        return mapToDto(loteRepository.save(lote));
    }

    public LoteDto update(Long id, LoteDto loteDto) {
        return loteRepository.findById(id)
                .map(existingLote -> {
                    updateLoteFields(existingLote, loteDto);
                    return mapToDto(loteRepository.save(existingLote));
                })
                .orElse(null);
    }

    public void deactivate(Long id) {
        Lote lote = loteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lote no encontrado con id: " + id));
        lote.setActivo(false);
        loteRepository.save(lote);
    }

    private void updateLoteFields(Lote lote, LoteDto loteDto) {
        if (loteDto.getNumeroLote() != null) {
            lote.setNumeroLote(loteDto.getNumeroLote());
        }
        if (loteDto.getFechaIngreso() != null) {
            lote.setFechaIngreso(loteDto.getFechaIngreso());
        }
        if (loteDto.getFechaVencimiento() != null) {
            lote.setFechaVencimiento(loteDto.getFechaVencimiento());
        }
        if (loteDto.getActivo() != null) {
            lote.setActivo(loteDto.getActivo());
        }
    }

    public Lote mapToEntity(LoteDto loteDto) {
        Lote lote = new Lote();
        lote.setNumeroLote(loteDto.getNumeroLote());
        lote.setFechaIngreso(loteDto.getFechaIngreso());
        lote.setFechaVencimiento(loteDto.getFechaVencimiento());
        //activo se establece explícitamente en los métodos create/update
        return lote;
    }

    public LoteDto mapToDto(Lote lote) {
        LoteDto loteDto = new LoteDto();
        loteDto.setId(lote.getId());
        loteDto.setNumeroLote(lote.getNumeroLote());
        loteDto.setFechaIngreso(lote.getFechaIngreso());
        loteDto.setFechaVencimiento(lote.getFechaVencimiento());
        loteDto.setActivo(lote.isActivo());
        return loteDto;
    }
}