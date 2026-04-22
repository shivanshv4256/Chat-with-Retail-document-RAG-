import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

// ----------------------
// AXIOS CLIENT
// ----------------------
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// ----------------------
// TYPES
// ----------------------
export interface Document {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  status: "processing" | "ready" | "error";
}

export interface QueryResponse {
  answer: string;
  sources: {
    content: string;
    page?: number;
    documentName: string;
  }[];
}

// ----------------------
// UPLOAD DOCUMENT
// ----------------------
export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;

  } catch (error: any) {
    console.error("Upload error:", error);

    throw new Error(
      error.response?.data?.detail || "Upload failed"
    );
  }
};

// ----------------------
// GET DOCUMENTS
// ----------------------
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const response = await apiClient.get("/documents");
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// ----------------------
// DELETE DOCUMENT
// ----------------------
export const deleteDocument = async (id: string) => {
  await apiClient.delete(`/documents/${id}`);
};

// ----------------------
// ASK QUESTION
// ----------------------
export const queryKnowledgeBase = async (
  query: string
): Promise<QueryResponse> => {
  const response = await apiClient.post("/ask", { query });
  return response.data;
};