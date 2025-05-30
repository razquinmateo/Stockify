package tipy.Stockify.api.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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

    public ConteoController(ConteoService conteoService,
                            SimpMessagingTemplate messagingTemplate) {
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
    @Operation(description = "Crea un nuevo conteo.")
    public ResponseEntity<ConteoDto> createConteo(@RequestBody ConteoDto conteoDto) {
        // 1) Guardamos el conteo en la base de datos
        ConteoDto saved = conteoService.create(conteoDto);

        // 2) Preparamos el mensaje para WS
        ConteoMensajeDto mensaje = new ConteoMensajeDto(
                saved.getId(),
                saved.getFechaHora().toString()
        );

        // 3) Enviamos a todos los suscriptores de /topic/conteo-activo
        messagingTemplate.convertAndSend("/topic/conteo-activo", mensaje);

        // 4) Devolvemos el DTO creado al cliente HTTP
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
            // usa el getter que exista en tu DTO:
            if (Boolean.TRUE.equals(updated.getConteoFinalizado())) {
                messagingTemplate.convertAndSend("/topic/conteo-finalizado", msg);
            } else {
                // reactivación o creación
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
        // Sólo mandamos el id y timestamp actual si quieres
        ConteoMensajeDto msg = new ConteoMensajeDto(
                id,
                LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/conteo-finalizado", msg);

        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}