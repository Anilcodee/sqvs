USE SQVS;

-- 1. Students with their qualifications
SELECT s.Student_Name, q.Degree_Name, q.Percentage
FROM STUDENT s
JOIN QUALIFICATION q ON s.NED_ID = q.NED_ID
ORDER BY q.Percentage DESC;

-- 2. Number of qualifications per student
SELECT s.Student_Name, COUNT(q.Qualification_ID) AS Total_Qualifications
FROM STUDENT s
LEFT JOIN QUALIFICATION q ON s.NED_ID = q.NED_ID
GROUP BY s.Student_Name;

-- 3. Verified qualifications with institution name
SELECT s.Student_Name, i.Institution_Name, q.Degree_Name, q.Percentage
FROM QUALIFICATION q
JOIN STUDENT s ON q.NED_ID = s.NED_ID
JOIN INSTITUTION i ON q.Institution_ID = i.Institution_ID
WHERE q.Status = 'Verified';

-- 4. Average percentage per institution
SELECT i.Institution_Name, ROUND(AVG(q.Percentage),2) AS Avg_Percentage
FROM INSTITUTION i
JOIN QUALIFICATION q ON i.Institution_ID = q.Institution_ID
GROUP BY i.Institution_Name;

-- 5. Students with percentage > 80
SELECT s.Student_Name, q.Percentage
FROM STUDENT s
JOIN QUALIFICATION q ON s.NED_ID = q.NED_ID
WHERE q.Percentage > 80;

-- 6. Count verified vs pending qualifications
SELECT Status, COUNT(*) AS Total
FROM QUALIFICATION
GROUP BY Status;

-- 7. Institutions with more than 2 qualifications
SELECT Institution_ID, COUNT(*) AS Total
FROM QUALIFICATION
GROUP BY Institution_ID
HAVING COUNT(*) > 2;

-- 8. Students who have no qualifications
SELECT s.Student_Name
FROM STUDENT s
LEFT JOIN QUALIFICATION q ON s.NED_ID = q.NED_ID
WHERE q.Qualification_ID IS NULL;

-- 9. Max percentage per student
SELECT s.Student_Name, MAX(q.Percentage) AS Max_Percentage
FROM STUDENT s
JOIN QUALIFICATION q ON s.NED_ID = q.NED_ID
GROUP BY s.Student_Name;

-- 10. Verification requests with student info
SELECT vr.Request_ID, s.Student_Name, vr.Status
FROM VERIFICATION_REQUEST vr
JOIN STUDENT s ON vr.NED_ID = s.NED_ID;

-- 11. Total qualifications per institution with name
SELECT i.Institution_Name, COUNT(q.Qualification_ID) AS Total_Qualifications
FROM INSTITUTION i
LEFT JOIN QUALIFICATION q ON i.Institution_ID = q.Institution_ID
GROUP BY i.Institution_Name;

-- 12. Average percentage of verified qualifications
SELECT ROUND(AVG(Percentage),2) AS Avg_Verified_Percentage
FROM QUALIFICATION
WHERE Status = 'Verified';

-- 13. Students with more than 1 qualification
SELECT s.Student_Name, COUNT(q.Qualification_ID) AS Total
FROM STUDENT s
JOIN QUALIFICATION q ON s.NED_ID = q.NED_ID
GROUP BY s.Student_Name
HAVING COUNT(q.Qualification_ID) > 1;

-- 14. Institutions in specific cities
SELECT Institution_Name, Location
FROM INSTITUTION
WHERE Location IN ('Delhi','Mumbai','Bangalore');

-- 15. Payment details with student name
SELECT pt.Transaction_ID, s.Student_Name, pt.Amount, pt.Payment_Status
FROM PAYMENT_TRANSACTION pt
JOIN VERIFICATION_REQUEST vr ON pt.Request_ID = vr.Request_ID
JOIN STUDENT s ON vr.NED_ID = s.NED_ID;