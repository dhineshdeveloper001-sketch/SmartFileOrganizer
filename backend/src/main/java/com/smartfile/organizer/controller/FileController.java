package com.smartfile.organizer.controller;

import com.smartfile.organizer.dto.FileResponse;
import com.smartfile.organizer.dto.MessageResponse;
import com.smartfile.organizer.dto.StatsResponse;
import com.smartfile.organizer.entity.FileMetadata;
import com.smartfile.organizer.entity.User;
import com.smartfile.organizer.repository.UserRepository;
import com.smartfile.organizer.security.services.UserDetailsImpl;
import com.smartfile.organizer.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileService fileService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: User is not found."));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            FileMetadata fileMetadata = fileService.storeFile(file, getCurrentUser());
            
            FileResponse response = new FileResponse(
                    fileMetadata.getId(),
                    fileMetadata.getFilename(),
                    fileMetadata.getOriginalFilename(),
                    fileMetadata.getCategory(),
                    fileMetadata.getSize(),
                    fileMetadata.getUploadDate()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/upload-multiple")
    public ResponseEntity<?> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files) {
        try {
            User user = getCurrentUser();
            for (MultipartFile file : files) {
                fileService.storeFile(file, user);
            }
            return ResponseEntity.ok(new MessageResponse("Files uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<FileResponse>> getFiles() {
        List<FileMetadata> files = fileService.getUserFiles(getCurrentUser());
        
        List<FileResponse> responseList = files.stream().map(f -> new FileResponse(
                f.getId(), f.getFilename(), f.getOriginalFilename(), f.getCategory(), f.getSize(), f.getUploadDate()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @PutMapping("/{id}/rename")
    public ResponseEntity<?> renameFile(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String newName = body.get("name");
            FileMetadata updatedFile = fileService.renameFile(id, newName, getCurrentUser());
            return ResponseEntity.ok(new FileResponse(
                    updatedFile.getId(), updatedFile.getFilename(), updatedFile.getOriginalFilename(),
                    updatedFile.getCategory(), updatedFile.getSize(), updatedFile.getUploadDate()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id) {
        try {
            fileService.deleteFile(id, getCurrentUser());
            return ResponseEntity.ok(new MessageResponse("File deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadFile(@PathVariable Long id) {
        try {
            FileMetadata fileMeta = fileService.getUserFiles(getCurrentUser()).stream()
                    .filter(f -> f.getId().equals(id))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("File not found"));

            Resource resource = fileService.loadFileAsResource(id, getCurrentUser());

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileMeta.getOriginalFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(new MessageResponse("File not found on server storage. It may have been deleted."));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        return ResponseEntity.ok(fileService.getUserStats(getCurrentUser()));
    }
}
