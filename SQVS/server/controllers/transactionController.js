const mysql = require('mysql2/promise')
const path = require('path')
const fs = require('fs').promises
require('dotenv').config()

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
}

const runSQLFile = async (filePath) => {
  const sql = await fs.readFile(filePath, 'utf8')
  const connection = await mysql.createConnection(dbConfig)
  
  try {
    // Split the file into individual statements while handling custom DELIMITERs
    const statements = []
    let currentDelimiter = ';'
    let buffer = []
    
    const lines = sql.split(/\r?\n/)
    
    for (let line of lines) {
      const trimmedLine = line.trim()
      
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith('--')) continue
      
      // Handle DELIMITER command
      if (trimmedLine.toUpperCase().startsWith('DELIMITER')) {
        const parts = trimmedLine.split(/\s+/)
        if (parts.length > 1) {
          currentDelimiter = parts[1]
        }
        continue
      }
      
      buffer.push(line)
      
      // Check if statement is complete
      if (trimmedLine.endsWith(currentDelimiter)) {
        let statement = buffer.join('\n')
        // Remove the delimiter from the end of the statement
        statement = statement.substring(0, statement.lastIndexOf(currentDelimiter))
        if (statement.trim()) {
          statements.push(statement)
        }
        buffer = []
      }
    }
    
    // Add any remaining buffer as a statement
    if (buffer.length > 0) {
      const statement = buffer.join('\n').trim()
      if (statement) statements.push(statement)
    }

    // Execute each statement sequentially
    for (const statement of statements) {
      await connection.query(statement)
    }
    
  } finally {
    await connection.end()
  }
}

