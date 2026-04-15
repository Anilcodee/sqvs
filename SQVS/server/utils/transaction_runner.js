const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Anil@1234',
  database: process.env.DB_NAME || 'SQVS'
};

async function runScenario1_Commit() {
  console.log('\n--- Scenario 1: COMMIT (Successful Transaction) ---');
  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.beginTransaction();
    console.log('Transaction started.');

    const [reqResult] = await connection.execute(
      'INSERT INTO VERIFICATION_REQUEST (NED_ID, Verifier_ID, Fee_ID, Purpose, Expiry_Date, Status) VALUES (?, ?, ?, ?, ?, ?)',
      ['NED-O2YTK-92JME', 3, 1, 'Employment check for Wipro Kolkata UI Demo', '2027-06-30', 'Pending']
    );
    const newId = reqResult.insertId;
    console.log(`Inserted Request ID: ${newId}`);

    await connection.execute(
      'INSERT INTO PAYMENT_TRANSACTION (Request_ID, Amount, Payment_Method, Payment_Status, Payment_Gateway_Ref, Receipt_Number) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, 450.00, 'UPI', 'Completed', `TXN-RUN-${Date.now()}`, `REC-RUN-${Date.now()}`]
    );
    console.log('Inserted Payment record.');

    await connection.commit();
    console.log('Scenario 1 committed successfully.');

    // Verify
    const [rows] = await connection.execute('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = ?', [newId]);
    console.log('Verification Request in DB:', rows[0]);
  } catch (err) {
    console.error('Scenario 1 Failed:', err);
    await connection.rollback();
  } finally {
    await connection.end();
  }
}

async function runScenario2_Rollback() {
  console.log('\n--- Scenario 2: ROLLBACK (Failed Transaction) ---');
  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.beginTransaction();
    console.log('Transaction started.');

    // Update a request
    await connection.execute('UPDATE VERIFICATION_REQUEST SET Status = "Completed" WHERE Request_ID = 4');
    console.log('Updated Request #4 to Completed (temporary).');

    // This will fail because of duplicate Certificate_Number (V-CERT-LT3CZ-DOPS4 exists)
    console.log('Attempting invalid insert (duplicate cert number)...');
    await connection.execute(
      'INSERT INTO VERIFICATION_CERTIFICATE (Request_ID, Certificate_Number, Issue_Date, Valid_Until) VALUES (?, ?, ?, ?)',
      [4, 'V-CERT-LT3CZ-DOPS4', '2026-04-01', '2027-04-01']
    );
    
    await connection.commit();
  } catch (err) {
    console.log('Caught Error (as expected):', err.message);
    await connection.rollback();
    console.log('Transaction rolled back.');

    // Verify
    const [rows] = await connection.execute('SELECT Status FROM VERIFICATION_REQUEST WHERE Request_ID = 4');
    console.log('Request #4 status after rollback:', rows[0].Status);
  } finally {
    await connection.end();
  }
}

async function runScenario3_Blocking() {
  console.log('\n--- Scenario 3: Row-Level Locking (Blocking) ---');
  const connA = await mysql.createConnection(dbConfig);
  const connB = await mysql.createConnection(dbConfig);

  try {
    console.log('Connection A starting transaction and locking Row #17...');
    await connA.beginTransaction();
    await connA.execute('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 17 FOR UPDATE');

    console.log('Connection B attempting to lock Row #17 (should be blocked)...');
    const start = Date.now();
    
    // Run B in "parallel" but it's naturally blocked by MySQL
    const bPromise = connB.execute('SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 17 FOR UPDATE');
    
    // Wait bit to show B is hanging
    await new Promise(r => setTimeout(r, 2000));
    console.log('Connection A still holding lock. Releasing in 1 second...');
    await new Promise(r => setTimeout(r, 1000));
    
    await connA.commit();
    console.log('Connection A committed.');

    await bPromise;
    const end = Date.now();
    console.log(`Connection B acquired lock after ${end - start}ms.`);
    await connB.commit();

  } finally {
    await connA.end();
    await connB.end();
  }
}

async function runScenario4_Deadlock() {
  console.log('\n--- Scenario 4: Deadlock ---');
  const connA = await mysql.createConnection(dbConfig);
  const connB = await mysql.createConnection(dbConfig);

  try {
    await connA.beginTransaction();
    await connB.beginTransaction();

    console.log('A locking #19...');
    await connA.execute('UPDATE VERIFICATION_REQUEST SET Processed_By = 1 WHERE Request_ID = 19');
    
    console.log('B locking #20...');
    await connB.execute('UPDATE VERIFICATION_REQUEST SET Processed_By = 1 WHERE Request_ID = 20');

    console.log('A trying to lock #20 (Wait)...');
    const aPromise = connA.execute('UPDATE VERIFICATION_REQUEST SET Processed_By = 1 WHERE Request_ID = 20');

    console.log('B trying to lock #19 (DEADLOCK Trigger)...');
    try {
      await connB.execute('UPDATE VERIFICATION_REQUEST SET Processed_By = 1 WHERE Request_ID = 19');
    } catch (err) {
      console.log('B caught Deadlock error:', err.message);
      await connB.rollback();
    }

    await aPromise;
    await connA.commit();
    console.log('A completed successfully.');

  } finally {
    await connA.end();
    await connB.end();
  }
}

async function runScenario5_DirtyRead() {
  console.log('\n--- Scenario 5: Dirty Read (READ UNCOMMITTED) ---');
  const connA = await mysql.createConnection(dbConfig);
  const connB = await mysql.createConnection(dbConfig);

  try {
    await connA.beginTransaction();
    await connA.execute('UPDATE PAYMENT_TRANSACTION SET Payment_Status = "Completed" WHERE Transaction_ID = 12');
    console.log('A updated Payment #12 status to Completed but NOT committed.');

    await connB.execute('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
    const [rows] = await connB.execute('SELECT Payment_Status FROM PAYMENT_TRANSACTION WHERE Transaction_ID = 12');
    console.log('B reads (READ UNCOMMITTED):', rows[0].Payment_Status);

    await connA.rollback();
    console.log('A rolled back.');

    const [rows2] = await connB.execute('SELECT Payment_Status FROM PAYMENT_TRANSACTION WHERE Transaction_ID = 12');
    console.log('B reads after A rollback:', rows2[0].Payment_Status);

  } finally {
    await connA.end();
    await connB.end();
  }
}

async function main() {
  try {
    await runScenario1_Commit();
    await runScenario2_Rollback();
    await runScenario3_Blocking();
    await runScenario4_Deadlock();
    await runScenario5_DirtyRead();
    console.log('\n--- All experiments finished! ---');
  } catch (err) {
    console.error('Detailed Error:', err);
  }
}

main();
