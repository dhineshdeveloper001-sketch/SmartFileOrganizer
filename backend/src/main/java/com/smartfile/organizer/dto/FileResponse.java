package com.smartfile.organizer.dto;

import java.time.LocalDateTime;

public class FileResponse {
    private Long id;
    private String filename;
    private String originalFilename;
    private String category;
    private Long size;
    private LocalDateTime uploadDate;

    public FileResponse(Long id, String filename, String originalFilename, String category, Long size, LocalDateTime uploadDate) {
        this.id = id;
        this.filename = filename;
        this.originalFilename = originalFilename;
        this.category = category;
        this.size = size;
        this.uploadDate = uploadDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }

    public LocalDateTime getUploadDate() { return uploadDate; }
    public void setUploadDate(LocalDateTime uploadDate) { this.uploadDate = uploadDate; }
}
