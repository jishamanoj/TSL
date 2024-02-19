
DELIMITER $$

CREATE PROCEDURE GetReferrerTreeWithCorrection(

    IN targetUserID INT
)
BEGIN
    SELECT
        U1.UserID AS Sam,
        U2.UserID AS Sam_Referrer,
        U3.UserID AS Level_2_Referrer,
        U4.UserID AS Level_3_Referrer,
        U5.UserID AS Level_4_Referrer,
        U6.UserID AS Level_5_Referrer,
        U7.UserID AS Level_6_Referrer,
        U8.UserID AS Level_7_Referrer,
        U9.UserID AS Level_8_Referrer,
        U10.UserID AS Level_9_Referrer,
        1 AS First_ID, -- Hardcoded first user ID
        2 AS HierarchyLevel  -- Assuming the hierarchy starts at level 2
    FROM Users AS U1
    LEFT JOIN Users AS U2 ON U1.ReferrerID = U2.UserID
    LEFT JOIN Users AS U3 ON U2.ReferrerID = U3.UserID
    LEFT JOIN Users AS U4 ON U3.ReferrerID = U4.UserID
    LEFT JOIN Users AS U5 ON U4.ReferrerID = U5.UserID
    LEFT JOIN Users AS U6 ON U5.ReferrerID = U6.UserID
    LEFT JOIN Users AS U7 ON U6.ReferrerID = U7.UserID
    LEFT JOIN Users AS U8 ON U7.ReferrerID = U8.UserID
    LEFT JOIN Users AS U9 ON U8.ReferrerID = U9.UserID
    LEFT JOIN Users AS U10 ON U9.ReferrerID = U10.UserID
    WHERE U1.UserID = targetUserID;

END $$

DELIMITER ;