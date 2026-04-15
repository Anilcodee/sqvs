USE SQVS;

-- TRIGGER 1
-- Auto calculate Percentage in QUALIFICATION
DELIMITER $$
CREATE TRIGGER trg_calculate_percentage
BEFORE INSERT ON QUALIFICATION
FOR EACH ROW
BEGIN
    IF NEW.Total_Marks IS NOT NULL AND NEW.Marks_Obtained IS NOT NULL THEN
        SET NEW.Percentage = (NEW.Marks_Obtained / NEW.Total_Marks) * 100;
    END IF;
END$$
DELIMITER ;

-- TRIGGER 2
-- Auto update verification request when certificate issued
DELIMITER $$
CREATE TRIGGER trg_complete_request
AFTER INSERT ON VERIFICATION_CERTIFICATE
FOR EACH ROW
BEGIN
    UPDATE VERIFICATION_REQUEST
    SET Status = 'Completed',
        Completion_Date = CURRENT_DATE
    WHERE Request_ID = NEW.Request_ID;
END$$
DELIMITER ;

-- TRIGGER 3
-- Auto move request to IN_PROGRESS when payment completed
DELIMITER $$
CREATE TRIGGER trg_payment_update_request
AFTER UPDATE ON PAYMENT_TRANSACTION
FOR EACH ROW
BEGIN
    IF NEW.Payment_Status = 'Completed' THEN
        UPDATE VERIFICATION_REQUEST
        SET Status = 'In_Progress'
        WHERE Request_ID = NEW.Request_ID
        AND Status = 'Pending';
    END IF;
END$$
DELIMITER ;

-- TRIGGER 4
-- Automatically set verification date when qualification verified
DELIMITER $$
CREATE TRIGGER trg_set_verification_date
BEFORE UPDATE ON QUALIFICATION
FOR EACH ROW
BEGIN
    IF NEW.Status = 'Verified' AND OLD.Status != 'Verified' THEN
        SET NEW.Verification_Date = CURRENT_DATE;
    END IF;
END$$
DELIMITER ;

-- TRIGGER 5
-- Audit log for updates on STUDENT table
DELIMITER $$
CREATE TRIGGER trg_student_audit_update
AFTER UPDATE ON STUDENT
FOR EACH ROW
BEGIN
    INSERT INTO AUDIT_LOG
    (User_Email, Action_Type, Table_Name, Record_ID, Old_Value, New_Value, IP_Address)
    VALUES
    (
        NEW.Email,
        'UPDATE',
        'STUDENT',
        NEW.NED_ID,
        CONCAT('Name:', OLD.Student_Name, ', Phone:', OLD.Phone),
        CONCAT('Name:', NEW.Student_Name, ', Phone:', NEW.Phone),
        'SYSTEM'
    );
END$$
DELIMITER ;

-- TRIGGER 6
-- Conflict of Interest Guard: Prevent staff from verifying own entries
DELIMITER $$
CREATE TRIGGER trg_guard_conflict_of_interest
BEFORE UPDATE ON QUALIFICATION
FOR EACH ROW
BEGIN
    IF NEW.Status = 'Verified' AND NEW.Verified_By = NEW.Entered_By THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Conflict of Interest: Staff member cannot verify a record they entered themselves.';
    END IF;
END$$
DELIMITER ;

-- TRIGGER 7
-- Reject request if student denies consent
DELIMITER $$
CREATE TRIGGER trg_handle_consent_denial
AFTER UPDATE ON REQUESTED_QUALIFICATION
FOR EACH ROW
BEGIN
    IF NEW.Consent_Status = 'Denied' AND OLD.Consent_Status != 'Denied' THEN
        UPDATE VERIFICATION_REQUEST
        SET Status = 'Rejected'
        WHERE Request_ID = NEW.Request_ID;
    END IF;
END$$
DELIMITER ;

-- TRIGGER 8
-- Prevent duplicate active verification requests (Pending/In_Progress)
DELIMITER $$
CREATE TRIGGER TRG_CheckActiveRequest
BEFORE INSERT ON VERIFICATION_REQUEST
FOR EACH ROW
BEGIN
    DECLARE active_count INT;
    
    -- Check if an active request already exists for the same student-verifier-purpose combo
    SELECT COUNT(*) INTO active_count 
    FROM VERIFICATION_REQUEST 
    WHERE NED_ID = NEW.NED_ID 
      AND Verifier_ID = NEW.Verifier_ID 
      AND Purpose = NEW.Purpose 
      AND Status IN ('Pending', 'In_Progress');
      
    IF active_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ACTIVE_REQUEST_EXISTS: An active verification request for this student already exists.';
    END IF;
END$$
DELIMITER ;

-- EVENT
-- Automatic Expiry: Mark requests as Expired after 30 days
SET GLOBAL event_scheduler = ON;

DELIMITER $$
CREATE EVENT IF NOT EXISTS evt_expire_verification_requests
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    UPDATE VERIFICATION_REQUEST
    SET Status = 'Expired'
    WHERE Status = 'Pending'
    AND Expiry_Date < CURRENT_DATE;
END$$
DELIMITER ;