package tipy.Stockify.services;

import org.springframework.stereotype.Service;
import tipy.Stockify.business.repositories.ProveedorRepository;


@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

}
