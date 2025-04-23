package tipy.Stockify.api.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tipy.Stockify.dtos.LoginRequest;
import tipy.Stockify.dtos.LoginResponse;
import tipy.Stockify.security.SeguridadService;

@RestController
@RequestMapping(value = "/api/v1/seguridad")
public class SeguridadController {

    private final SeguridadService seguridadService;

    public SeguridadController(SeguridadService seguridadService) {
        this.seguridadService = seguridadService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        String token = seguridadService.autenticarUsuario(loginRequest);
        return ResponseEntity.ok(new LoginResponse(token));
    }
}