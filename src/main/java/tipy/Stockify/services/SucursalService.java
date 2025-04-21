package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.repositories.SucursalRepository;

@Service
public class SucursalService {

    private final SucursalRepository sucursalRepository;

    public SucursalService(SucursalRepository sucursalRepository) {
        this.sucursalRepository = sucursalRepository;
    }

}
