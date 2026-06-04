# Database Transaction Experiments for SQVS

This document explains the specific database transactions that will be executed to demonstrate atomic operations and concurrency control in the Student Qualification Verification System (SQVS).

## 1. Successful Transaction (COMMIT)
**Goal**: Demonstrate how multiple related operations succeed together.
- **Scenario**: A new external verifier (e.g., 'Amazon') submits a verification request for a student. A payment record must also be created.
- **SQL Operations**:
  ```sql
  START TRANSACTION;
  INSERT INTO VERIFICATION_REQUEST (...) VALUES (...);
  INSERT INTO PAYMENT_TRANSACTION (...) VALUES (LAST_INSERT_ID(), ...);
  COMMIT;
  ```
- **Effect**: Both the request and payment are permanently saved.

## 2. Failed Transaction (ROLLBACK)
**Goal**: Demonstrate how a failure in one operation rolls back all operations in the same transaction.
- **Scenario**: A ministry official tries to mark a request as 'Completed' and issue a certificate. However, the certificate number is a duplicate (triggering a unique constraint error).
- **SQL Operations**:
  ```sql
  START TRANSACTION;
  UPDATE VERIFICATION_REQUEST SET Status = 'Completed' WHERE Request_ID = 5;
  -- This will fail due to duplicate Certificate_Number
  INSERT INTO VERIFICATION_CERTIFICATE (Request_ID, Certificate_Number, ...) VALUES (5, 'EXISTING-CERT-123', ...);
  ROLLBACK; -- (Triggered by failure)
  ```
- **Effect**: The `VERIFICATION_REQUEST` status remains unchanged.

## 3. Row-Level Locking (Blocking)
**Goal**: Show how `FOR UPDATE` prevents race conditions.
- **Scenario**: Two officials try to process the same request (#17) simultaneously.
- **Operations**:
  - **Session A**: `SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 17 FOR UPDATE;`
  - **Session B**: `SELECT * FROM VERIFICATION_REQUEST WHERE Request_ID = 17 FOR UPDATE;`
- **Effect**: Session B will hang (wait) until Session A commits or rolls back.

## 4. Deadlock Scenario
**Goal**: Demonstrate MySQL's ability to detect and resolve circular dependencies.
- **Scenario**:
  - **Session A**: Updates Request #19, then tries to update Request #20.
  - **Session B**: Updates Request #20, then tries to update Request #19.
- **Effect**: MySQL will detect a deadlock and return an error: `Deadlock found when trying to get lock`. One transaction will be rolled back.

## 5. Isolation Level: Dirty Read (READ UNCOMMITTED)
**Goal**: Show the risks of low isolation levels.
- **Scenario**:
  - **Session A**: Updates a payment to 'Completed' but does *not* commit.
  - **Session B**: Reads the payment status under `READ UNCOMMITTED`.
- **Effect**: Session B sees 'Completed'. Then Session A rolls back. Session B has read "dirty" data that never really existed.

## 6. Isolation Level: Non-Repeatable Read (READ COMMITTED)
**Goal**: Show how data can change midway through a transaction.
- **Scenario**:
  - **Session B**: Reads a request status.
  - **Session A**: Updates and *commits* that request status.
  - **Session B**: Reads the same request again.
- **Effect**: Session B sees two different values for the same row within a single transaction.
