import API from '../services/api';

export const login = (email: string, password: string) =>
  API.post('/auth/login', { email, password }).then(r => r.data);

export const register = (payload: any) =>
  API.post('/auth/register', payload).then(r => r.data);