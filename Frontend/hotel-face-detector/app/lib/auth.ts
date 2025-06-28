import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
  return response.data;
};

export const signup = async (data: FormData) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const logout = async () => {
  // In a real app, this would invalidate the token on the server
  return Promise.resolve();
};