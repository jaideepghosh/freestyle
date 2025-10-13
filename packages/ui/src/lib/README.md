# Database Service

This module provides a browser-based database service using localStorage for persisting API requests, folders, and responses.

## Features

- **Browser-Only**: Pure client-side implementation with no server dependencies
- **Persistent Storage**: Data is stored in localStorage and persists across sessions
- **Modular Design**: Clean separation of concerns with async database operations
- **Type Safety**: Full TypeScript support with proper interfaces
- **No Dependencies**: No external database libraries required

## Database Schema

### Folders Table

```sql
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Requests Table

```sql
CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  folder_id TEXT,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  headers TEXT,
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders (id)
);
```

### Responses Table

```sql
CREATE TABLE responses (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  name TEXT,
  status_code INTEGER,
  headers TEXT,
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests (id)
);
```

## Usage

```typescript
import { databaseService } from "./database";

// Initialize database (automatically called on first use)
await databaseService.initialize();

// Create a folder
const folder = await databaseService.createFolder("My API Collection");

// Save a request
const request = await databaseService.saveRequest({
  name: "Get Users",
  folderId: folder.id,
  method: "GET",
  url: "https://api.example.com/users",
  headers: { Authorization: "Bearer token" },
  body: null,
});

// Save a response
const response = await databaseService.saveResponse({
  requestId: request.id,
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ users: [] }),
});
```

## API Reference

### DatabaseService Methods

#### `initialize(): Promise<void>`

Initializes the database connection and creates tables if they don't exist.

#### `createFolder(name: string, parentId?: string | null): Promise<Folder>`

Creates a new folder with the given name and optional parent folder.

#### `getFolders(): Promise<Folder[]>`

Retrieves all folders ordered by creation date.

#### `saveRequest(requestData): Promise<Request>`

Saves a request with all its details (method, URL, headers, body).

#### `getRequests(folderId?: string): Promise<Request[]>`

Retrieves requests, optionally filtered by folder.

#### `saveResponse(responseData): Promise<Response>`

Saves a response associated with a request.

#### `getResponses(requestId: string): Promise<Response[]>`

Retrieves all responses for a specific request.

## Data Types

### Folder

```typescript
interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}
```

### Request

```typescript
interface Request {
  id: string;
  name: string;
  folder_id: string | null;
  method: string;
  url: string;
  headers: string; // JSON string
  body: string | null;
  created_at: string;
  updated_at: string;
}
```

### Response

```typescript
interface Response {
  id: string;
  request_id: string;
  name: string | null;
  status_code: number | null;
  headers: string | null; // JSON string
  body: string | null;
  created_at: string;
}
```

## Storage

The database is automatically saved to localStorage under the key `freestyle_db`. The data is stored as JSON that can be easily serialized and deserialized.

## Error Handling

All database operations are wrapped in try-catch blocks and will throw descriptive errors if operations fail. The service handles:

- Browser environment validation
- Data serialization issues
- localStorage quota exceeded errors
- Invalid JSON parsing errors