exports.resetDatabase = async (req, res) => {
  try {
    const schemaPath = path.join(__dirname, '../config/database_schema.sql')
    const seedPath = path.join(__dirname, '../config/data_seeded.sql')
    const triggersPath = path.join(__dirname, '../config/triggers.sql')
    
    await runSQLFile(schemaPath)
    await runSQLFile(seedPath)
    await runSQLFile(triggersPath)
    
    res.json({ success: true, message: 'Database reset successfully' })
  } catch (error) {
    console.error('Reset Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.runScenario1 = async (req, res) => {
  const logs = []
  const conn = await mysql.createConnection(dbConfig)
  try {
    logs.push('--- Scenario 1: COMMIT (Successful Transaction) ---')
    
    await conn.beginTransaction()
    logs.push('Transaction started.')

    const [reqResult] = await conn.execute(
      'INSERT INTO VERIFICATION_REQUEST (NED_ID, Verifier_ID, Fee_ID, Purpose, Expiry_Date, Status) VALUES (?, ?, ?, ?, ?, ?)',
      ['NED-O2YTK-92JME', 3, 1, 'Employment check for Wipro Kolkata UI Demo', '2027-06-30', 'Pending']
    )
    const newId = reqResult.insertId
    logs.push(`Inserted Request ID: ${newId}`)

    await conn.execute(
      'INSERT INTO PAYMENT_TRANSACTION (Request_ID, Amount, Payment_Method, Payment_Status, Payment_Gateway_Ref, Receipt_Number) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, 450.00, 'UPI', 'Completed', `TXN-UI-${Date.now()}`, `REC-UI-${Date.now()}`]
    )
    logs.push('Inserted Payment record.')

    await conn.commit()
    logs.push('Transaction committed successfully.')

    res.json({ success: true, logs })
  } catch (error) {
    await conn.rollback()
    
    // Check if the error came from our custom trigger
    if (error.message.includes('ACTIVE_REQUEST_EXISTS')) {
      logs.push(`Caught Database-Level Validation: ${error.message}`)
      return res.json({ success: false, logs, expected: true })
    }

    res.status(500).json({ success: false, logs: [...logs, `Error: ${error.message}`] })
  } finally {
    await conn.end()
  }
}

exports.runScenario2 = async (req, res) => {
  const logs = []
  const conn = await mysql.createConnection(dbConfig)
  try {
    logs.push('--- Scenario 2: ROLLBACK (Failed Transaction) ---')
    await conn.beginTransaction()
    logs.push('Transaction started.')

    await conn.execute('UPDATE VERIFICATION_REQUEST SET Status = "Completed" WHERE Request_ID = 4')
    logs.push('Updated Request #4 status to Completed (temporary).')

    logs.push('Attempting invalid insert (duplicate cert number)...')
    await conn.execute(
      'INSERT INTO VERIFICATION_CERTIFICATE (Request_ID, Certificate_Number, Issue_Date, Valid_Until) VALUES (?, ?, ?, ?)',
      [4, 'V-CERT-LT3CZ-DOPS4', '2026-04-01', '2027-04-01']
    )

    await conn.commit()
    res.json({ success: true, logs })
  } catch (error) {
    await conn.rollback()
    logs.push(`Caught Error (as expected): ${error.message}`)
    logs.push('Transaction rolled back.')
    res.json({ success: false, logs, expected: true })
  } finally {
    await conn.end()
  }
}

exports.runScenario3 = async (req, res) => {
  const logs = []
  const connA = await mysql.createConnection(dbConfig)
  const connB = await mysql.createConnection(dbConfig)

  try {
    logs.push('--- Scenario 3: Row-Level Locking (Blocking) ---')
    await connA.beginTransaction()
    logs.push('Connection A: Starting transaction and locking Row #17...')
    await connA.execute('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 17 FOR UPDATE')

    logs.push('Connection B: Attempting to lock Row #17 (will block)...')
    const startB = Date.now()
    
    // We run B in a separate "promise" so we can commit A later
    const promiseB = connB.execute('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 17 FOR UPDATE')
    
    logs.push('Connection A: Still holding lock... releasing in 2 seconds.')
    await new Promise(r => setTimeout(r, 2000))
    
    await connA.commit()
    logs.push('Connection A: Committed.')

    await promiseB
    const duration = Date.now() - startB
    logs.push(`Connection B: Acquired lock after ${duration}ms.`)

    res.json({ success: true, logs })
  } catch (error) {
    res.status(500).json({ success: false, logs: [...logs, `Error: ${error.message}`] })
  } finally {
    await connA.end()
    await connB.end()
  }
}

exports.runScenario4 = async (req, res) => {
  const logs = []
  const connA = await mysql.createConnection(dbConfig)
  const connB = await mysql.createConnection(dbConfig)

  try {
    logs.push('--- Scenario 4: Deadlock Scenario ---')
    await connA.beginTransaction()
    await connB.beginTransaction()

    logs.push('A: Locking Row #19...')
    await connA.execute('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 19 FOR UPDATE')

    logs.push('B: Locking Row #20...')
    await connB.execute('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 20 FOR UPDATE')

    logs.push('A: Now trying to lock Row #20 (Wait)...')
    const promiseA = connA.execute('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 20 FOR UPDATE')

    logs.push('B: Now trying to lock Row #19 (DEADLOCK Trigger)...')
    try {
      await connB.execute('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 19 FOR UPDATE')
    } catch (err) {
      logs.push(`B: Caught expected Deadlock: ${err.message}`)
    }

    await promiseA
    logs.push('A: Completed successfully after deadlock resolution.')

    res.json({ success: true, logs })
  } catch (error) {
    res.status(500).json({ success: false, logs: [...logs, `Error: ${error.message}`] })
  } finally {
    await connA.end()
    await connB.end()
  }
}

exports.runScenario5 = async (req, res) => {
  const logs = []
  const connA = await mysql.createConnection(dbConfig)
  const connB = await mysql.createConnection(dbConfig)

  try {
    logs.push('--- Scenario 5: Dirty Read (Isolation Levels) ---')
    await connA.beginTransaction()
    await connA.execute('UPDATE PAYMENT_TRANSACTION SET Payment_Status = "Completed" WHERE Transaction_ID = 12')
    logs.push('A: Updated Payment #12 to Completed (Not Committed).')

    await connB.execute('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED')
    const [rows] = await connB.execute('SELECT Payment_Status FROM PAYMENT_TRANSACTION WHERE Transaction_ID = 12')
    logs.push(`B: Reads (READ UNCOMMITTED): ${rows[0].Payment_Status} <--- DIRTY READ`)

    await connA.rollback()
    logs.push('A: Rolled back.')

    const [rows2] = await connB.execute('SELECT Payment_Status FROM PAYMENT_TRANSACTION WHERE Transaction_ID = 12')
    logs.push(`B: Reads after Rollback: ${rows2[0].Payment_Status}`)

    res.json({ success: true, logs })
  } catch (error) {
    res.status(500).json({ success: false, logs: [...logs, `Error: ${error.message}`] })
  } finally {
    await connA.end()
    await connB.end()
  }
}
