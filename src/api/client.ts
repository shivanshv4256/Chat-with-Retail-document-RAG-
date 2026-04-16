import axios from 'axios';

const API_BASE_URL = "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Document {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  status: 'processing' | 'ready' | 'error';
}

export interface QueryResponse {
  answer: string;
  sources: {
    content: string;
    page?: number;
    documentName: string;
  }[];
}

export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API_BASE_URL}/upload`,
    formData
  );

  return response.data;
};

export const getDocuments = async (): Promise<Document[]> => {
  try {
    const response = await apiClient.get('/documents');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const deleteDocument = async (id: string) => {
  await apiClient.delete(`/documents/${id}`);
};

export const queryKnowledgeBase = async (query: string): Promise<QueryResponse> => {
  const response = await apiClient.post('/ask', { query });
  return response.data;
};
