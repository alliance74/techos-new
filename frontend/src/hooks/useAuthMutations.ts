import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await api.post('/auth/login', payload);
      return response.data;
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await api.post('/auth/register', payload);
      return response.data;
    },
  });
}
