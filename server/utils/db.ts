/**
 * ====================================================================
 * MariaDB 커넥션 및 데이터베이스/테이블 자동 초기화 모듈
 * ====================================================================
 * - accounts, stocks, savings, funds, real_estates, asset_history, ledger_entries
 * - users (관리자 및 사용자 인증 테이블)
 */
import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

/**
 * 데이터베이스 커넥션 풀 반환 함수
 * - 환경 변수(DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)가 존재할 경우 우선 적용
 */
export function getDbPool() {
  if (pool) return pool

  const config = useRuntimeConfig()
  
  const host = process.env.DB_HOST || config.dbHost || 'localhost'
  const port = Number(process.env.DB_PORT || config.dbPort) || 3306
  const user = process.env.DB_USER || config.dbUser || 'hoon'
  const password = process.env.DB_PASSWORD || config.dbPassword || 'qudgns&89'
  const database = process.env.DB_NAME || config.dbName || 'hoon'

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
  })

  return pool
}

/**
 * 데이터베이스 및 테이블 자동 생성/초기화 함수
 */
export async function initDatabase() {
  const config = useRuntimeConfig()
  
  const host = process.env.DB_HOST || config.dbHost || 'localhost'
  const port = Number(process.env.DB_PORT || config.dbPort) || 3306
  const user = process.env.DB_USER || config.dbUser || 'hoon'
  const password = process.env.DB_PASSWORD || config.dbPassword || 'qudgns&89'
  const dbName = process.env.DB_NAME || config.dbName || 'hoon'

  // 1. 데이터베이스 존재 여부 확인 및 생성 시도
  try {
    const rootConn = await mysql.createConnection({
      host,
      port,
      user,
      password
    })
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    await rootConn.end()
  } catch (err: any) {
    console.warn('DB 생성 시도 스킵 (기존 데이터베이스 사용):', err.message)
  }

  const dbPool = getDbPool()

  // 2-0. 사용자 테이블 (users)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) DEFAULT '관리자',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 2-1. 은행 계좌 테이블 (accounts)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bank_name VARCHAR(50) NOT NULL,
      account_name VARCHAR(100) NOT NULL,
      account_number VARCHAR(50) DEFAULT '',
      balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 2-2. 보유 주식 테이블 (stocks)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS stocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      stock_name VARCHAR(100) NOT NULL,
      stock_code VARCHAR(20) NOT NULL,
      market_type VARCHAR(10) DEFAULT 'DOMESTIC',
      quantity INT NOT NULL DEFAULT 0,
      avg_buy_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
      current_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 2-3. 예/적금 통장 테이블 (savings)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS savings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bank_name VARCHAR(50) NOT NULL,
      product_name VARCHAR(100) NOT NULL,
      savings_type VARCHAR(20) NOT NULL DEFAULT 'DEPOSIT',
      principal DECIMAL(15, 2) NOT NULL DEFAULT 0,
      period_months INT NOT NULL DEFAULT 12,
      interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
      tax_type VARCHAR(20) DEFAULT 'NORMAL',
      start_date DATE DEFAULT NULL,
      maturity_date DATE DEFAULT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 2-4. 펀드 상품 테이블 (funds)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS funds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fund_name VARCHAR(150) NOT NULL,
      fund_code VARCHAR(50) DEFAULT '',
      fund_type VARCHAR(50) DEFAULT '주식형',
      investment_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      current_valuation DECIMAL(15, 2) NOT NULL DEFAULT 0,
      base_price DECIMAL(10, 2) DEFAULT 1000,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 2-5. 부동산 자산 테이블 (real_estates)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS real_estates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      property_name VARCHAR(150) NOT NULL,
      property_type VARCHAR(50) DEFAULT '아파트',
      location VARCHAR(255) DEFAULT '',
      acquisition_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
      acquisition_date DATE DEFAULT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 2-6. 자산 스냅샷/추이 기록 테이블 (asset_history)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS asset_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      record_date DATE NOT NULL,
      total_asset DECIMAL(15, 2) NOT NULL DEFAULT 0,
      bank_balance DECIMAL(15, 2) DEFAULT 0,
      stock_valuation DECIMAL(15, 2) DEFAULT 0,
      savings_amount DECIMAL(15, 2) DEFAULT 0,
      fund_valuation DECIMAL(15, 2) DEFAULT 0,
      real_estate_amount DECIMAL(15, 2) DEFAULT 0,
      note VARCHAR(255) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_record_date (record_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 2-7. 일별 수동 가계부 항목 테이블 (ledger_entries)
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entry_date DATE NOT NULL,
      entry_type VARCHAR(10) NOT NULL DEFAULT 'EXPENSE',
      category VARCHAR(50) NOT NULL DEFAULT '기타',
      amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      memo VARCHAR(255) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

  // 3. 샘플 데이터 및 기본 계정(admin / admin) 시드
  const [userCount]: any = await dbPool.query('SELECT COUNT(*) as count FROM users')
  if (userCount[0].count === 0) {
    await dbPool.query(`
      INSERT INTO users (username, password, name) VALUES
      ('admin', 'admin', '자산 관리자')
    `)
  }

  const [accCount]: any = await dbPool.query('SELECT COUNT(*) as count FROM accounts')
  if (accCount[0].count === 0) {
    await dbPool.query(`
      INSERT INTO accounts (bank_name, account_name, account_number, balance, note) VALUES
      ('KB국민은행', '주거래 입출금 통장', '123-45-67890', 5250000, '월급 수령 및 카드 결제 계좌'),
      ('신한은행', '비상금 통장', '110-234-56789', 3100000, '예비 파킹 통장'),
      ('토스뱅크', '모임 통장', '1000-1234-5678', 850000, '여행 계좌')
    `)
  }

  const [stockCount]: any = await dbPool.query('SELECT COUNT(*) as count FROM stocks')
  if (stockCount[0].count === 0) {
    await dbPool.query(`
      INSERT INTO stocks (stock_name, stock_code, market_type, quantity, avg_buy_price, current_price, note) VALUES
      ('삼성전자', '005930', 'DOMESTIC', 100, 68000, 72500, '장기 투자 종목'),
      ('SK하이닉스', '000660', 'DOMESTIC', 20, 145000, 172000, '반도체 우량주'),
      ('Apple Inc.', 'AAPL', 'OVERSEAS', 15, 230000, 255000, '미국 빅테크 주식')
    `)
  }

  const [savingsCount]: any = await dbPool.query('SELECT COUNT(*) as count FROM savings')
  if (savingsCount[0].count === 0) {
    const today = new Date().toISOString().split('T')[0]
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    const nextYearStr = nextYear.toISOString().split('T')[0]

    await dbPool.query(`
      INSERT INTO savings (bank_name, product_name, savings_type, principal, period_months, interest_rate, tax_type, start_date, maturity_date, note) VALUES
      ('카카오뱅크', '26주 자유적금', 'SAVINGS', 500000, 12, 4.20, 'NORMAL', '${today}', '${nextYearStr}', '매월 50만원 정기 적금'),
      ('우리은행', 'WON 플러스 예금', 'DEPOSIT', 10000000, 12, 3.80, 'NORMAL', '${today}', '${nextYearStr}', '정기예금 1000만원 굴리기')
    `)
  }

  const [fundCount]: any = await dbPool.query('SELECT COUNT(*) as count FROM funds')
  if (fundCount[0].count === 0) {
    await dbPool.query(`
      INSERT INTO funds (fund_name, fund_code, fund_type, investment_amount, current_valuation, base_price, note) VALUES
      ('미래에셋 글로벌인덱스 증권자투자신탁', 'K55105B92534', '주식형', 5000000, 5420000, 1150.25, '해외 인덱스 펀드'),
      ('신한 한국주식 밸류 증권펀드', 'K55201A12345', '혼합형', 3000000, 3180000, 1080.50, '국내 가치주 펀드')
    `)
  }

  const [reCount]: any = await dbPool.query('SELECT COUNT(*) as count FROM real_estates')
  if (reCount[0].count === 0) {
    await dbPool.query(`
      INSERT INTO real_estates (property_name, property_type, location, acquisition_price, acquisition_date, note) VALUES
      ('마포 아파트 84㎡', '아파트', '서울특별시 마포구 공덕동', 850000000, '2023-05-15', '실거주 자가 아파트'),
      ('강남 오피스텔', '오피스텔', '서울특별시 강남구 역삼동', 230000000, '2022-11-10', '월세 임대용 자산')
    `)
  }

  const [histCount]: any = await dbPool.query('SELECT COUNT(*) as count FROM asset_history')
  if (histCount[0].count === 0) {
    await dbPool.query(`
      INSERT INTO asset_history (record_date, total_asset, bank_balance, stock_valuation, savings_amount, fund_valuation, real_estate_amount, note) VALUES
      ('2026-01-31', 1050000000, 8000000, 12000000, 15000000, 8000000, 1007000000, '1월 자산 기록'),
      ('2026-02-28', 1065000000, 8200000, 12800000, 15200000, 8100000, 1020700000, '2월 자산 기록'),
      ('2026-03-31', 1082000000, 8500000, 13400000, 15500000, 8300000, 1036300000, '3월 자산 기록'),
      ('2026-04-30', 1098000000, 8800000, 14000000, 15800000, 8400000, 1051000000, '4월 자산 기록'),
      ('2026-05-31', 1115000000, 9000000, 14200000, 16000000, 8500000, 1067300000, '5월 자산 기록'),
      ('2026-06-30', 1124000000, 9100000, 14400000, 16200000, 8550000, 1075750000, '6월 자산 기록'),
      ('2026-07-31', 1131479918, 9200000, 14515000, 16436959, 8600000, 1080000000, '7월 현재 자산')
    `)
  }

  const [ledgerCount]: any = await dbPool.query('SELECT COUNT(*) as count FROM ledger_entries')
  if (ledgerCount[0].count === 0) {
    await dbPool.query(`
      INSERT INTO ledger_entries (entry_date, entry_type, category, amount, memo) VALUES
      ('2026-07-01', 'INCOME', '월급', 4200000, '7월 정기 급여'),
      ('2026-07-03', 'EXPENSE', '식비', 45000, '주말 장보기'),
      ('2026-07-05', 'EXPENSE', '교통비', 65000, '대중교통 카드 충전'),
      ('2026-07-10', 'EXPENSE', '주거/통신', 230000, '관리비 및 인터넷 요금'),
      ('2026-07-15', 'INCOME', '부수입', 350000, '배당금 입금'),
      ('2026-07-20', 'EXPENSE', '쇼핑', 120000, '의류 구입'),
      ('2026-07-25', 'EXPENSE', '외식/유흥', 85000, '모임 식사비')
    `)
  }

  return true
}
