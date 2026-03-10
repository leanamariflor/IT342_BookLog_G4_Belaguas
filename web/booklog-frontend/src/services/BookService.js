import api from "../api/axios";

export const searchBooks = async (query, page = 0) => {
  try {
    const response = await api.get(`/books/search`, {
      params: { query, page }
    });
    return response.data;
  } catch (error) {
    console.error("Error searching books:", error);
    throw error;
  }
};

export const getUserBooks = async (status = null) => {
  try {
    const params = status ? { status } : {};
    const response = await api.get("/books", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching user books:", error);
    throw error;
  }
};

export const getBookById = async (bookId) => {
  const response = await api.get(`/books/${bookId}`);
  return response.data;
};

export const createBook = async (payload) => {
  const response = await api.post("/books", payload);
  return response.data;
};

export const updateBook = async (bookId, payload) => {
  const response = await api.put(`/books/${bookId}`, payload);
  return response.data;
};

export const deleteBook = async (bookId) => {
  const response = await api.delete(`/books/${bookId}`);
  return response.data;
};

export const uploadBookAttachment = async (bookId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/books/${bookId}/attachment`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
};
