-- STUDENT QUALIFICATION VERIFICATION SYSTEM (SQVS)
-- DATABASE SCHEMA
 

-- Database Creation
DROP DATABASE IF EXISTS SQVS;
CREATE DATABASE SQVS;
USE SQVS;


-- TABLE 1: MINISTRY_OFFICIAL
-- Government officials who administer the SQVS system

CREATE TABLE MINISTRY_OFFICIAL (
    Official_ID INT AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Department VARCHAR(100) DEFAULT 'Ministry of Education',
    Phone VARCHAR(15),
    Status ENUM('Active', 'Inactive') DEFAULT 'Active',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key
    PRIMARY KEY (Official_ID),
    
    -- Unique Constraints
    CONSTRAINT UQ_Official_Email UNIQUE (Email),
    
    -- Check Constraints
    CONSTRAINT CHK_Official_Email CHECK (Email LIKE '%@%.%'),
    CONSTRAINT CHK_Official_Phone CHECK (Phone REGEXP '^[0-9]{10,15}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Ministry officials who manage and oversee the SQVS system';


-- TABLE 2: VERIFICATION_FEE
-- Fee structure for different verification purposes

CREATE TABLE VERIFICATION_FEE (
    Fee_ID INT AUTO_INCREMENT,
    Purpose VARCHAR(50) NOT NULL,
    Base_Fee DECIMAL(10, 2) NOT NULL,
    Processing_Days INT NOT NULL DEFAULT 5,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Primary Key
    PRIMARY KEY (Fee_ID),
    
    -- Unique Constraints
    CONSTRAINT UQ_Fee_Purpose UNIQUE (Purpose),
    
    -- Check Constraints
    CONSTRAINT CHK_Fee_Base_Fee CHECK (Base_Fee >= 0),
    CONSTRAINT CHK_Fee_Processing_Days CHECK (Processing_Days > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Fee structure for different types of verification requests';


-- TABLE 3: INSTITUTION
-- Educational institutions (schools, colleges, universities)

CREATE TABLE INSTITUTION (
    Institution_ID INT AUTO_INCREMENT,
    License_Number VARCHAR(50) NOT NULL,
    Institution_Name VARCHAR(200) NOT NULL,
    Institution_Type ENUM('School', 'College', 'University', 'Other') NOT NULL,
    Location VARCHAR(200) NOT NULL,
    Contact_Email VARCHAR(100) NOT NULL,
    Contact_Phone VARCHAR(15),
    Status ENUM('Pending', 'Approved', 'Rejected', 'Suspended') DEFAULT 'Pending',
    Approved_By INT,
    Approval_Date DATE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key
    PRIMARY KEY (Institution_ID),
    
    -- Unique Constraints
    CONSTRAINT UQ_Institution_License UNIQUE (License_Number),
    CONSTRAINT UQ_Institution_Email UNIQUE (Contact_Email),
    
    -- Foreign Keys
    CONSTRAINT FK_Institution_Approved_By 
        FOREIGN KEY (Approved_By) REFERENCES MINISTRY_OFFICIAL(Official_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT CHK_Institution_Email CHECK (Contact_Email LIKE '%@%.%'),
    CONSTRAINT CHK_Institution_Approval CHECK (
        (Status = 'Approved' AND Approval_Date IS NOT NULL) OR
        (Status != 'Approved' AND Approval_Date IS NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Educational institutions registered in the SQVS system';


-- TABLE 4: INSTITUTION_STAFF
-- Staff members working at educational institutions

CREATE TABLE INSTITUTION_STAFF (
    Staff_ID INT AUTO_INCREMENT,
    Institution_ID INT NOT NULL,
    Staff_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Role ENUM('Administrator', 'Data_Entry_Operator', 'Verifier', 'Support') NOT NULL,
    Status ENUM('Active', 'Inactive') DEFAULT 'Active',
    Hired_Date DATE NOT NULL,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key
    PRIMARY KEY (Staff_ID),
    
    -- Unique Constraints
    CONSTRAINT UQ_Staff_Email UNIQUE (Email),
    CONSTRAINT UQ_Staff_Phone UNIQUE (Phone),
    
    -- Foreign Keys
    CONSTRAINT FK_Staff_Institution 
        FOREIGN KEY (Institution_ID) REFERENCES INSTITUTION(Institution_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT CHK_Staff_Email CHECK (Email LIKE '%@%.%'),
    CONSTRAINT CHK_Staff_Phone CHECK (Phone REGEXP '^[0-9]{10,15}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Staff members who manage qualifications at institutions';


-- TABLE 5: STUDENT
-- Students whose qualifications are verified through SQVS

CREATE TABLE STUDENT (
    NED_ID VARCHAR(20),
    Student_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Aadhaar_Number VARCHAR(12) NOT NULL,
    Date_of_Birth DATE NOT NULL,
    Address TEXT,
    Status ENUM('Active', 'Inactive') DEFAULT 'Active',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key
    PRIMARY KEY (NED_ID),
    
    -- Unique Constraints
    CONSTRAINT UQ_Student_Email UNIQUE (Email),
    CONSTRAINT UQ_Student_Phone UNIQUE (Phone),
    CONSTRAINT UQ_Student_Aadhaar UNIQUE (Aadhaar_Number),
    
    -- Check Constraints
    CONSTRAINT CHK_Student_Email CHECK (Email LIKE '%@%.%'),
    CONSTRAINT CHK_Student_Phone CHECK (Phone REGEXP '^[0-9]{10}$'),
    CONSTRAINT CHK_Student_Aadhaar CHECK (Aadhaar_Number REGEXP '^[0-9]{12}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Students registered in the National Education Database';


-- TABLE 6: QUALIFICATION
-- Academic qualifications of students (degrees, certificates)

CREATE TABLE QUALIFICATION (
    Qualification_ID INT AUTO_INCREMENT,
    Certificate_Number VARCHAR(50) NOT NULL,
    NED_ID VARCHAR(20) NOT NULL,
    Institution_ID INT NOT NULL,
    Qualification_Level ENUM('10th', '12th', 'Secondary', 'Higher Secondary', 'Diploma', 'Undergraduate', 'Postgraduate', 'Doctorate', 'Certificate') NOT NULL,
    Degree_Name VARCHAR(100) NOT NULL,
    Field_of_Study VARCHAR(100) NOT NULL,
    Enrollment_Date DATE NOT NULL,
    Completion_Date DATE NOT NULL,
    Total_Marks DECIMAL(6, 2),
    Marks_Obtained DECIMAL(6, 2),
    Percentage DECIMAL(5, 2),
    Grade VARCHAR(10),
    Status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    Entered_By INT NOT NULL,
    Verified_By INT,
    Verification_Date DATE,
    Remarks TEXT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key
    PRIMARY KEY (Qualification_ID),
    
    -- Unique Constraints
    CONSTRAINT UQ_Qualification_Certificate UNIQUE (Certificate_Number),
    
    -- Foreign Keys
    CONSTRAINT FK_Qualification_Student 
        FOREIGN KEY (NED_ID) REFERENCES STUDENT(NED_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_Qualification_Institution 
        FOREIGN KEY (Institution_ID) REFERENCES INSTITUTION(Institution_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT FK_Qualification_Entered_By 
        FOREIGN KEY (Entered_By) REFERENCES INSTITUTION_STAFF(Staff_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT FK_Qualification_Verified_By 
        FOREIGN KEY (Verified_By) REFERENCES INSTITUTION_STAFF(Staff_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT CHK_Qualification_Dates CHECK (Completion_Date >= Enrollment_Date),
    CONSTRAINT CHK_Qualification_Marks CHECK (Marks_Obtained <= Total_Marks),
    CONSTRAINT CHK_Qualification_Percentage CHECK (Percentage >= 0 AND Percentage <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Academic qualifications entered and verified by institutions';


-- TABLE 7: SUPPORTING_DOCUMENT
-- Documents attached to qualifications (certificates, marksheets, etc.)

CREATE TABLE SUPPORTING_DOCUMENT (
    Document_ID INT AUTO_INCREMENT,
    Qualification_ID INT NOT NULL,
    Document_Type ENUM('Certificate', 'Marksheet', 'Transcript', 'ID_Proof', 'Other') NOT NULL,
    Document_Path VARCHAR(255) NOT NULL,
    Upload_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    File_Size_KB INT,
    Uploaded_By INT NOT NULL,
    
    -- Primary Key
    PRIMARY KEY (Document_ID),
    
    -- Foreign Keys
    CONSTRAINT FK_Document_Qualification 
        FOREIGN KEY (Qualification_ID) REFERENCES QUALIFICATION(Qualification_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_Document_Uploaded_By 
        FOREIGN KEY (Uploaded_By) REFERENCES INSTITUTION_STAFF(Staff_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT CHK_Document_File_Size CHECK (File_Size_KB > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Supporting documents uploaded for qualifications';


-- TABLE 8: EXTERNAL_VERIFIER
-- External organizations requesting verification (employers, universities, etc.)

CREATE TABLE EXTERNAL_VERIFIER (
    Verifier_ID INT AUTO_INCREMENT,
    Organization_Name VARCHAR(200) NOT NULL,
    Verifier_Type ENUM('University', 'Employer', 'Government', 'Immigration', 'Other') NOT NULL,
    Country VARCHAR(100) NOT NULL,
    Contact_Person VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Phone VARCHAR(15),
    Status ENUM('Pending', 'Approved', 'Rejected', 'Suspended') DEFAULT 'Pending',
    Approved_By INT,
    Approval_Date DATE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key
    PRIMARY KEY (Verifier_ID),
    
    -- Unique Constraints
    CONSTRAINT UQ_Verifier_Email UNIQUE (Email),
    
    -- Foreign Keys
    CONSTRAINT FK_Verifier_Approved_By 
        FOREIGN KEY (Approved_By) REFERENCES MINISTRY_OFFICIAL(Official_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT CHK_Verifier_Email CHECK (Email LIKE '%@%.%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='External organizations requesting student qualification verification';


-- TABLE 9: VERIFICATION_REQUEST
-- Verification requests from external verifiers

CREATE TABLE VERIFICATION_REQUEST (
    Request_ID INT AUTO_INCREMENT,
    NED_ID VARCHAR(20) NOT NULL,
    Verifier_ID INT NOT NULL,
    Fee_ID INT NOT NULL,
    Purpose VARCHAR(100) NOT NULL,
    Request_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Expiry_Date DATE NOT NULL,
    Status ENUM('Pending', 'In_Progress', 'Completed', 'Rejected', 'Expired') DEFAULT 'Pending',
    Processed_By INT,
    Completion_Date DATE,
    
    -- Primary Key
    PRIMARY KEY (Request_ID),
    
    -- Foreign Keys
    CONSTRAINT FK_Request_Student 
        FOREIGN KEY (NED_ID) REFERENCES STUDENT(NED_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_Request_Verifier 
        FOREIGN KEY (Verifier_ID) REFERENCES EXTERNAL_VERIFIER(Verifier_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT FK_Request_Fee 
        FOREIGN KEY (Fee_ID) REFERENCES VERIFICATION_FEE(Fee_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT FK_Request_Processed_By 
        FOREIGN KEY (Processed_By) REFERENCES MINISTRY_OFFICIAL(Official_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT CHK_Request_Expiry CHECK (Expiry_Date >= '2020-01-01')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Verification requests submitted by external verifiers';


-- TABLE 10: REQUESTED_QUALIFICATION
-- Junction table linking requests to qualifications with consent status

CREATE TABLE REQUESTED_QUALIFICATION (
    Request_ID INT,
    Qualification_ID INT,
    Consent_Status ENUM('Pending', 'Granted', 'Denied') DEFAULT 'Pending',
    Consent_Date TIMESTAMP NULL,
    
    -- Primary Key
    PRIMARY KEY (Request_ID, Qualification_ID),
    
    -- Foreign Keys
    CONSTRAINT FK_RQ_Request 
        FOREIGN KEY (Request_ID) REFERENCES VERIFICATION_REQUEST(Request_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_RQ_Qualification 
        FOREIGN KEY (Qualification_ID) REFERENCES QUALIFICATION(Qualification_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Links verification requests to specific qualifications with consent tracking';


-- TABLE 11: PAYMENT_TRANSACTION
-- Payment transactions for verification requests

CREATE TABLE PAYMENT_TRANSACTION (
    Transaction_ID INT AUTO_INCREMENT,
    Request_ID INT NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Payment_Method ENUM('Card', 'Net_Banking', 'UPI', 'Wallet', 'Other') NOT NULL,
    Payment_Status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    Transaction_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Payment_Gateway_Ref VARCHAR(100),
    Receipt_Number VARCHAR(50) UNIQUE,
    Receipt_Path VARCHAR(255),
    Refund_Date DATE,
    Refund_Reason VARCHAR(255),
    
    -- Primary Key
    PRIMARY KEY (Transaction_ID),
    
    -- Unique Constraints
    CONSTRAINT UQ_Payment_Request UNIQUE (Request_ID),
    
    -- Foreign Keys
    CONSTRAINT FK_Payment_Request 
        FOREIGN KEY (Request_ID) REFERENCES VERIFICATION_REQUEST(Request_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT CHK_Payment_Amount CHECK (Amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment transactions for verification requests';


-- TABLE 12: VERIFICATION_CERTIFICATE
-- Digital certificates issued for completed verifications

CREATE TABLE VERIFICATION_CERTIFICATE (
    Certificate_ID INT AUTO_INCREMENT,
    Request_ID INT NOT NULL,
    Certificate_Number VARCHAR(50) NOT NULL,
    Issue_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Valid_Until DATE NOT NULL,
    Digital_Signature TEXT,
    QR_Code_Path VARCHAR(255),
    PDF_Path VARCHAR(255),
    
    -- Primary Key
    PRIMARY KEY (Certificate_ID),
    
    -- Unique Constraints
    CONSTRAINT UQ_Certificate_Number UNIQUE (Certificate_Number),
    CONSTRAINT UQ_Certificate_Request UNIQUE (Request_ID),
    
    -- Foreign Keys
    CONSTRAINT FK_Certificate_Request 
        FOREIGN KEY (Request_ID) REFERENCES VERIFICATION_REQUEST(Request_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT CHK_Certificate_Validity CHECK (Valid_Until >= '2020-01-01')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Digital verification certificates with QR codes and digital signatures';


-- TABLE 13: NOTIFICATION
-- System notifications sent to users

CREATE TABLE NOTIFICATION (
    Notification_ID INT AUTO_INCREMENT,
    Recipient_Email VARCHAR(100) NOT NULL,
    Notification_Type ENUM('Verification_Request', 'Status_Update', 'Payment_Confirmation', 'Certificate_Ready', 'Other') NOT NULL,
    Message TEXT NOT NULL,
    Sent_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Read_Status BOOLEAN DEFAULT FALSE,
    
    -- Primary Key
    PRIMARY KEY (Notification_ID),
    
    -- Indexes for efficient querying
    INDEX idx_Notification_Recipient (Recipient_Email),
    INDEX idx_Notification_Read (Read_Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System notifications sent to users via email and in-app';


-- TABLE 14: ERROR_REPORT
-- Error reports submitted by students regarding qualifications

CREATE TABLE ERROR_REPORT (
    Report_ID INT AUTO_INCREMENT,
    Qualification_ID INT NOT NULL,
    Reported_By VARCHAR(20) NOT NULL,
    Resolved_By INT,
    Issue_Description TEXT NOT NULL,
    Report_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Resolution_Date TIMESTAMP NULL,
    Status ENUM('Open', 'Under_Review', 'Resolved', 'Closed') DEFAULT 'Open',
    Resolution_Notes TEXT,
    
    -- Primary Key
    PRIMARY KEY (Report_ID),
    
    -- Foreign Keys
    CONSTRAINT FK_Error_Qualification 
        FOREIGN KEY (Qualification_ID) REFERENCES QUALIFICATION(Qualification_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT FK_Error_Reported_By 
        FOREIGN KEY (Reported_By) REFERENCES STUDENT(NED_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT FK_Error_Resolved_By 
        FOREIGN KEY (Resolved_By) REFERENCES INSTITUTION_STAFF(Staff_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Error reports submitted by students about their qualifications';


-- TABLE 15: AUDIT_LOG
-- Complete audit trail of all system actions

CREATE TABLE AUDIT_LOG (
    Log_ID INT AUTO_INCREMENT,
    User_Email VARCHAR(100) NOT NULL,
    Action_Type ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT') NOT NULL,
    Table_Name VARCHAR(50),
    Record_ID VARCHAR(50),
    Old_Value TEXT,
    New_Value TEXT,
    IP_Address VARCHAR(45),
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key
    PRIMARY KEY (Log_ID),
    
    -- Indexes for efficient querying
    INDEX idx_Audit_User (User_Email),
    INDEX idx_Audit_Timestamp (Timestamp),
    INDEX idx_Audit_Table (Table_Name, Record_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Complete audit trail of all system actions for compliance';


-- PERFORMANCE INDEXES
-- Additional indexes for query optimization

-- INSTITUTION table indexes
CREATE INDEX idx_Institution_Status ON INSTITUTION(Status);
CREATE INDEX idx_Institution_Type ON INSTITUTION(Institution_Type);
CREATE INDEX idx_Institution_Approved_By ON INSTITUTION(Approved_By);

-- INSTITUTION_STAFF table indexes
CREATE INDEX idx_Staff_Institution ON INSTITUTION_STAFF(Institution_ID);
CREATE INDEX idx_Staff_Role ON INSTITUTION_STAFF(Role);
CREATE INDEX idx_Staff_Status ON INSTITUTION_STAFF(Status);

-- STUDENT table indexes
CREATE INDEX idx_Student_Status ON STUDENT(Status);

-- QUALIFICATION table indexes
CREATE INDEX idx_Qualification_Student ON QUALIFICATION(NED_ID);
CREATE INDEX idx_Qualification_Institution ON QUALIFICATION(Institution_ID);
CREATE INDEX idx_Qualification_Status ON QUALIFICATION(Status);
CREATE INDEX idx_Qualification_Level ON QUALIFICATION(Qualification_Level);
CREATE INDEX idx_Qualification_Entered_By ON QUALIFICATION(Entered_By);
CREATE INDEX idx_Qualification_Verified_By ON QUALIFICATION(Verified_By);

-- SUPPORTING_DOCUMENT table indexes
CREATE INDEX idx_Document_Qualification ON SUPPORTING_DOCUMENT(Qualification_ID);
CREATE INDEX idx_Document_Type ON SUPPORTING_DOCUMENT(Document_Type);

-- EXTERNAL_VERIFIER table indexes
CREATE INDEX idx_Verifier_Status ON EXTERNAL_VERIFIER(Status);
CREATE INDEX idx_Verifier_Type ON EXTERNAL_VERIFIER(Verifier_Type);
CREATE INDEX idx_Verifier_Country ON EXTERNAL_VERIFIER(Country);

-- VERIFICATION_REQUEST table indexes
CREATE INDEX idx_Request_Student ON VERIFICATION_REQUEST(NED_ID);
CREATE INDEX idx_Request_Verifier ON VERIFICATION_REQUEST(Verifier_ID);
CREATE INDEX idx_Request_Status ON VERIFICATION_REQUEST(Status);
CREATE INDEX idx_Request_Date ON VERIFICATION_REQUEST(Request_Date);

-- PAYMENT_TRANSACTION table indexes
CREATE INDEX idx_Payment_Status ON PAYMENT_TRANSACTION(Payment_Status);
CREATE INDEX idx_Payment_Date ON PAYMENT_TRANSACTION(Transaction_Date);

-- ERROR_REPORT table indexes
CREATE INDEX idx_Error_Qualification ON ERROR_REPORT(Qualification_ID);
CREATE INDEX idx_Error_Status ON ERROR_REPORT(Status);
CREATE INDEX idx_Error_Reported_By ON ERROR_REPORT(Reported_By);

-- SCHEMA CREATION COMPLETE

SELECT 'SQVS Database Schema Created Successfully!' AS Status;

