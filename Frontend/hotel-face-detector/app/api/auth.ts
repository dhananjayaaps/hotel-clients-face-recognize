import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { 
        email, 
        password 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    photos: File[];
  }): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('full_name', userData.fullName);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('phone', userData.phone);
      
      userData.photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    return Promise.resolve();
  }
};