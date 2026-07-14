package com.smartfile.organizer.dto;

import java.util.Map;

public class StatsResponse {
    private long totalFiles;
    private long totalStorageUsed;
    private Map<String, Long> filesByCategory;
    private Map<String, Long> storageByCategory;

    public StatsResponse(long totalFiles, long totalStorageUsed, Map<String, Long> filesByCategory, Map<String, Long> storageByCategory) {
        this.totalFiles = totalFiles;
        this.totalStorageUsed = totalStorageUsed;
        this.filesByCategory = filesByCategory;
        this.storageByCategory = storageByCategory;
    }

    public long getTotalFiles() { return totalFiles; }
    public void setTotalFiles(long totalFiles) { this.totalFiles = totalFiles; }

    public long getTotalStorageUsed() { return totalStorageUsed; }
    public void setTotalStorageUsed(long totalStorageUsed) { this.totalStorageUsed = totalStorageUsed; }

    public Map<String, Long> getFilesByCategory() { return filesByCategory; }
    public void setFilesByCategory(Map<String, Long> filesByCategory) { this.filesByCategory = filesByCategory; }

    public Map<String, Long> getStorageByCategory() { return storageByCategory; }
    public void setStorageByCategory(Map<String, Long> storageByCategory) { this.storageByCategory = storageByCategory; }
}
