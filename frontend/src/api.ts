import axios from 'axios'

const API = axios.create({
  baseURL: 'https://my-auth-app-production-e784.up.railway.app'
})

export const registerUser = (data: { name: string; email: string; password: string }) =>
  API.post('/register', data)

export const loginUser = (data: { email: string; password: string }) =>
  API.post('/login', data)

export const getProfile = (token: string) =>
  API.get('/profile', {
    headers: { Authorization: `Bearer ${token}` }
  })