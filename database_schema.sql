-- Student Qualification Verification System (SQVS)

-- Database Creation
DROP DATABASE IF EXISTS SQVS;
CREATE DATABASE SQVS;
USE SQVS;

-- TABLE 1: MINISTRY_OFFICIAL
CREATE TABLE MINISTRY_OFFICIAL (
    Official_ID INT AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Department VARCHAR(100) NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- TABLE 2: VERIFICATION_FEE
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 3: INSTITUTION
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 4: INSTITUTION_STAFF
CREATE TABLE INSTITUTION_STAFF (
    Staff_ID INT AUTO_INCREMENT,
    Institution_ID INT NOT NULL,
    Staff_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 5: STUDENT
CREATE TABLE STUDENT (
    NED_ID VARCHAR(20),
    Student_Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- TABLE 6: QUALIFICATION
CREATE TABLE QUALIFICATION (
    Qualification_ID INT AUTO_INCREMENT,
    Certificate_Number VARCHAR(50) NOT NULL,
    NED_ID VARCHAR(20) NOT NULL,
    Institution_ID INT NOT NULL,
    Qualification_Level ENUM('10th', '12th', 'Diploma', 'Undergraduate', 'Postgraduate', 'Doctorate') NOT NULL,
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

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 7: SUPPORTING_DOCUMENT
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 8: EXTERNAL_VERIFIER
CREATE TABLE EXTERNAL_VERIFIER (
    Verifier_ID INT AUTO_INCREMENT,
    Organization_Name VARCHAR(200) NOT NULL,
    Verifier_Type ENUM('University', 'Employer', 'Government', 'Immigration', 'Other') NOT NULL,
    Country VARCHAR(100) NOT NULL,
    Contact_Person VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
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

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 9: VERIFICATION_REQUEST
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

    CONSTRAINT CHK_Request_Expiry CHECK (Expiry_Date >= '2020-01-01')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 10: REQUESTED_QUALIFICATION
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 11: PAYMENT_TRANSACTION
CREATE TABLE PAYMENT_TRANSACTION (
    Transaction_ID INT AUTO_INCREMENT,
    Request_ID INT NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Payment_Method ENUM('Card', 'Net_Banking', 'UPI', 'Wallet', 'Other') NOT NULL,
    Payment_Status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    Transaction_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Payment_Gateway_Ref VARCHAR(100),
    
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 12: VERIFICATION_CERTIFICATE
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
        
    CONSTRAINT CHK_Certificate_Validity CHECK (Valid_Until >= '2020-01-01')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 13: NOTIFICATION
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 14: ERROR_REPORT
CREATE TABLE ERROR_REPORT (
    Report_ID INT AUTO_INCREMENT,
    Qualification_ID INT NOT NULL,
    Reported_By VARCHAR(20) NOT NULL,
    Resolved_By INT,
    Issue_Description TEXT NOT NULL,
    Report_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Resolution_Date TIMESTAMP NULL,
    Status ENUM('Open', 'Under_Review', 'Resolved', 'Closed') DEFAULT 'Open',
    
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 15: AUDIT_LOG
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for INSTITUTION table
CREATE INDEX idx_Institution_Status ON INSTITUTION(Status);
CREATE INDEX idx_Institution_Type ON INSTITUTION(Institution_Type);
CREATE INDEX idx_Institution_Approved_By ON INSTITUTION(Approved_By);

-- Indexes for INSTITUTION_STAFF table
CREATE INDEX idx_Staff_Institution ON INSTITUTION_STAFF(Institution_ID);
CREATE INDEX idx_Staff_Role ON INSTITUTION_STAFF(Role);
CREATE INDEX idx_Staff_Status ON INSTITUTION_STAFF(Status);

-- Indexes for STUDENT table
CREATE INDEX idx_Student_Status ON STUDENT(Status);

-- Indexes for QUALIFICATION table
CREATE INDEX idx_Qualification_Student ON QUALIFICATION(NED_ID);
CREATE INDEX idx_Qualification_Institution ON QUALIFICATION(Institution_ID);
CREATE INDEX idx_Qualification_Status ON QUALIFICATION(Status);
CREATE INDEX idx_Qualification_Level ON QUALIFICATION(Qualification_Level);
CREATE INDEX idx_Qualification_Entered_By ON QUALIFICATION(Entered_By);
CREATE INDEX idx_Qualification_Verified_By ON QUALIFICATION(Verified_By);

-- Indexes for SUPPORTING_DOCUMENT table
CREATE INDEX idx_Document_Qualification ON SUPPORTING_DOCUMENT(Qualification_ID);
CREATE INDEX idx_Document_Type ON SUPPORTING_DOCUMENT(Document_Type);

-- Indexes for EXTERNAL_VERIFIER table
CREATE INDEX idx_Verifier_Status ON EXTERNAL_VERIFIER(Status);
CREATE INDEX idx_Verifier_Type ON EXTERNAL_VERIFIER(Verifier_Type);
CREATE INDEX idx_Verifier_Country ON EXTERNAL_VERIFIER(Country);

-- Indexes for VERIFICATION_REQUEST table
CREATE INDEX idx_Request_Student ON VERIFICATION_REQUEST(NED_ID);
CREATE INDEX idx_Request_Verifier ON VERIFICATION_REQUEST(Verifier_ID);
CREATE INDEX idx_Request_Status ON VERIFICATION_REQUEST(Status);
CREATE INDEX idx_Request_Date ON VERIFICATION_REQUEST(Request_Date);

-- Indexes for PAYMENT_TRANSACTION table
CREATE INDEX idx_Payment_Status ON PAYMENT_TRANSACTION(Payment_Status);
CREATE INDEX idx_Payment_Date ON PAYMENT_TRANSACTION(Transaction_Date);

-- Indexes for ERROR_REPORT table
CREATE INDEX idx_Error_Qualification ON ERROR_REPORT(Qualification_ID);
CREATE INDEX idx_Error_Status ON ERROR_REPORT(Status);
CREATE INDEX idx_Error_Reported_By ON ERROR_REPORT(Reported_By);


-- PART 3: SAMPLE DATA INSERTION

-- ----------------------------------------------------------------------------
-- Insert Ministry Officials
-- ----------------------------------------------------------------------------
INSERT INTO MINISTRY_OFFICIAL (Name, Email, Department, Phone, Status) VALUES
('Rajesh Kumar', 'rajesh.kumar@education.gov.in', 'Higher Education', '9876543210', 'Active'),
('Priya Sharma', 'priya.sharma@education.gov.in', 'Technical Education', '9876543211', 'Active'),
('Amit Patel', 'amit.patel@education.gov.in', 'School Education', '9876543212', 'Active');

-- ----------------------------------------------------------------------------
-- Insert Verification Fees
-- ----------------------------------------------------------------------------
INSERT INTO VERIFICATION_FEE (Purpose, Base_Fee, Processing_Days) VALUES
('Employment Verification', 500.00, 3),
('Higher Education Admission', 750.00, 5),
('Immigration/Visa', 1000.00, 7),
('Government Service', 300.00, 2),
('Scholarship Application', 400.00, 3);

-- ----------------------------------------------------------------------------
-- Insert Institutions
-- ----------------------------------------------------------------------------
INSERT INTO INSTITUTION (License_Number, Institution_Name, Institution_Type, Location, Contact_Email, Contact_Phone, Status, Approved_By, Approval_Date) VALUES
('DU-2020-001', 'University of Delhi', 'University', 'Delhi', 'admin@du.ac.in', '01127667853', 'Approved', 1, '2020-01-15'),
('IIT-D-2020-002', 'Indian Institute of Technology Delhi', 'University', 'Delhi', 'admin@iitd.ac.in', '01126591111', 'Approved', 1, '2020-02-20'),
('CBSE-2020-003', 'Central Board of Secondary Education', 'School', 'Delhi', 'cbse@nic.in', '01123212603', 'Approved', 2, '2020-03-10'),
('DTU-2020-004', 'Delhi Technological University', 'University', 'Delhi', 'admin@dtu.ac.in', '01127871023', 'Approved', 1, '2020-04-05'),
('JIIT-2021-005', 'Jaypee Institute of Information Technology', 'College', 'Noida', 'admin@jiit.ac.in', '01205123456', 'Pending', NULL, NULL);

-- ----------------------------------------------------------------------------
-- Insert Institution Staff
-- ----------------------------------------------------------------------------
INSERT INTO INSTITUTION_STAFF (Institution_ID, Staff_Name, Email, Phone, Role, Hired_Date) VALUES
(1, 'Priya Sharma', 'priya.sharma@du.ac.in', '9876501001', 'Administrator', '2020-06-01'),
(1, 'Amit Kumar', 'amit.kumar@du.ac.in', '9876501002', 'Verifier', '2020-07-15'),
(2, 'Neha Gupta', 'neha.gupta@iitd.ac.in', '9876502001', 'Administrator', '2020-08-01'),
(3, 'Rahul Singh', 'rahul.singh@cbse.nic.in', '9876503001', 'Data_Entry_Operator', '2020-09-01'),
(4, 'Sanjay Verma', 'sanjay.verma@dtu.ac.in', '9876504001', 'Verifier', '2020-10-01');

-- ----------------------------------------------------------------------------
-- Insert Students
-- ----------------------------------------------------------------------------
INSERT INTO STUDENT (NED_ID, Student_Name, Email, Phone, Aadhaar_Number, Date_of_Birth, Address, Status) VALUES
('NED2024001', 'Rahul Verma', 'rahul.verma@gmail.com', '9876000001', '123456789012', '2000-05-15', 'A-123, Sector 15, Noida, UP', 'Active'),
('NED2024002', 'Priyanka Sharma', 'priyanka.sharma@gmail.com', '9876000002', '123456789013', '1999-08-22', 'B-456, Dwarka, Delhi', 'Active'),
('NED2024003', 'Arjun Singh', 'arjun.singh@gmail.com', '9876000003', '123456789014', '2001-03-10', 'C-789, Gurgaon, Haryana', 'Active'),
('NED2024004', 'Sneha Patel', 'sneha.patel@gmail.com', '9876000004', '123456789015', '2000-11-30', 'D-321, Vasant Kunj, Delhi', 'Active'),
('NED2024005', 'Karan Malhotra', 'karan.malhotra@gmail.com', '9876000005', '123456789016', '1998-07-18', 'E-654, Saket, Delhi', 'Active');

-- ----------------------------------------------------------------------------
-- Insert Qualifications
-- ----------------------------------------------------------------------------
INSERT INTO QUALIFICATION (Certificate_Number, NED_ID, Institution_ID, Qualification_Level, Degree_Name, Field_of_Study, Enrollment_Date, Completion_Date, Total_Marks, Marks_Obtained, Percentage, Grade, Status, Entered_By, Verified_By, Verification_Date) VALUES
('DU-2022-BA-001', 'NED2024001', 1, 'Undergraduate', 'Bachelor of Arts', 'Economics', '2019-07-01', '2022-06-30', 1200, 1020, 85.00, 'A', 'Verified', 1, 2, '2022-07-15'),
('CBSE-2018-12-001', 'NED2024001', 3, '12th', 'Senior Secondary', 'Science', '2017-04-01', '2018-03-31', 500, 430, 86.00, 'A1', 'Verified', 4, 4, '2018-05-01'),
('DU-2023-BCOM-002', 'NED2024002', 1, 'Undergraduate', 'Bachelor of Commerce', 'Commerce', '2020-07-01', '2023-06-30', 1200, 1050, 87.50, 'A', 'Verified', 1, 2, '2023-07-15'),
('IITD-2023-MTECH-001', 'NED2024003', 2, 'Postgraduate', 'Master of Technology', 'Computer Science', '2021-07-01', '2023-06-30', 1000, 890, 89.00, 'A', 'Verified', 3, 3, '2023-07-20'),
('IITD-2021-BTECH-001', 'NED2024003', 2, 'Undergraduate', 'Bachelor of Technology', 'Computer Science', '2017-07-01', '2021-06-30', 1000, 850, 85.00, 'A', 'Verified', 3, 3, '2021-07-15'),
('DU-2020-BBA-003', 'NED2024004', 1, 'Undergraduate', 'Bachelor of Business Administration', 'Business Administration', '2017-07-01', '2020-06-30', 1200, 990, 82.50, 'A', 'Verified', 1, 2, '2020-07-15'),
('DTU-2021-BTECH-002', 'NED2024005', 4, 'Undergraduate', 'Bachelor of Technology', 'Mechanical Engineering', '2017-07-01', '2021-06-30', 1000, 800, 80.00, 'B+', 'Verified', 5, 5, '2021-07-20'),
('DTU-2023-MTECH-003', 'NED2024005', 4, 'Postgraduate', 'Master of Technology', 'Mechanical Engineering', '2021-07-01', '2023-06-30', 1000, 880, 88.00, 'A', 'Verified', 5, 5, '2023-07-25');

-- ----------------------------------------------------------------------------
-- Insert Supporting Documents
-- ----------------------------------------------------------------------------
INSERT INTO SUPPORTING_DOCUMENT (Qualification_ID, Document_Type, Document_Path, File_Size_KB, Uploaded_By) VALUES
(1, 'Certificate', '/documents/certificates/DU-2022-BA-001-cert.pdf', 250, 1),
(1, 'Marksheet', '/documents/marksheets/DU-2022-BA-001-marks.pdf', 180, 1),
(2, 'Certificate', '/documents/certificates/CBSE-2018-12-001-cert.pdf', 220, 4),
(3, 'Certificate', '/documents/certificates/DU-2023-BCOM-002-cert.pdf', 260, 1),
(4, 'Certificate', '/documents/certificates/IITD-2023-MTECH-001-cert.pdf', 240, 3),
(5, 'Certificate', '/documents/certificates/IITD-2021-BTECH-001-cert.pdf', 230, 3);

-- ----------------------------------------------------------------------------
-- Insert External Verifiers
-- ----------------------------------------------------------------------------
INSERT INTO EXTERNAL_VERIFIER (Organization_Name, Verifier_Type, Country, Contact_Person, Email, Phone, Status, Approved_By, Approval_Date) VALUES
('Infosys Limited', 'Employer', 'India', 'HR Manager', 'hr@infosys.com', '08028520261', 'Approved', 1, '2024-01-10'),
('Tata Consultancy Services', 'Employer', 'India', 'Recruitment Head', 'careers@tcs.com', '02266780000', 'Approved', 1, '2024-01-15'),
('Stanford University', 'University', 'USA', 'Admissions Office', 'admissions@stanford.edu', '16507232300', 'Approved', 2, '2024-02-01'),
('Government of Canada - IRCC', 'Immigration', 'Canada', 'Document Verification', 'ircc@canada.ca', '18889422100', 'Approved', 2, '2024-02-10'),
('Google India', 'Employer', 'India', 'HR Department', 'careers@google.com', '08067864000', 'Approved', 1, '2025-01-05');

-- ----------------------------------------------------------------------------
-- Insert Verification Requests
-- ----------------------------------------------------------------------------
INSERT INTO VERIFICATION_REQUEST (NED_ID, Verifier_ID, Fee_ID, Purpose, Expiry_Date, Status, Processed_By, Completion_Date) VALUES
('NED2024001', 1, 1, 'Employment at Infosys', '2024-11-15', 'Completed', 1, '2024-10-16'),
('NED2024002', 2, 1, 'Employment at TCS', '2024-12-20', 'In_Progress', NULL, NULL),
('NED2024003', 3, 2, 'Admission to Stanford University', '2024-12-31', 'Pending', NULL, NULL),
('NED2024004', 4, 3, 'Canada Immigration', '2025-01-31', 'Pending', NULL, NULL),
('NED2024005', 5, 1, 'Employment at Google', '2025-02-15', 'Pending', NULL, NULL);

-- ----------------------------------------------------------------------------
-- Insert Requested Qualifications
-- ----------------------------------------------------------------------------
INSERT INTO REQUESTED_QUALIFICATION (Request_ID, Qualification_ID, Consent_Status, Consent_Date) VALUES
(1, 1, 'Granted', '2024-10-15 15:30:00'),
(1, 2, 'Granted', '2024-10-15 15:30:00'),
(2, 3, 'Granted', '2024-11-20 16:00:00'),
(3, 4, 'Pending', NULL),
(3, 5, 'Pending', NULL),
(4, 6, 'Pending', NULL),
(5, 7, 'Granted', '2025-01-05 20:00:00'),
(5, 8, 'Granted', '2025-01-05 20:00:00');

-- ----------------------------------------------------------------------------
-- Insert Payment Transactions
-- ----------------------------------------------------------------------------
INSERT INTO PAYMENT_TRANSACTION (Request_ID, Amount, Payment_Method, Payment_Status, Payment_Gateway_Ref) VALUES
(1, 500.00, 'UPI', 'Completed', 'TXN20241015001'),
(2, 500.00, 'Card', 'Completed', 'TXN20241120001'),
(3, 750.00, 'Net_Banking', 'Pending', NULL),
(4, 1000.00, 'Card', 'Pending', NULL),
(5, 500.00, 'UPI', 'Completed', 'TXN20250105001');

-- ----------------------------------------------------------------------------
-- Insert Verification Certificates
-- ----------------------------------------------------------------------------
INSERT INTO VERIFICATION_CERTIFICATE (Request_ID, Certificate_Number, Valid_Until, Digital_Signature, QR_Code_Path, PDF_Path) VALUES
(1, 'SQVS-2024-001', '2025-10-16', 'SHA256:abc123def456...', '/certificates/qr/SQVS-2024-001.png', '/certificates/pdf/SQVS-2024-001.pdf');

-- ----------------------------------------------------------------------------
-- Insert Notifications
-- ----------------------------------------------------------------------------
INSERT INTO NOTIFICATION (Recipient_Email, Notification_Type, Message, Sent_At, Read_Status) VALUES
('rahul.verma@gmail.com', 'Verification_Request', 'Infosys has requested to verify your qualifications. Please provide consent.', '2024-10-15 10:00:00', TRUE),
('rahul.verma@gmail.com', 'Certificate_Ready', 'Your verification certificate SQVS-2024-001 is ready for download.', '2024-10-16 10:30:00', TRUE),
('hr@infosys.com', 'Payment_Confirmation', 'Payment of ₹500 has been received for verification request #1.', '2024-10-15 11:05:00', TRUE),
('priyanka.sharma@gmail.com', 'Verification_Request', 'TCS has requested to verify your B.Com qualification. Please review and provide consent.', '2024-11-20 14:20:00', TRUE),
('arjun.singh@gmail.com', 'Verification_Request', 'Stanford University has requested to verify your M.Tech and B.Tech qualifications.', '2024-12-01 09:05:00', TRUE),
('sneha.patel@gmail.com', 'Verification_Request', 'Government of Canada - IRCC has requested to verify your BBA qualification.', '2024-12-10 11:50:00', FALSE),
('karan.malhotra@gmail.com', 'Status_Update', 'Your consent has been recorded for Google India verification request.', '2025-01-05 20:05:00', FALSE);

-- ----------------------------------------------------------------------------
-- Insert Error Reports
-- ----------------------------------------------------------------------------
INSERT INTO ERROR_REPORT (Qualification_ID, Reported_By, Resolved_By, Issue_Description, Report_Date, Resolution_Date, Status) VALUES
(1, 'NED2024001', 2, 'Marks shown as 85.50, should be 87.50. Please verify from original documents.', '2024-09-10 14:30:00', '2024-09-11 10:00:00', 'Resolved'),
(3, 'NED2024002', 5, 'Field of study should be "Accounting and Finance" instead of just "Commerce".', '2024-08-15 16:45:00', NULL, 'Under_Review');

-- ----------------------------------------------------------------------------
-- Insert Audit Log Entries
-- ----------------------------------------------------------------------------
INSERT INTO AUDIT_LOG (User_Email, Action_Type, Table_Name, Record_ID, Old_Value, New_Value, IP_Address, Timestamp) VALUES
-- Official approvals
('rajesh.kumar@education.gov.in', 'UPDATE', 'INSTITUTION', '1', 'Status: Pending', 'Status: Approved, Approved_By: 1', '103.28.100.45', '2020-01-15 10:30:00'),
('rajesh.kumar@education.gov.in', 'UPDATE', 'EXTERNAL_VERIFIER', '1', 'Status: Pending', 'Status: Approved, Approved_By: 1', '103.28.100.45', '2024-01-10 14:20:00'),

-- Staff creating qualifications
('priya.sharma@du.ac.in', 'CREATE', 'QUALIFICATION', '1', NULL, 'Created qualification for NED2024001', '115.244.56.78', '2022-07-15 09:15:30'),
('amit.kumar@du.ac.in', 'UPDATE', 'QUALIFICATION', '1', 'Status: Pending, Verified_By: NULL', 'Status: Verified, Verified_By: 2', '115.244.56.78', '2022-07-15 11:00:00'),

-- Student consent
('rahul.verma@gmail.com', 'UPDATE', 'REQUESTED_QUALIFICATION', '1-1', 'Consent_Status: Pending', 'Consent_Status: Granted', '49.207.45.123', '2024-10-15 15:30:00'),

-- Payment processing
('hr@infosys.com', 'CREATE', 'PAYMENT_TRANSACTION', '1', NULL, 'Payment of ₹500 for Request_ID: 1', '182.73.234.56', '2024-10-15 11:00:00'),

-- Certificate generation
('system@sqvs.gov.in', 'CREATE', 'VERIFICATION_CERTIFICATE', '1', NULL, 'Generated certificate SQVS-2024-001', '127.0.0.1', '2024-10-16 10:00:00'),

-- Error report
('rahul.verma@gmail.com', 'CREATE', 'ERROR_REPORT', '1', NULL, 'Reported error in marks for Qualification_ID: 1', '49.207.45.123', '2024-09-10 14:30:00'),
('amit.kumar@du.ac.in', 'UPDATE', 'ERROR_REPORT', '1', 'Status: Open', 'Status: Resolved, Resolved_By: 2', '115.244.56.78', '2024-09-11 10:00:00'),

-- Recent activity
('karan.malhotra@gmail.com', 'VIEW', 'QUALIFICATION', '7,8', NULL, 'Viewed own qualifications', '103.240.78.91', '2025-01-05 19:45:00'),
('careers@google.com', 'CREATE', 'VERIFICATION_REQUEST', '5', NULL, 'Created verification request for NED2024005', '172.217.160.78', '2025-01-05 16:20:00');

-- Queries to run

SELECT 
    s.Student_Name,
    q.Degree_Name,
    q.Qualification_Level,
    q.Status
FROM STUDENT s
JOIN QUALIFICATION q ON s.NED_ID = q.NED_ID
ORDER BY s.Student_Name;

SELECT Institution_Name, Institution_Type, Location
FROM INSTITUTION
WHERE Status = 'Approved';

SELECT Request_ID, NED_ID, Purpose, Status
FROM VERIFICATION_REQUEST
WHERE Status = 'Pending';

SELECT SUM(Amount) AS Total_Revenue
FROM PAYMENT_TRANSACTION
WHERE Payment_Status = 'Completed';

SELECT 
    s.Student_Name,
    COUNT(q.Qualification_ID) AS Total_Qualifications
FROM STUDENT s
JOIN QUALIFICATION q ON s.NED_ID = q.NED_ID
GROUP BY s.Student_Name
HAVING COUNT(q.Qualification_ID) > 1;

SELECT 
    i.Institution_Name,
    COUNT(q.Qualification_ID) AS Total_Qualifications
FROM INSTITUTION i
LEFT JOIN QUALIFICATION q 
ON i.Institution_ID = q.Institution_ID
GROUP BY i.Institution_Name;

SELECT 
    s.Student_Name,
    q.Degree_Name
FROM VERIFICATION_REQUEST vr
JOIN EXTERNAL_VERIFIER ev ON vr.Verifier_ID = ev.Verifier_ID
JOIN REQUESTED_QUALIFICATION rq ON vr.Request_ID = rq.Request_ID
JOIN QUALIFICATION q ON rq.Qualification_ID = q.Qualification_ID
JOIN STUDENT s ON vr.NED_ID = s.NED_ID
WHERE ev.Organization_Name = 'Google India';

SELECT 
    Request_ID,
    Qualification_ID,
    Consent_Status
FROM REQUESTED_QUALIFICATION
WHERE Consent_Status = 'Pending';

SELECT 
    User_Email,
    Action_Type,
    Table_Name,
    Timestamp
FROM AUDIT_LOG
ORDER BY Timestamp DESC
LIMIT 5;

