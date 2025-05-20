import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data loading and querying script...");

  try {
    let sqlString = ""; // Variable to hold SQL string for logging
    let insertResponse: number; // Variable to hold insert response

    // Section 1: User + Roles
    console.log("\\n--- Section 1: Inserting User + Roles ---");
    sqlString = `INSERT INTO "USER"("UserID", "E-Mail", "FName", "Minit", "LName","Password") VALUES ('USR_ADMIN', 'admin@example.com', 'Super', 'A', 'Admin','phash'), ('USR_STAFF1', 'staff1@example.com', 'John', 'D', 'Staff','phash'), ('USR_STAFF2', 'staff2@example.com', 'Jane', 'M', 'Driver','phash'), ('USR_STD1', 'student1@example.com', 'Alice', 'W', 'Wonder','phash'), ('USR_STD2', 'student2@example.com', 'Bob', 'B', 'Builder','phash');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);

    sqlString = `INSERT INTO "ADMIN" VALUES ('USR_ADMIN');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);

    sqlString = `INSERT INTO "STAFF" VALUES ('USR_STAFF1','USR_ADMIN'), ('USR_STAFF2','USR_ADMIN');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);

    sqlString = `INSERT INTO "STUDENT" VALUES ('USR_STD1','USR_ADMIN'), ('USR_STD2','USR_ADMIN');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("User + Roles data inserted.");

    // Section 2: Digital Card
    console.log("\\n--- Section 2: Inserting Digital Card Data ---");
    sqlString = `INSERT INTO "DIGITALCARD" ("SUserID","Card_NO","Balance") VALUES ('USR_STD1','CARD-ALICE-001',50), ('USR_STD2','CARD-BOB-002',25);`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("Digital Card data inserted.");

    // Section 3: Route
    console.log("\\n--- Section 3: Inserting Route Data ---");
    sqlString = `INSERT INTO "ROUTE"("Route_ID","RouteName") VALUES ('ROUTE_AAAAAAAA-1111-1111-1111-111111111111','Campus Loop');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);

    sqlString = `INSERT INTO "STATION"("Station_ID","Station_Name","Station_Latitude","Station_Longitude") VALUES ('STAT_A','Library',34.0522,-118.2437), ('STAT_B','Admin Bldg',34.0530,-118.2445);`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);

    sqlString = `INSERT INTO "HAS" VALUES ('ROUTE_AAAAAAAA-1111-1111-1111-111111111111','STAT_A',1), ('ROUTE_AAAAAAAA-1111-1111-1111-111111111111','STAT_B',2);`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("Route data inserted.");

    // Section 4: Food Data
    console.log("\\n--- Section 4: Inserting Food Data ---");
    sqlString = `INSERT INTO "DISH"("Dish_ID","Dish_Name","Calories") VALUES ('DISH_VEG','Vegan Burger',450);`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);

    sqlString = `INSERT INTO "MENU"("Menu_ID","Menu_Name","Price","MngUserID") VALUES ('MENU_001','Lunch Combo',12.99,'USR_STAFF1');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);

    sqlString = `INSERT INTO "PART_OF" VALUES ('MENU_001','DISH_VEG');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("Food data inserted.");

    // Section 5: Sales
    console.log("\\n--- Section 5: Inserting Sales Data ---");
    sqlString = `INSERT INTO "SALES" VALUES ('MENU_001',CURRENT_DATE,5);`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("Sales data inserted.");

    // Section 6: QR
    console.log("\\n--- Section 6: Inserting QR Data ---");
    const qrIdForInsert = randomUUID();
    sqlString = `INSERT INTO "QR" ("SUserID","Card_NO","QR_ID","Expired_Date","MMenu_ID") VALUES ('USR_STD1','CARD-ALICE-001','${qrIdForInsert}',now()+interval '1 day','MENU_001');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("QR data inserted.");

    // Section 7: Bus & Drive_in
    console.log("\\n--- Section 7: Inserting Bus & Drive_in Data ---");
    sqlString = `INSERT INTO "BUS"("Vehicle_ID") VALUES ('BUS_01');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);

    sqlString = `INSERT INTO "DRIVE_IN" VALUES ('BUS_01','ROUTE_AAAAAAAA-1111-1111-1111-111111111111');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("Bus & Drive_in data inserted.");

    // Section 8: Appointment
    console.log("\\n--- Section 8: Inserting Appointment Data ---");
    sqlString = `INSERT INTO "APPOINTMENT" ("Appointment_ID","SUserID","MNGStaffID","AppointmentDate") VALUES ('APPT_01','USR_STD2','USR_STAFF1',current_date+2);`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);

    sqlString = `INSERT INTO "SPORTAPPOINTMENT" VALUES ('APPT_01','Basketball','14:00','15:30');`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("Appointment data inserted.");

    // Section 9: Book
    console.log("\\n--- Section 9: Inserting Book Data ---");
    sqlString = `INSERT INTO "BOOK" VALUES ('ISBN123','SQL Basics','J.Doe',10,8);`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("Book data inserted.");

    // Section 10: BookAppointment
    console.log("\\n--- Section 10: Inserting Book Borrow Record Data ---");
    sqlString = `INSERT INTO "BOOKAPPOINTMENT" VALUES ('ISBN123','APPT_01',current_date+2,NULL,1);`;
    console.log("Executing SQL:", sqlString);
    insertResponse = await prisma.$executeRawUnsafe(sqlString);
    console.log("Response (rows affected):", insertResponse);
    console.log("BookAppointment/BorrowRecord data inserted.");

    console.log("\\n=======================================================");
    console.log("            Sample Queries Results                   ");
    console.log("=======================================================");

    // Query 1
    const query1SQL = `SELECT u."FName",u."LName" FROM "STUDENT" st JOIN "USER" u ON u."UserID"=st."UserID" WHERE st."MNGUserID"='USR_ADMIN';`;
    console.log("\\n1) Students managed by the Admin (USR_ADMIN):");
    console.log("Executing SQL:", query1SQL);
    const query1Result = await prisma.$queryRawUnsafe(query1SQL);
    console.log("Response:", query1Result);

    // Query 2
    const query2SQL = `SELECT m."Menu_Name", s."Num_Sold", s."Num_Sold"*m."Price" AS revenue FROM "SALES" s JOIN "MENU" m ON m."Menu_ID"=s."MMenu_ID" WHERE s."Date" = CURRENT_DATE;`;
    console.log("\\n2) Today's sales quantity and total revenue of a menu:");
    console.log("Executing SQL:", query2SQL);
    const query2Result = await prisma.$queryRawUnsafe(query2SQL);
    console.log("Response:", query2Result);

    // Query 3
    const query3SQL = `SELECT st."Station_Name", h."Order" FROM "HAS" h JOIN "STATION" st ON st."Station_ID"=h."Station_ID" WHERE h."Route_ID"='ROUTE_AAAAAAAA-1111-1111-1111-111111111111' ORDER BY h."Order";`;
    console.log("\\n3) Stop names and their order on the Campus Loop route:");
    console.log("Executing SQL:", query3SQL);
    const query3Result = await prisma.$queryRawUnsafe(query3SQL);
    console.log("Response:", query3Result);

    // Query 4
    const query4SQL = `SELECT "Title","CurrentQuantity","QuantityInStock" FROM "BOOK" WHERE "CurrentQuantity" < 0.2*"QuantityInStock";`;
    console.log("\\n4) Books with stock below 20%:");
    console.log("Executing SQL:", query4SQL);
    const query4Result = await prisma.$queryRawUnsafe(query4SQL);
    console.log("Response:", query4Result);

    // Query 5
    const query5SQL = `SELECT "QR_ID","Expired_Date" FROM "QR" WHERE "Expired_Date" > now();`;
    console.log("\\n5) Active (non-expired) QR codes:");
    console.log("Executing SQL:", query5SQL);
    const query5Result = await prisma.$queryRawUnsafe(query5SQL);
    console.log("Response:", query5Result);

    // Query 6
    const query6SQL = `SELECT a."Appointment_ID",a."AppointmentDate" FROM "APPOINTMENT" a WHERE a."SUserID" = 'USR_STD1' AND a."AppointmentDate" >= CURRENT_DATE;`;
    console.log("\\n6) All upcoming appointments of the student (USR_STD1):");
    console.log("Executing SQL:", query6SQL);
    const query6Result = await prisma.$queryRawUnsafe(query6SQL);
    console.log("Response:", query6Result);

    // Query 7
    const query7SQL = `SELECT m."Menu_Name" FROM "MENU" m WHERE m."MngUserID" = 'USR_STAFF1';`;
    console.log("\\n7) Menus managed by a staff member (USR_STAFF1):");
    console.log("Executing SQL:", query7SQL);
    const query7Result = await prisma.$queryRawUnsafe(query7SQL);
    console.log("Response:", query7Result);

    // Query 8
    const query8SQL = `SELECT r."RouteName", COUNT(l."UserID") AS viewer_count FROM "ROUTE" r LEFT JOIN "LOOKS" l ON l."Route_ID" = r."Route_ID" GROUP BY r."Route_ID",r."RouteName";`;
    console.log("\\n8) Number of users who looked at the routes:");
    console.log("Executing SQL:", query8SQL);
    const query8Result = await prisma.$queryRawUnsafe(query8SQL);
    console.log("Response:", query8Result);

    // Query 9
    const query9SQL = `SELECT u."FName",u."LName", COUNT(*) AS fav_cnt FROM "FAVORITE_ROUTES" f JOIN "USER" u ON u."UserID" = f."UserID" GROUP BY u."UserID",u."FName",u."LName" HAVING COUNT(*) > 1;`;
    console.log("\\n9) Users with more than one favorite route:");
    console.log("Executing SQL:", query9SQL);
    const query9Result = await prisma.$queryRawUnsafe(query9SQL);
    console.log("Response:", query9Result);

    // Query 10
    console.log("\n10) Today's upcoming departure times:");
    const query10SQL = `SELECT r."RouteName",rdt."DepartureTime" FROM "ROUTE_DEPARTURE_TIMES" rdt JOIN "ROUTE" r ON r."Route_ID"=rdt."Route_ID" WHERE rdt."DepartureTime"::date = CURRENT_DATE AND rdt."DepartureTime"::time > CURRENT_TIME::time ORDER BY rdt."DepartureTime";`;
    console.log("Executing SQL:", query10SQL);
    const query10Result = await prisma.$queryRawUnsafe(query10SQL);
    console.log("Response:", query10Result);
  } catch (error) {
    console.error("An error occurred during the script:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\\nScript finished. Prisma client disconnected.");
  }
}

main();
