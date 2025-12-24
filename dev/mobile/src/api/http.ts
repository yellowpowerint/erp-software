import axios from 'axios';

import { API_BASE_URL } from '../config';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export function setAuthToken(token: string | null) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}
