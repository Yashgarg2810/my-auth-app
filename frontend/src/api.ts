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

  export const getTopics = (token: string) =>
  API.get('/topics', {
    headers: { Authorization: `Bearer ${token}` }
  })

export const getPatterns = (token: string, topicId: number) =>
  API.get(`/topics/${topicId}/patterns`, {
    headers: { Authorization: `Bearer ${token}` }
  })

export const solveProblem = (token: string, problemId: number) =>
  API.post(`/problems/${problemId}/solve`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  })

export const getDashboard = (token: string) =>
  API.get('/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  })