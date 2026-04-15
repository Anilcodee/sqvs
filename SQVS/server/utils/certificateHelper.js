const crypto = require('crypto');

/**
 * Issues a digital verification certificate for a completed request.
 * @param {Object} connection - Database connection (must be part of a transaction)
 * @param {number} requestId - The ID of the completed verification request
 */
async function issueCertificate(connection, requestId) {
  try {
    // 1. Check if certificate already exists
    const [existing] = await connection.query('SELECT Certificate_Number FROM VERIFICATION_CERTIFICATE WHERE Request_ID = ?', [requestId]);
    if (existing.length > 0) return existing[0].Certificate_Number;

    // 2. Get student and request info for the certificate
    const [request] = await connection.query(
      `SELECT vr.Request_ID, s.NED_ID, s.Student_Name, s.Email
       FROM VERIFICATION_REQUEST vr
       JOIN STUDENT s ON vr.NED_ID = s.NED_ID
       WHERE vr.Request_ID = ?`,
      [requestId]
    );

    if (request.length === 0) throw new Error('Request or Student not found');

    // 3. Generate unique Certificate Number
    const certNumber = `SQVS-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    
    // 4. Calculate validity
    const issueDate = new Date();
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1); // Valid for 1 year

    // 5. Generate Digital Signature (SHA256)
    const digitalSignature = 'SHA256:' + crypto.createHash('sha256')
      .update(certNumber + issueDate.toISOString() + request[0].NED_ID)
      .digest('hex');

    // 6. Insert Certificate Record
    await connection.query(
      'INSERT INTO VERIFICATION_CERTIFICATE (Request_ID, Certificate_Number, Issue_Date, Valid_Until, Digital_Signature) VALUES (?, ?, ?, ?, ?)',
      [requestId, certNumber, issueDate.toISOString().split('T')[0], validUntil.toISOString().split('T')[0], digitalSignature]
    );

    // 7. Update Request Status to Completed (if not already set)
    await connection.query(
      'UPDATE VERIFICATION_REQUEST SET Status = "Completed", Completion_Date = CURDATE() WHERE Request_ID = ? AND Status != "Completed"',
      [requestId]
    );

    // 8. Notify student
    await connection.query(
      'INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message) VALUES (?, ?, ?)',
      [request[0].Email, 'Certificate_Ready', `Your verification certificate ${certNumber} has been issued and is available for download.`]
    );

    console.log(`Certificate ${certNumber} issued for Request ${requestId}`);
    return certNumber;

  } catch (error) {
    console.error('Error in issueCertificate:', error);
    throw error;
  }
}

module.exports = { issueCertificate };
