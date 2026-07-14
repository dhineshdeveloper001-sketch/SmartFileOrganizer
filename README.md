# Smart File Organizer

A full-stack web application designed to help users automatically organize uploaded files by their extension. It features a clean, responsive UI with a React frontend and a robust Spring Boot backend.

## Features

- **Authentication:** Register and Login with JWT authentication and BCrypt password encryption.
- **File Management:** 
  - Drag-and-drop file upload.
  - Automatic categorization of files (Images, Videos, Documents, PDF, Audio, Archives, Others).
  - List view with icons representing different file types.
  - Rename, delete, and download functionalities.
- **Dashboard Statistics:**
  - View total files and storage used.
  - Interactive Doughnut chart for category distribution.
  - Interactive Bar chart for storage usage by category.
- **Responsive Design:** A clean, professional UI optimized for desktop and mobile devices.

## Technology Stack

**Frontend:**
- React (Vite)
- React Router DOM
- Axios (for API requests)
- React Dropzone (for drag-and-drop uploads)
- Chart.js & React-Chartjs-2 (for statistics visualization)
- Lucide React (for UI icons)
- Vanilla CSS (for styling)

**Backend:**
- Java 17
- Spring Boot 3
- Spring Security (JWT Auth)
- Spring Data JPA
- PostgreSQL (Neon DB)

## Installation

### 1. Database Setup
Update the database connection details in `backend/src/main/resources/application.properties` with your PostgreSQL / Neon DB credentials:
```properties
spring.datasource.url=jdbc:postgresql://<HOST>/<DB_NAME>?sslmode=require
spring.datasource.username=<USERNAME>
spring.datasource.password=<PASSWORD>
```

### 2. Run Backend
Navigate to the `backend` directory and start the Spring Boot application:
```bash
cd backend
./mvnw spring-boot:run
```
The backend will run on `http://localhost:8080`.

### 3. Run Frontend
Navigate to the `frontend` directory, install dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend will typically run on `http://localhost:5173` or `http://localhost:5174`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### File Management (Requires JWT Token)
- `POST /api/files/upload-multiple` - Upload multiple files
- `GET /api/files` - Get all files for the current user
- `PUT /api/files/{id}/rename` - Rename a file
- `DELETE /api/files/{id}` - Delete a file
- `GET /api/files/{id}/download` - Download a file
- `GET /api/files/stats` - Get user statistics (total files, storage used, categorizations)

## Future Improvements
- Implement thumbnail generation for image previews.
- Add grid-view options in the File Manager.
- Allow users to create custom folders alongside automatic categorization.
- Implement a user profile settings page.
