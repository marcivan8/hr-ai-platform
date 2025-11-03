import API from '../services/Api';

export const login = (email: string, password: string) =>
  API.post('/auth/login', { email, password }).then((r: any) => r.data);

export const register = (payload: any) =>
  API.post('/auth/register', payload).then((r: any) => r.data);