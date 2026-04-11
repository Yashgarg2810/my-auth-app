import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:3000'
})

export const registerUser = (data: { name: string; email: string; password: string }) =>
  API.post('/register', data)

export const loginUser = (data: { email: string; password: string }) =>
  API.post('/login', data)

export const getProfile = (token: string) =>
  API.get('/profile', {
    headers: { Authorization: `Bearer ${token}` }
  })