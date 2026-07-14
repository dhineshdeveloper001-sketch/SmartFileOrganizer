package com.smartfile.organizer.service;

import com.smartfile.organizer.dto.StatsResponse;
import com.smartfile.organizer.entity.FileMetadata;
import com.smartfile.organizer.entity.User;
import com.smartfile.organizer.repository.FileMetadataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class FileService {

    private final Path fileStorageLocation;
    private final FileMetadataRepository fileMetadataRepository;

    @Autowired
    public FileService(@Value("${file.upload-dir}") String uploadDir, FileMetadataRepository fileMetadataRepository) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.fileMetadataRepository = fileMetadataRepository;

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public FileMetadata storeFile(MultipartFile file, User owner) {
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        
        try {
            if (originalFilename.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + originalFilename);
            }

            // Check Storage Quota (500MB)
            long currentStorage = getUserStats(owner).getTotalStorageUsed();
            long maxStorage = 500L * 1024 * 1024; // 500 MB
            if (currentStorage + file.getSize() > maxStorage) {
                throw new RuntimeException("Storage quota exceeded. Maximum allowed is 500 MB.");
            }

            // Create a unique filename to prevent overwriting
            String extension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);
            
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            FileMetadata fileMetadata = new FileMetadata();
            fileMetadata.setFilename(uniqueFilename);
            fileMetadata.setOriginalFilename(originalFilename);
            fileMetadata.setCategory(categorizeFile(originalFilename));
            fileMetadata.setSize(file.getSize());
            fileMetadata.setUploadDate(LocalDateTime.now());
            fileMetadata.setOwner(owner);

            return fileMetadataRepository.save(fileMetadata);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFilename + ". Please try again!", ex);
        }
    }

    public List<FileMetadata> getUserFiles(User owner) {
        return fileMetadataRepository.findByOwnerOrderByUploadDateDesc(owner);
    }

    public FileMetadata renameFile(Long id, String newName, User owner) {
        FileMetadata file = fileMetadataRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new RuntimeException("File not found"));
        
        // Ensure new name has correct extension
        String oldExtension = getFileExtension(file.getOriginalFilename());
        String newExtension = getFileExtension(newName);
        
        if (newExtension.isEmpty() && !oldExtension.isEmpty()) {
            newName = newName + "." + oldExtension;
        }

        file.setOriginalFilename(newName);
        return fileMetadataRepository.save(file);
    }

    public void deleteFile(Long id, User owner) {
        FileMetadata file = fileMetadataRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new RuntimeException("File not found"));

        try {
            Path filePath = this.fileStorageLocation.resolve(file.getFilename()).normalize();
            Files.deleteIfExists(filePath);
            fileMetadataRepository.delete(file);
        } catch (IOException ex) {
            throw new RuntimeException("Could not delete file " + file.getOriginalFilename(), ex);
        }
    }

    public Resource loadFileAsResource(Long id, User owner) {
        try {
            FileMetadata fileMeta = fileMetadataRepository.findByIdAndOwner(id, owner)
                    .orElseThrow(() -> new RuntimeException("File not found"));

            Path filePath = this.fileStorageLocation.resolve(fileMeta.getFilename()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("File not found on disk");
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found", ex);
        }
    }

    public StatsResponse getUserStats(User owner) {
        List<FileMetadata> files = getUserFiles(owner);
        long totalFiles = files.size();
        long totalStorage = files.stream().mapToLong(FileMetadata::getSize).sum();

        Map<String, Long> filesByCategory = new HashMap<>();
        Map<String, Long> storageByCategory = new HashMap<>();

        for (FileMetadata f : files) {
            filesByCategory.put(f.getCategory(), filesByCategory.getOrDefault(f.getCategory(), 0L) + 1);
            storageByCategory.put(f.getCategory(), storageByCategory.getOrDefault(f.getCategory(), 0L) + f.getSize());
        }

        return new StatsResponse(totalFiles, totalStorage, filesByCategory, storageByCategory);
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    private String categorizeFile(String filename) {
        String ext = getFileExtension(filename);
        switch (ext) {
            case "jpg": case "jpeg": case "png": case "gif": case "bmp": case "webp": case "svg": case "ico":
                return "Images";
            case "mp4": case "avi": case "mkv": case "mov": case "wmv": case "webm": case "flv":
                return "Videos";
            case "doc": case "docx": case "txt": case "xls": case "xlsx": case "ppt": case "pptx": case "csv": case "rtf":
                return "Documents";
            case "pdf":
                return "PDF";
            case "mp3": case "wav": case "aac": case "ogg": case "flac": case "m4a":
                return "Audio";
            case "zip": case "rar": case "7z": case "tar": case "gz": case "bz2":
                return "Archives";
            case "html": case "css": case "js": case "jsx": case "ts": case "tsx": case "json": case "xml": case "java": case "py": case "cpp": case "c":
                return "Code";
            default:
                return "Others";
        }
    }
}
