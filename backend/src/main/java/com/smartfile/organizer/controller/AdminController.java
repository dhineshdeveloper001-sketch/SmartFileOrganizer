package com.smartfile.organizer.controller;

import com.smartfile.organizer.dto.MessageResponse;
import com.smartfile.organizer.dto.SignupRequest;
import com.smartfile.organizer.entity.FileMetadata;
import com.smartfile.organizer.entity.User;
import com.smartfile.organizer.repository.FileMetadataRepository;
import com.smartfile.organizer.repository.UserRepository;
import com.smartfile.organizer.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileMetadataRepository fileMetadataRepository;

    @Autowired
    private FileService fileService;

    @Autowired
    private PasswordEncoder encoder;

    // --- DASHBOARD STATS ---
    @GetMapping("/stats")
    public ResponseEntity<?> getAdminStats() {
        long totalUsers = userRepository.count();
        long totalFiles = fileMetadataRepository.count();
        
        List<FileMetadata> allFiles = fileMetadataRepository.findAll();
        long totalStorageUsed = allFiles.stream().mapToLong(FileMetadata::getSize).sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalFiles", totalFiles);
        stats.put("totalStorageUsed", totalStorageUsed);

        return ResponseEntity.ok(stats);
    }

    // --- USER MANAGEMENT ---
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> userResponses = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("role", u.getRole());
            map.put("totalFiles", u.getFiles().size());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(userResponses);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String role = request.getOrDefault("role", "ROLE_USER");

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(encoder.encode(password));
        user.setRole(role);

        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("User created successfully!"));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        String newUsername = request.get("username");
        if (newUsername != null && !newUsername.equals(user.getUsername())) {
            if (userRepository.existsByUsername(newUsername)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
            }
            user.setUsername(newUsername);
        }

        String newPassword = request.get("password");
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            user.setPassword(encoder.encode(newPassword));
        }

        String newRole = request.get("role");
        if (newRole != null && !newRole.trim().isEmpty()) {
            user.setRole(newRole);
        }

        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("User updated successfully!"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        // Delete all physical files for this user first
        List<FileMetadata> userFiles = user.getFiles();
        for (FileMetadata file : userFiles) {
            try {
                fileService.deleteFile(file.getId(), user);
            } catch (Exception e) {
                // Ignore if physical file doesn't exist, we still want to delete the user
                System.err.println("Could not delete physical file: " + file.getFilename());
            }
        }

        userRepository.delete(user);
        return ResponseEntity.ok(new MessageResponse("User and all associated files deleted successfully!"));
    }

    // --- GLOBAL FILE MANAGEMENT ---
    @GetMapping("/files")
    public ResponseEntity<?> getAllFiles() {
        List<FileMetadata> files = fileMetadataRepository.findAll();
        List<Map<String, Object>> fileResponses = files.stream().map(f -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("filename", f.getFilename());
            map.put("originalFilename", f.getOriginalFilename());
            map.put("category", f.getCategory());
            map.put("size", f.getSize());
            map.put("uploadDate", f.getUploadDate());
            map.put("owner", f.getOwner() != null ? f.getOwner().getUsername() : "Unknown");
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(fileResponses);
    }

    @DeleteMapping("/files/{id}")
    public ResponseEntity<?> deleteFileGlobally(@PathVariable Long id) {
        FileMetadata file = fileMetadataRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: File not found."));
        
        fileService.deleteFile(id, file.getOwner());
        return ResponseEntity.ok(new MessageResponse("File deleted successfully globally!"));
    }
    @GetMapping("/files/{id}/download")
    public ResponseEntity<?> downloadFileGlobally(@PathVariable Long id) {
        try {
            FileMetadata file = fileMetadataRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Error: File not found."));
            
            Resource resource = fileService.loadFileAsResource(id, file.getOwner());

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getOriginalFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(new MessageResponse("File not found on server storage."));
        }
    }
}
