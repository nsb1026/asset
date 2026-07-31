import { getDbPool } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const id = getRouterParam(event, 'id')
  const pool = getDbPool()

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID가 필요합니다.' })
  }

  // PUT: 계좌 정보 수정
  if (method === 'PUT') {
    const body = await readBody(event)
    const { bank_name, account_name, account_number, balance, note } = body

    await pool.query(
      'UPDATE accounts SET bank_name = ?, account_name = ?, account_number = ?, balance = ?, note = ? WHERE id = ?',
      [bank_name, account_name, account_number || '', Number(balance) || 0, note || '', id]
    )

    return { success: true }
  }

  // DELETE: 계좌 삭제
  if (method === 'DELETE') {
    await pool.query('DELETE FROM accounts WHERE id = ?', [id])
    return { success: true }
  }
})
