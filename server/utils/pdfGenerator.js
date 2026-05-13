const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Generate a standard SQVS verification certificate PDF
 * @param {Object} certData - The certificate data
 * @param {string} certData.certificateNumber - The generated certificate number
 * @param {string} certData.studentName - The student's name
 * @param {string} certData.degreeName - The degree/qualification name
 * @param {string} certData.institutionName - The institution name 
 * @param {string} certData.issueDate - The issue date string
 * @param {string} certData.validUntil - The expiry date string
 * @param {string} verificationUrl - The public URL to verify this certificate
 * @returns {Promise<Buffer>} - Resolves with the PDF Buffer
 */
const generateCertificatePDF = async (certData, verificationUrl) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Generate QR Code
      const qrImageBuffer = await QRCode.toBuffer(verificationUrl, { type: 'png', width: 150 });

      // Build PDF layout (basic design)

      // Background / Border
      doc.lineWidth(5);
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#4f46e5'); // Indigo border

      // Header
      const pageWidth = doc.page.width;
      
      doc.font('Helvetica-Bold')
         .fontSize(36)
         .fillColor('#1e1b4b')
         .text('VERIFICATION CERTIFICATE', 0, 70, { align: 'center', width: pageWidth });
         
      doc.font('Helvetica')
         .fontSize(16)
         .fillColor('#475569')
         .text('Student Qualification Verification System (SQVS)', 0, 115, { align: 'center', width: pageWidth });

      // Certificate Body (Absolute Positioning)
      doc.fontSize(20).fillColor('#0f172a').text('This is to certify that the qualification of', 0, 180, { align: 'center', width: pageWidth });
      
      doc.font('Helvetica-Bold').fontSize(28).fillColor('#2563eb').text(certData.studentName, 0, 215, { align: 'center', width: pageWidth });
      
      doc.font('Helvetica').fontSize(20).fillColor('#0f172a').text(`for ${certData.degreeName}`, 0, 255, { align: 'center', width: pageWidth });
      
      doc.text('from', 0, 285, { align: 'center', width: pageWidth });
      
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#1e293b').text(certData.institutionName, 0, 315, { align: 'center', width: pageWidth });
      
      doc.font('Helvetica').fontSize(16).fillColor('#475569').text('Has been successfully verified through the SQVS platform.', 0, 360, { align: 'center', width: pageWidth });

      // Details Box (Centered)
      const boxTop = 410;
      doc.fontSize(12).fillColor('#334155');
      
      // Left side details
      doc.text(`Certificate No:`, 150, boxTop);
      doc.font('Helvetica-Bold').text(certData.certificateNumber, 250, boxTop);
      
      doc.font('Helvetica').text(`Issue Date:`, 150, boxTop + 25);
      doc.font('Helvetica-Bold').text(certData.issueDate, 250, boxTop + 25);
      
      doc.font('Helvetica').text(`Valid Until:`, 150, boxTop + 50);
      doc.font('Helvetica-Bold').text(certData.validUntil, 250, boxTop + 50);

      // Add QR Code (Right side)
      doc.image(qrImageBuffer, doc.page.width - 270, boxTop - 15, { width: 100 });
      doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('Scan to Verify', doc.page.width - 255, boxTop + 90);

      // Footer
      doc.fontSize(10).fillColor('#94a3b8').text('This is a digitally generated document. For verification, scan the QR code or visit sqvs.gov.in', 0, doc.page.height - 70, { align: 'center', width: pageWidth });

      // Finalize
      doc.end();

    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate a standard SQVS payment receipt PDF
 * @param {Object} receiptData - The receipt data
 * @param {string} receiptData.transactionId - The payment transaction ID
 * @param {string} receiptData.amount - The payment amount
 * @param {string} receiptData.paymentDate - The payment date
 * @param {string} receiptData.paymentMethod - The payment method (UPI, Card, etc)
 * @param {string} receiptData.payerName - The person/org who paid
 * @param {string} receiptData.purpose - The reason for the fee
 * @returns {Promise<Buffer>} - Resolves with the PDF Buffer
 */
const generateReceiptPDF = async (receiptData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Header
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#1e1b4b')
         .text('PAYMENT RECEIPT', { align: 'center', margin: 20 });
         
      doc.moveDown(0.5);
      
      doc.font('Helvetica')
         .fontSize(12)
         .fillColor('#475569')
         .text('Student Qualification Verification System (SQVS)', { align: 'center' });
      
      doc.moveDown(0.2);
      doc.text('Government of India', { align: 'center' });

      doc.moveDown(2);

      // Details Box Boundary
      const boxTop = doc.y;
      doc.rect(50, boxTop, doc.page.width - 100, 200).stroke('#e2e8f0');

      // Receipt Details
      doc.fontSize(12).fillColor('#334155');
      
      const col1X = 70;
      const col2X = 200;
      let currentY = boxTop + 20;

      doc.font('Helvetica').text('Transaction ID:', col1X, currentY);
      doc.font('Helvetica-Bold').text(receiptData.transactionId, col2X, currentY);
      
      currentY += 30;
      doc.font('Helvetica').text('Date Received:', col1X, currentY);
      doc.font('Helvetica-Bold').text(receiptData.paymentDate, col2X, currentY);
      
      currentY += 30;
      doc.font('Helvetica').text('Received From:', col1X, currentY);
      doc.font('Helvetica-Bold').text(receiptData.payerName, col2X, currentY);
      
      currentY += 30;
      doc.font('Helvetica').text('Payment Method:', col1X, currentY);
      doc.font('Helvetica-Bold').text(receiptData.paymentMethod, col2X, currentY);

      currentY += 30;
      doc.font('Helvetica').text('Purpose:', col1X, currentY);
      doc.font('Helvetica-Bold').text(receiptData.purpose, col2X, currentY);
      
      // Amount prominent
      currentY += 40;
      doc.font('Helvetica').text('Total Amount Received:', col1X, currentY);
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#16a34a').text(`Rs. ${receiptData.amount}`, col2X, currentY - 2);

      // Footer
      doc.moveDown(4);
      doc.fontSize(10).fillColor('#94a3b8').text('This is a computer generated receipt and does not require a physical signature.', 50, doc.page.height - 100, { align: 'center' });

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificatePDF, generateReceiptPDF };
