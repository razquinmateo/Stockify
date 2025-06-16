package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tipy.Stockify.dtos.ConteoDto;
import tipy.Stockify.dtos.ConteoMensajeDto;
import tipy.Stockify.services.ConteoService;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(value = "api/v1/conteos")
public class ConteoController {

    private final ConteoService conteoService;
    private final SimpMessagingTemplate messagingTemplate;

    public ConteoController(ConteoService conteoService, SimpMessagingTemplate messagingTemplate) {
        this.conteoService = conteoService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping
    @Operation(description = "Obtiene la lista de conteos activos.")
    public ResponseEntity<List<ConteoDto>> getActiveConteos() {
        return new ResponseEntity<>(conteoService.getAllActive(), HttpStatus.OK);
    }

    @GetMapping("/all")
    @Operation(description = "Obtiene la lista de todos los conteos, incluidos los inactivos.")
    public ResponseEntity<List<ConteoDto>> getAllConteosIncludingInactive() {
        return new ResponseEntity<>(conteoService.getAllIncludingInactive(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtiene un conteo activo por su ID.")
    public ResponseEntity<ConteoDto> getConteoById(@PathVariable Long id) {
        ConteoDto conteo = conteoService.getById(id);
        return conteo != null
                ? new ResponseEntity<>(conteo, HttpStatus.OK)
                : new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    @PostMapping
    @Operation(description = "Crea un nuevo conteo de tipo LIBRE.")
    public ResponseEntity<ConteoDto> createConteo(@RequestBody ConteoDto conteoDto) {
        if (conteoDto.getTipoConteo() == null || !conteoDto.getTipoConteo().equals("LIBRE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este endpoint solo acepta conteos de tipo LIBRE");
        }
        ConteoDto saved = conteoService.create(conteoDto);
        ConteoMensajeDto mensaje = new ConteoMensajeDto(
                saved.getId(),
                saved.getFechaHora().toString()
        );
        messagingTemplate.convertAndSend("/topic/conteo-activo", mensaje);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PostMapping("/categorias")
    @Operation(description = "Crea un nuevo conteo de tipo CATEGORIAS.")
    public ResponseEntity<ConteoDto> createConteoCategorias(@RequestBody ConteoDto conteoDto) {
        if (conteoDto.getTipoConteo() == null || !conteoDto.getTipoConteo().equals("CATEGORIAS")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este endpoint solo acepta conteos de tipo CATEGORIAS");
        }
        ConteoDto saved = conteoService.create(conteoDto);
        ConteoMensajeDto mensaje = new ConteoMensajeDto(
                saved.getId(),
                saved.getFechaHora().toString()
        );
        messagingTemplate.convertAndSend("/topic/conteo-activo", mensaje);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConteoDto> updateConteo(
            @PathVariable Long id,
            @RequestBody ConteoDto dto
    ) {
        ConteoDto updated = conteoService.update(id, dto);
        if (updated != null) {
            ConteoMensajeDto msg = new ConteoMensajeDto(
                    updated.getId(),
                    updated.getFechaHora().toString()
            );
            if (Boolean.TRUE.equals(updated.getConteoFinalizado())) {
                messagingTemplate.convertAndSend("/topic/conteo-finalizado", msg);
            } else {
                messagingTemplate.convertAndSend("/topic/conteo-activo", msg);
            }
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Desactiva un conteo por su ID.")
    public ResponseEntity<Void> deactivateConteo(@PathVariable Long id) {
        conteoService.deactivate(id);
        ConteoMensajeDto msg = new ConteoMensajeDto(
                id,
                LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/conteo-finalizado", msg);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}