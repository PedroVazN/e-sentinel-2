import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from './apiBase';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.message ||
      'Erro na comunicação com o servidor';
    toast.error(msg);
    return Promise.reject(err);
  }
);
