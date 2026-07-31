import { initDatabase } from '../utils/db'

export default defineEventHandler(async (event) => {
  try {
    await initDatabase()
    return { success: true, message: 'Database initialized successfully' }
  } catch (error: any) {
    console.error('DB Init Error:', error)
    return { 
      success: false, 
      message: 'Failed to connect/initialize MariaDB', 
      error: error?.message || String(error)
    }
  }
})
