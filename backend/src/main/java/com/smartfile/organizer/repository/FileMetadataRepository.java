package com.smartfile.organizer.repository;

import com.smartfile.organizer.entity.FileMetadata;
import com.smartfile.organizer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {
    List<FileMetadata> findByOwnerOrderByUploadDateDesc(User owner);
    Optional<FileMetadata> findByIdAndOwner(Long id, User owner);
    boolean existsByOriginalFilenameAndOwner(String originalFilename, User owner);
}
