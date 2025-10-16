export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface Request {
  id: string;
  name: string;
  folder_id: string | null;
  method: string;
  url: string;
  headers: string;
  query_params: string;
  body: string | null;
  created_at: string;
  updated_at: string;
}

export interface Response {
  id: string;
  request_id: string;
  name: string | null;
  status_code: number | null;
  headers: string | null;
  body: string | null;
  created_at: string;
}

class DatabaseService {
  private isInitialized = false;
  private storageKey = "freestyle_db";

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check if we're in browser environment
    if (typeof window === "undefined") {
      throw new Error(
        "Database service can only be used in browser environment"
      );
    }

    this.isInitialized = true;
  }

  private getStorageData(): {
    folders: Folder[];
    requests: Request[];
    responses: Response[];
  } {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return { folders: [], requests: [], responses: [] };
      }
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to parse storage data:", error);
      return { folders: [], requests: [], responses: [] };
    }
  }

  private saveStorageData(data: {
    folders: Folder[];
    requests: Request[];
    responses: Response[];
  }): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save storage data:", error);
      throw new Error("Failed to save data to localStorage");
    }
  }

  async createFolder(
    name: string,
    parentId: string | null = null
  ): Promise<Folder> {
    await this.initialize();

    const id = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newFolder: Folder = {
      id,
      name,
      parent_id: parentId,
      created_at: now,
    };

    const data = this.getStorageData();
    data.folders.push(newFolder);
    this.saveStorageData(data);

    return newFolder;
  }

  async getFolders(): Promise<Folder[]> {
    await this.initialize();
    const data = this.getStorageData();
    return data.folders.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  async saveRequest(requestData: {
    name: string;
    folderId: string | null;
    method: string;
    url: string;
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body: string | null;
  }): Promise<Request> {
    await this.initialize();

    const id = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newRequest: Request = {
      id,
      name: requestData.name,
      folder_id: requestData.folderId,
      method: requestData.method,
      url: requestData.url,
      headers: JSON.stringify(requestData.headers),
      query_params: JSON.stringify(requestData.queryParams),
      body: requestData.body,
      created_at: now,
      updated_at: now,
    };

    const data = this.getStorageData();
    data.requests.push(newRequest);
    this.saveStorageData(data);

    return newRequest;
  }

  async getRequests(folderId?: string): Promise<Request[]> {
    await this.initialize();
    const data = this.getStorageData();
    let requests = data.requests;

    if (folderId) {
      requests = requests.filter((req) => req.folder_id === folderId);
    }

    return requests.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  async updateRequest(
    requestId: string,
    updates: {
      name?: string;
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
      body?: string | null;
    }
  ): Promise<Request> {
    await this.initialize();

    const data = this.getStorageData();
    const requestIndex = data.requests.findIndex((req) => req.id === requestId);

    if (requestIndex === -1) {
      throw new Error(`Request with id ${requestId} not found`);
    }

    const existingRequest = data.requests[requestIndex];
    const now = new Date().toISOString();

    const updatedRequest: Request = {
      ...existingRequest,
      ...(updates.name && { name: updates.name }),
      ...(updates.method && { method: updates.method }),
      ...(updates.url && { url: updates.url }),
      ...(updates.headers && { headers: JSON.stringify(updates.headers) }),
      ...(updates.queryParams && {
        query_params: JSON.stringify(updates.queryParams),
      }),
      ...(updates.body !== undefined && { body: updates.body }),
      updated_at: now,
    } as Request;

    data.requests[requestIndex] = updatedRequest;
    this.saveStorageData(data);

    return updatedRequest;
  }

  async saveResponse(responseData: {
    requestId: string;
    name?: string;
    statusCode?: number;
    headers?: Record<string, string>;
    body?: string;
  }): Promise<Response> {
    await this.initialize();

    const id = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newResponse: Response = {
      id,
      request_id: responseData.requestId,
      name: responseData.name || null,
      status_code: responseData.statusCode || null,
      headers: responseData.headers
        ? JSON.stringify(responseData.headers)
        : null,
      body: responseData.body || null,
      created_at: now,
    };

    const data = this.getStorageData();
    data.responses.push(newResponse);
    this.saveStorageData(data);

    return newResponse;
  }

  async getResponses(requestId: string): Promise<Response[]> {
    await this.initialize();
    const data = this.getStorageData();
    return data.responses
      .filter((resp) => resp.request_id === requestId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
