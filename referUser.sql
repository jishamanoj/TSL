DELIMITER $$

CREATE PROCEDURE referUs(
    IN newUserName VARCHAR(255),
    IN newSecondName VARCHAR(20),
    IN newDOB VARCHAR(20),
    IN newPhone VARCHAR(20),
    IN newEmail VARCHAR(100),
    IN newState VARCHAR(20),
    IN newDistrict VARCHAR(20),
    IN newUId varchar(20),
    IN newDOJ VARCHAR(20)
)
BEGIN
    DECLARE referrerUserID INT;
    DECLARE referrerLevel INT DEFAULT 0;
    DECLARE newNode INT;

    SELECT UserID, IFNULL(Level, 0) INTO referrerUserID, referrerLevel
    FROM Users AS Referrers
    WHERE NOT EXISTS (
        SELECT 1
        FROM Users AS Referrals
        WHERE Referrals.ReferrerID = Referrers.UserID
        HAVING COUNT(*) >= 3
    )
    ORDER BY UserID
    LIMIT 1 OFFSET 9; 

    -- Calculate newNode based on the total number of users in the same level
    SET newNode = IFNULL((SELECT COUNT(*) FROM Users WHERE Level = referrerLevel + 1), 0) + 1;

    INSERT INTO Users (
        firstName,
        secondName,
        DOB,
        phone,
        email,
        state,
        district,
        ReferrerID,
        Level,
        node_number,
        UId,
        DOJ
    ) VALUES (
        newUserName,
        newSecondName,
        newDOB,
        newPhone,
        newEmail,
        newState,
        newDistrict,
        referrerUserID,
        referrerLevel + 1,
        newNode,
        newUId,
        newDOJ
    );

    SELECT LAST_INSERT_ID() AS LastUserID;


END $$

DELIMITER ;