package com.musicplayer.service;

import com.musicplayer.config.FileStorageProperties;
import com.musicplayer.exception.FileStorageException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path storageLocation;

    public FileStorageService(FileStorageProperties properties) {
        this.storageLocation = Paths.get(properties.getDir()).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(storageLocation);
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory: " + storageLocation, e);
        }
    }

    /**
     * Stores an uploaded file on disk under a generated unique name and returns
     * that generated name (not the full path).
     */
    public String storeFile(MultipartFile file) {
        String originalFileName = file.getOriginalFilename() == null ? "audio" : file.getOriginalFilename();
        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFileName.substring(dotIndex);
        }
        String generatedFileName = UUID.randomUUID() + extension;

        try {
            if (originalFileName.contains("..")) {
                throw new FileStorageException("Filename contains invalid path sequence: " + originalFileName);
            }
            Path targetLocation = storageLocation.resolve(generatedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return generatedFileName;
        } catch (IOException e) {
            throw new FileStorageException("Could not store file " + originalFileName, e);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = storageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileStorageException("File not found on disk: " + fileName);
            }
        } catch (MalformedURLException e) {
            throw new FileStorageException("File not found on disk: " + fileName, e);
        }
    }

    public void deleteFile(String fileName) {
        try {
            Path filePath = storageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new FileStorageException("Could not delete file " + fileName, e);
        }
    }
}
