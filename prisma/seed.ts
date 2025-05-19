import { PrismaClient, Prisma, AppointmentStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid"; // For generating UUIDs where needed

const prisma = new PrismaClient();

// Helper function to get a random element from an array
function getRandomElement<T>(arr: T[]): T | undefined {
  // Added undefined for safety
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to generate a random number in a range
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random dates
function randomDate(start: Date, end: Date): Date {
  if (start.getTime() >= end.getTime()) {
    // Ensure start is before end
    const newEndDate = new Date(start.getTime());
    newEndDate.setDate(start.getDate() + getRandomNumber(1, 7)); // Add 1 to 7 days
    return new Date(
      start.getTime() + Math.random() * (newEndDate.getTime() - start.getTime())
    );
  }
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

// Helper function to generate random future dates (e.g., for appointments, QR expiry)
function randomFutureDate(daysAheadMin: number, daysAheadMax: number): Date {
  const today = new Date();
  const randomDays = getRandomNumber(daysAheadMin, daysAheadMax);
  const futureDate = new Date(today); // Clone today's date
  futureDate.setDate(today.getDate() + randomDays);
  return futureDate;
}

// Helper function to generate random past dates (e.g., for sales)
function randomPastDate(daysPastMin: number, daysPastMax: number): Date {
  const today = new Date();
  const randomDays = getRandomNumber(daysPastMin, daysPastMax);
  const pastDate = new Date(today); // Clone today's date
  pastDate.setDate(today.getDate() - randomDays);
  return pastDate;
}

// Helper function to generate random time strings (HH:MM:SS)
function randomTimeString(): string {
  const hours = getRandomNumber(0, 23).toString().padStart(2, "0");
  const minutes = getRandomNumber(0, 59).toString().padStart(2, "0");
  const seconds = getRandomNumber(0, 59).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// Helper function to generate a DateTime object from a date and a time string (HH:MM:SS)
function createDateTime(date: Date, timeString: string): Date {
  const [hoursStr, minutesStr, secondsStr] = timeString.split(":");
  const hours = Number.parseInt(hoursStr || "0", 10); // Add default for parseInt
  const minutes = Number.parseInt(minutesStr || "0", 10); // Add default for parseInt
  const seconds = Number.parseInt(secondsStr || "0", 10); // Add default for parseInt
  const newDate = new Date(date); // Clone the date part
  newDate.setHours(hours || 0, minutes || 0, seconds || 0, 0); // Set time part, default to 0 if NaN
  return newDate;
}

// Helper function to add hours to a Date object
function addHoursToDate(date: Date, hours: number): Date {
  const newDate = new Date(date.getTime());
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
}

const firstNames = [
  "Liam",
  "Olivia",
  "Noah",
  "Emma",
  "Oliver",
  "Ava",
  "Elijah",
  "Charlotte",
  "William",
  "Sophia",
  "James",
  "Amelia",
  "Benjamin",
  "Isabella",
  "Lucas",
  "Mia",
  "Henry",
  "Evelyn",
  "Alexander",
  "Harper",
];
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Martin",
  "Jackson",
];
const dishNames = [
  "Spaghetti Carbonara",
  "Margherita Pizza",
  "Caesar Salad",
  "Beef Tacos",
  "Chicken Alfredo",
  "Sushi Platter",
  "Vegan Chili",
  "Pad Thai",
  "Grilled Salmon",
  "Chocolate Lava Cake",
  "Apple Pie",
  "Cheeseburger",
  "Veggie Wrap",
  "Clam Chowder",
  "Steak Frites",
];
const routeNames = [
  "Downtown Express",
  "University Connector",
  "Crosstown Shuttle",
  "Airport Link",
  "Beachcomber",
  "Mountain View",
  "Riverside Runner",
  "Historic Old Town Tour",
  "Tech Park Circulator",
  "Mall Hopper",
];
const stationNames = [
  "Central Station",
  "University Hub",
  "City Hall",
  "Market Street",
  "North Transfer Point",
  "South Plaza",
  "West End",
  "Eastgate Terminal",
  "Parkside",
  "Lakeside Stop",
  "Airport Terminal A",
  "Beachfront North",
  "Foothills Trailhead",
  "Old Town Square",
];
const bookTitles = [
  "The Great Gatsby",
  "To Kill a Mockingbird",
  "1984",
  "Pride and Prejudice",
  "The Catcher in the Rye",
  "Brave New World",
  "The Lord of the Rings",
  "Harry Potter and the Sorcerer's Stone",
  "The Hobbit",
  "Fahrenheit 451",
  "Moby Dick",
  "War and Peace",
  "Crime and Punishment",
  "The Odyssey",
  "The Iliad",
];
const sportTypes = [
  "Basketball",
  "Soccer",
  "Tennis",
  "Volleyball",
  "Swimming",
  "Badminton",
  "Table Tennis",
  "Yoga",
];
const healthTypes = [
  "General Check-up",
  "Dental Cleaning",
  "Eye Exam",
  "Physiotherapy",
  "Counseling Session",
];

async function main() {
  console.log("Start seeding ...");

  await prisma.bookBorrowRecord
    .deleteMany()
    .catch((e) =>
      console.log("No BookBorrowRecords to delete or error:", e.message)
    );
  await prisma.sportAppointment
    .deleteMany()
    .catch((e) =>
      console.log("No SportAppointments to delete or error:", e.message)
    );
  await prisma.healthAppointment
    .deleteMany()
    .catch((e) =>
      console.log("No HealthAppointments to delete or error:", e.message)
    );
  await prisma.appointment
    .deleteMany()
    .catch((e) =>
      console.log("No Appointments to delete or error:", e.message)
    );
  await prisma.qRCode
    .deleteMany()
    .catch((e) => console.log("No QRCodes to delete or error:", e.message));
  await prisma.sale
    .deleteMany()
    .catch((e) => console.log("No Sales to delete or error:", e.message));
  await prisma.menuDish
    .deleteMany()
    .catch((e) => console.log("No MenuDishes to delete or error:", e.message));
  await prisma.menu
    .deleteMany()
    .catch((e) => console.log("No Menus to delete or error:", e.message));
  await prisma.dish
    .deleteMany()
    .catch((e) => console.log("No Dishes to delete or error:", e.message));
  await prisma.busDrivesRoute
    .deleteMany()
    .catch((e) =>
      console.log("No BusDrivesRoutes to delete or error:", e.message)
    );
  await prisma.bus
    .deleteMany()
    .catch((e) => console.log("No Buses to delete or error:", e.message));
  await prisma.routeStation
    .deleteMany()
    .catch((e) =>
      console.log("No RouteStations to delete or error:", e.message)
    );
  await prisma.station
    .deleteMany()
    .catch((e) => console.log("No Stations to delete or error:", e.message));
  await prisma.userFavoriteRoute
    .deleteMany()
    .catch((e) =>
      console.log("No UserFavoriteRoutes to delete or error:", e.message)
    );
  await prisma.staffManagesRoute
    .deleteMany()
    .catch((e) =>
      console.log("No StaffManagesRoutes to delete or error:", e.message)
    );
  await prisma.userLooksAtRoute
    .deleteMany()
    .catch((e) =>
      console.log("No UserLooksAtRoutes to delete or error:", e.message)
    );
  await prisma.routeDepartureTime
    .deleteMany()
    .catch((e) =>
      console.log("No RouteDepartureTimes to delete or error:", e.message)
    );
  await prisma.route
    .deleteMany()
    .catch((e) => console.log("No Routes to delete or error:", e.message));
  await prisma.digitalCard
    .deleteMany()
    .catch((e) =>
      console.log("No DigitalCards to delete or error:", e.message)
    );
  await prisma.admin
    .deleteMany()
    .catch((e) => console.log("No Admins to delete or error:", e.message));
  await prisma.staff
    .deleteMany()
    .catch((e) => console.log("No Staff to delete or error:", e.message));
  await prisma.student
    .deleteMany()
    .catch((e) => console.log("No Students to delete or error:", e.message));
  await prisma.account
    .deleteMany()
    .catch((e) => console.log("No Accounts to delete or error:", e.message));
  await prisma.session
    .deleteMany()
    .catch((e) => console.log("No Sessions to delete or error:", e.message));
  await prisma.user
    .deleteMany()
    .catch((e) => console.log("No Users to delete or error:", e.message));
  await prisma.book
    .deleteMany()
    .catch((e) => console.log("No Books to delete or error:", e.message));
  console.log("Cleanup finished.");

  const usersToCreateInput: Prisma.UserCreateInput[] = [];
  const adminUserId = "USR_ADMIN";
  const staffUserIds = [
    "USR_STAFF1",
    "USR_STAFF2",
    "USR_STAFF3_GEN",
    "USR_STAFF4_GEN",
  ];
  const studentUserIdsSeed = [
    "USR_STD1",
    "USR_STD2",
    "USR_STD3_GEN",
    "USR_STD4_GEN",
    "USR_STD5_GEN",
  ];

  usersToCreateInput.push({
    id: adminUserId,
    fName: "Super",
    lName: "Admin",
    email: "super.admin@example.com",
    password: "phash",
    phoneNumber: "111-000-0000",
  });
  usersToCreateInput.push({
    id: staffUserIds[0],
    fName: "John",
    lName: "Staff",
    email: "john.staff@example.com",
    password: "phash",
    phoneNumber: "111-111-0001",
  });
  usersToCreateInput.push({
    id: staffUserIds[1],
    fName: "Jane",
    lName: "Driver",
    email: "jane.driver@example.com",
    password: "phash",
    phoneNumber: "111-111-0002",
  });
  usersToCreateInput.push({
    id: studentUserIdsSeed[0],
    fName: "Alice",
    lName: "Wonder",
    email: "alice.wonder@example.com",
    password: "phash",
    phoneNumber: "222-000-0001",
  });
  usersToCreateInput.push({
    id: studentUserIdsSeed[1],
    fName: "Bob",
    lName: "Builder",
    email: "bob.builder@example.com",
    password: "phash",
    phoneNumber: "222-000-0002",
  });

  for (let i = 2; i < staffUserIds.length; i++) {
    const fName = getRandomElement(firstNames) ?? "DefaultFName";
    const lName = getRandomElement(lastNames) ?? "DefaultLName";
    const staffId = staffUserIds[i];
    if (!staffId) {
      console.warn(`staffUserIds[${i}] is undefined. Skipping user creation.`);
      continue;
    }
    usersToCreateInput.push({
      id: staffId,
      fName,
      lName,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@staff.example.com`,
      password: "phash",
      phoneNumber: `111-111-${(i + 1).toString().padStart(4, "0")}`,
    });
  }
  for (let i = 2; i < studentUserIdsSeed.length; i++) {
    const fName = getRandomElement(firstNames) ?? "DefaultFName";
    const lName = getRandomElement(lastNames) ?? "DefaultLName";
    const studentId = studentUserIdsSeed[i];
    if (!studentId) {
      console.warn(
        `studentUserIdsSeed[${i}] is undefined. Skipping user creation.`
      );
      continue;
    }
    usersToCreateInput.push({
      id: studentId,
      fName,
      lName,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@student.example.com`,
      password: "phash",
      phoneNumber: `222-000-${(i + 1).toString().padStart(4, "0")}`,
    });
  }

  const createdUserIds: string[] = [];
  const tempStudentIdsForLater: string[] = [...studentUserIdsSeed]; // Track all potential student IDs

  for (let i = 0; i < 20; i++) {
    const fName = getRandomElement(firstNames) ?? "DefaultFName";
    const lName = getRandomElement(lastNames) ?? "DefaultLName";
    const generatedId = `USR_GEN_${uuidv4().substring(0, 8)}`;
    usersToCreateInput.push({
      id: generatedId,
      fName,
      lName,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}.${i}@example.com`,
      password: "phash",
      phoneNumber: `555-${getRandomNumber(100, 999)}-${getRandomNumber(
        1000,
        9999
      )}`,
    });
    tempStudentIdsForLater.push(generatedId);
  }

  for (const userData of usersToCreateInput) {
    await prisma.user
      .create({ data: userData })
      .then((u) => createdUserIds.push(u.id))
      .catch((e) =>
        console.error(`Failed to create user ${userData.id}: ${e.message}`)
      );
  }
  console.log(`Created ${createdUserIds.length} users`);

  // Filter staff and student IDs to only those successfully created as Users
  const validStaffUserIds = staffUserIds.filter((id) =>
    createdUserIds.includes(id)
  );
  const validStudentUserIds = tempStudentIdsForLater.filter((id) =>
    createdUserIds.includes(id)
  );

  if (createdUserIds.includes(adminUserId)) {
    await prisma.admin
      .create({ data: { userId: adminUserId } })
      .catch((e) =>
        console.error(`Failed to create admin for ${adminUserId}: ${e.message}`)
      );
    console.log(`Created admin role for ${adminUserId}`);
  } else {
    console.warn(
      `Admin user ${adminUserId} was not created. Skipping admin role creation.`
    );
  }

  for (const staffId of validStaffUserIds) {
    await prisma.staff
      .create({
        data: {
          userId: staffId,
          managingAdminId: createdUserIds.includes(adminUserId)
            ? adminUserId
            : undefined,
        },
      })
      .catch((e) =>
        console.error(`Failed to create staff for ${staffId}: ${e.message}`)
      );
  }
  console.log(`Created ${validStaffUserIds.length} staff roles`);

  for (const studentId of validStudentUserIds) {
    await prisma.student
      .create({
        data: {
          userId: studentId,
          managingAdminId: createdUserIds.includes(adminUserId)
            ? adminUserId
            : undefined,
        },
      })
      .catch((e) =>
        console.error(`Failed to create student for ${studentId}: ${e.message}`)
      );
  }
  console.log(`Created ${validStudentUserIds.length} student roles`);

  const digitalCards: Prisma.DigitalCardCreateInput[] = [];
  const studentUsers = await prisma.student.findMany(); // Fetch students who were successfully created

  for (let i = 0; i < studentUsers.length; i++) {
    const student = studentUsers[i];
    if (!student || !student.userId) {
      console.error(
        `Student user or userId not found at index ${i}, skipping digital card creation.`
      );
      continue;
    }

    const randomStaffIssuer = getRandomElement(validStaffUserIds);
    if (!randomStaffIssuer) {
      console.warn(
        `No valid staff user available to issue digital card for student ${student.userId}. Skipping.`
      );
      continue;
    }

    digitalCards.push({
      student: { connect: { userId: student.userId } },
      cardNo: `CARD-${student.userId
        .replace("USR_", "")
        .toUpperCase()}-${String(i).padStart(3, "0")}`,
      balance: new Prisma.Decimal(getRandomNumber(5, 200)),
      depositMoneyAmount: new Prisma.Decimal(getRandomNumber(0, 50)),
      issuedByStaff: { connect: { userId: randomStaffIssuer } },
      cardCreationDate: randomPastDate(10, 365),
    });
  }
  for (const cardData of digitalCards) {
    // cardData is of type Prisma.DigitalCardCreateInput
    await prisma.digitalCard
      .create({ data: cardData })
      .catch((e) =>
        console.error(
          `Failed to create digital card for ${
            cardData.student?.connect?.userId ?? "UNKNOWN_STUDENT"
          }: ${e.message}`
        )
      );
  }
  console.log(`Created ${digitalCards.length} digital cards`);

  const routes: Prisma.RouteCreateInput[] = [];
  const routeIdMap = new Map<string, string>();
  const campusLoopRouteName = "Campus Loop";
  routes.push({
    routeId: uuidv4(),
    routeName: campusLoopRouteName,
  });
  for (let i = 0; i < 5; i++) {
    const name = getRandomElement(
      routeNames.filter(
        (rn) =>
          rn !== campusLoopRouteName && !routes.some((r) => r.routeName === rn)
      )
    );
    if (name) routes.push({ routeId: uuidv4(), routeName: name });
  }
  const createdRoutes: Prisma.RouteGetPayload<null>[] = [];
  for (const routeData of routes) {
    await prisma.route
      .create({ data: routeData })
      .then((newRoute) => {
        createdRoutes.push(newRoute);
        if (newRoute.routeName)
          routeIdMap.set(newRoute.routeName, newRoute.routeId);
      })
      .catch((e) =>
        console.error(
          `Failed to create route ${
            routeData.routeName || routeData.routeId
          }: ${e.message}`
        )
      );
  }
  console.log(`Created ${createdRoutes.length} routes`);

  const stations: Prisma.StationCreateInput[] = [];
  stations.push({
    stationId: uuidv4(),
    stationName: "Library",
    stationLatitude: new Prisma.Decimal("34.052200"),
    stationLongitude: new Prisma.Decimal("-118.243700"),
  });
  stations.push({
    stationId: uuidv4(),
    stationName: "Admin Bldg",
    stationLatitude: new Prisma.Decimal("34.053000"),
    stationLongitude: new Prisma.Decimal("-118.244500"),
  });
  for (let i = 0; i < 15; i++) {
    const name = getRandomElement(
      stationNames.filter((sn) => !stations.some((s) => s.stationName === sn))
    );
    if (name)
      stations.push({
        stationId: uuidv4(),
        stationName: name,
        stationLatitude: new Prisma.Decimal(
          getRandomNumber(34000000, 35000000) / 1000000
        ),
        stationLongitude: new Prisma.Decimal(
          getRandomNumber(-118000000, -119000000) / 1000000
        ),
      });
  }
  const createdStations: Prisma.StationGetPayload<null>[] = [];
  for (const stationData of stations) {
    await prisma.station
      .create({ data: stationData })
      .then((newStation) => createdStations.push(newStation))
      .catch((e) =>
        console.error(
          `Failed to create station ${
            stationData.stationName || stationData.stationId
          }: ${e.message}`
        )
      );
  }
  console.log(`Created ${createdStations.length} stations`);

  const routeStations: Prisma.RouteStationCreateInput[] = [];
  const campusLoopRouteId = routeIdMap.get(campusLoopRouteName);
  if (campusLoopRouteId) {
    if (createdStations.find((s) => s.stationId === "STAT_A"))
      routeStations.push({
        route: { connect: { routeId: campusLoopRouteId } },
        station: { connect: { stationId: "STAT_A" } },
        stopOrder: 1,
      });
    if (createdStations.find((s) => s.stationId === "STAT_B"))
      routeStations.push({
        route: { connect: { routeId: campusLoopRouteId } },
        station: { connect: { stationId: "STAT_B" } },
        stopOrder: 2,
      });
  } else {
    console.warn(
      `Campus Loop route ID not found using name "${campusLoopRouteName}", skipping specific route-station links for it.`
    );
  }
  for (const route of createdRoutes) {
    const numStops = getRandomNumber(2, 5);
    const availableStations = [...createdStations];
    for (let i = 0; i < numStops && availableStations.length > 0; i++) {
      const station = getRandomElement(availableStations);
      if (!station) continue;
      availableStations.splice(availableStations.indexOf(station), 1);
      if (
        !routeStations.some(
          (rs) =>
            rs.route?.connect?.routeId === route.routeId &&
            rs.station?.connect?.stationId === station.stationId
        ) &&
        !routeStations.some(
          (rs) =>
            rs.route?.connect?.routeId === route.routeId &&
            rs.stopOrder === i + 1
        )
      ) {
        routeStations.push({
          route: { connect: { routeId: route.routeId } },
          station: { connect: { stationId: station.stationId } },
          stopOrder: i + 1,
        });
      }
    }
  }
  for (const rsData of routeStations) {
    const existing = await prisma.routeStation.findUnique({
      where: {
        routeId_stationId: {
          routeId: rsData.route!.connect!.routeId!,
          stationId: rsData.station!.connect!.stationId!,
        },
      },
    });
    if (!existing)
      await prisma.routeStation
        .create({ data: rsData })
        .catch((e) =>
          console.error(
            `Error creating RouteStation ${rsData.route!.connect!.routeId}-${
              rsData.station!.connect!.stationId
            }: ${e.message}`
          )
        );
  }
  console.log(`Created ${routeStations.length} route-station links`);

  const dishes: Prisma.DishCreateInput[] = [];
  dishes.push({ dishId: uuidv4(), dishName: "Vegan Burger", calories: 450 });
  for (let i = 0; i < 20; i++) {
    const name = getRandomElement(
      dishNames.filter((dn) => !dishes.some((d) => d.dishName === dn))
    );
    if (name)
      dishes.push({
        dishId: uuidv4(),
        dishName: name,
        calories: getRandomNumber(200, 1200),
      });
  }
  const createdDishes: Prisma.DishGetPayload<null>[] = [];
  for (const dishData of dishes) {
    await prisma.dish
      .create({ data: dishData })
      .then((newDish) => createdDishes.push(newDish))
      .catch((e) =>
        console.error(
          `Failed to create dish ${dishData.dishName || dishData.dishId}: ${
            e.message
          }`
        )
      );
  }
  console.log(`Created ${createdDishes.length} dishes`);

  const menus: Prisma.MenuCreateInput[] = [];
  const dishVeg = createdDishes.find((d) => d.dishId === "DISH_VEG");

  if (validStaffUserIds.length > 0) {
    const staffForMenu001 = validStaffUserIds.includes(staffUserIds[0]!)
      ? staffUserIds[0]!
      : getRandomElement(validStaffUserIds);
    if (staffForMenu001) {
      menus.push({
        menuId: "MENU_001_UUID",
        menuName: "Lunch Combo",
        price: new Prisma.Decimal("12.99"),
        managedByStaff: { connect: { userId: staffForMenu001 } },
      });
    } else {
      console.warn(
        "Could not assign staff for MENU_001, skipping its creation."
      );
    }
    for (let i = 0; i < 10; i++) {
      const randomStaffForMenu = getRandomElement(validStaffUserIds);
      if (randomStaffForMenu) {
        menus.push({
          menuId: uuidv4(),
          menuName: `${
            getRandomElement([
              "Daily",
              "Weekly",
              "Special",
              "Breakfast",
              "Lunch",
              "Dinner",
            ]) ?? "Default"
          } Menu ${i + 1}`,
          price: new Prisma.Decimal(getRandomNumber(599, 2999) / 100),
          managedByStaff: { connect: { userId: randomStaffForMenu } },
        });
      }
    }
  } else {
    console.warn(
      "No valid staff users found to manage menus. Limited menu creation."
    );
  }
  const createdMenus: Prisma.MenuGetPayload<null>[] = [];
  for (const menuData of menus) {
    await prisma.menu
      .create({ data: menuData })
      .then((newMenu) => createdMenus.push(newMenu))
      .catch((e) =>
        console.error(
          `Failed to create menu ${menuData.menuName || menuData.menuId}: ${
            e.message
          }`
        )
      );
  }
  console.log(`Created ${createdMenus.length} menus`);

  const menuDishes: Prisma.MenuDishCreateInput[] = [];
  const menu001 = createdMenus.find((m) => m.menuName === "Lunch Combo");
  if (menu001 && dishVeg) {
    menuDishes.push({
      menu: { connect: { menuId: menu001.menuId } },
      dish: { connect: { dishId: dishVeg.dishId } },
    });
  }
  for (const menu of createdMenus) {
    const numDishes = getRandomNumber(1, 5);
    const availableDishes = [...createdDishes];
    for (let i = 0; i < numDishes && availableDishes.length > 0; i++) {
      const dish = getRandomElement(availableDishes);
      if (!dish) continue;
      availableDishes.splice(availableDishes.indexOf(dish), 1);
      if (
        !menuDishes.some(
          (md) =>
            md.menu?.connect?.menuId === menu.menuId &&
            md.dish?.connect?.dishId === dish.dishId
        )
      ) {
        menuDishes.push({
          menu: { connect: { menuId: menu.menuId } },
          dish: { connect: { dishId: dish.dishId } },
        });
      }
    }
  }
  for (const mdData of menuDishes) {
    const existing = await prisma.menuDish.findUnique({
      where: {
        menuId_dishId: {
          menuId: mdData.menu!.connect!.menuId!,
          dishId: mdData.dish!.connect!.dishId!,
        },
      },
    });
    if (!existing)
      await prisma.menuDish
        .create({ data: mdData })
        .catch((e) =>
          console.error(
            `Error creating MenuDish ${mdData.menu!.connect!.menuId}-${
              mdData.dish!.connect!.dishId
            }: ${e.message}`
          )
        );
  }
  console.log(`Created ${menuDishes.length} menu-dish links`);

  const sales: Prisma.SaleCreateInput[] = [];
  if (menu001) {
    sales.push({
      menu: { connect: { menuId: menu001.menuId } },
      saleDate: new Date(),
      numSold: 5,
    });
  }
  for (const menu of createdMenus) {
    for (let i = 0; i < getRandomNumber(5, 30); i++) {
      sales.push({
        menu: { connect: { menuId: menu.menuId } },
        saleDate: randomPastDate(1, 90),
        numSold: getRandomNumber(1, 50),
      });
    }
  }
  for (const saleData of sales) {
    const existing = await prisma.sale.findUnique({
      where: {
        menuId_saleDate: {
          menuId: saleData.menu!.connect!.menuId!,
          saleDate: saleData.saleDate,
        },
      },
    });
    if (!existing)
      await prisma.sale
        .create({ data: saleData })
        .catch((e) =>
          console.warn(
            `Skipping duplicate sale for ${saleData.menu!.connect!
              .menuId!} on ${(saleData.saleDate as Date).toISOString()}: ${
              e.message
            }`
          )
        );
    else if (
      saleData.menu?.connect?.menuId === menu001?.menuId &&
      (existing.saleDate as Date).getTime() ===
        (saleData.saleDate as Date).getTime()
    ) {
      await prisma.sale.update({
        where: {
          menuId_saleDate: {
            menuId: saleData.menu!.connect!.menuId!,
            saleDate: saleData.saleDate,
          },
        },
        data: { numSold: saleData.numSold },
      });
    }
  }
  console.log(`Created/updated ${sales.length} sales records`);

  const qrCodes: Prisma.QRCodeCreateInput[] = [];
  const fetchedStudentDigitalCards = await prisma.digitalCard.findMany();
  if (fetchedStudentDigitalCards.length > 0 && createdMenus.length > 0) {
    const specificStudentIdForQR = studentUserIdsSeed[0];
    const specificStudentCardForQR = fetchedStudentDigitalCards.find(
      (dc) => dc.userId === specificStudentIdForQR
    );
    const menuForSpecificQR = createdMenus.find(
      (m) => m.menuName === "Lunch Combo"
    );

    if (
      specificStudentCardForQR &&
      specificStudentCardForQR.cardNo &&
      menuForSpecificQR
    ) {
      qrCodes.push({
        qrId: uuidv4(),
        digitalCard: { connect: { userId: specificStudentCardForQR.userId } },
        cardNo: specificStudentCardForQR.cardNo,
        expiredDate: randomFutureDate(1, 1),
        menu: { connect: { menuId: menuForSpecificQR.menuId } },
        createDate: new Date(),
      });
    } else {
      console.warn(
        `Digital card for student ${specificStudentIdForQR} or Menu MENU_001 not found, skipping specific QR code.`
      );
    }
    for (let i = 0; i < fetchedStudentDigitalCards.length * 2; i++) {
      const digitalCard = getRandomElement(fetchedStudentDigitalCards);
      const randomMenu = getRandomElement(createdMenus);
      if (digitalCard && digitalCard.cardNo) {
        qrCodes.push({
          digitalCard: { connect: { userId: digitalCard.userId } },
          cardNo: digitalCard.cardNo,
          expiredDate: randomFutureDate(1, 30),
          menu:
            Math.random() > 0.3 && randomMenu
              ? { connect: { menuId: randomMenu.menuId } }
              : undefined,
          createDate: new Date(),
          paysForDate: Math.random() > 0.7 ? new Date() : null,
        });
      }
    }
    for (const qrData of qrCodes) {
      await prisma.qRCode
        .create({ data: qrData })
        .catch((e) =>
          console.error(
            `Error creating QRCode for ${
              qrData.digitalCard?.connect?.userId ?? "UNKNOWN_USER"
            }: ${e.message}`
          )
        );
    }
    console.log(`Created ${qrCodes.length} QR codes`);
  } else {
    console.log("Skipping QR codes: No student digital cards or menus found.");
  }

  const buses: Prisma.BusCreateInput[] = [];
  buses.push({
    vehicleId: "BUS_01",
    liveLatitude: new Prisma.Decimal("34.050000"),
    liveLongitude: new Prisma.Decimal("-118.240000"),
  });
  for (let i = 0; i < 5; i++) {
    buses.push({
      vehicleId: `BUS_AUTO_${String(i + 2).padStart(2, "0")}`,
      liveLatitude: new Prisma.Decimal(
        getRandomNumber(34000000, 35000000) / 1000000
      ),
      liveLongitude: new Prisma.Decimal(
        getRandomNumber(-118000000, -119000000) / 1000000
      ),
    });
  }
  const createdBuses: Prisma.BusGetPayload<null>[] = [];
  for (const busData of buses) {
    await prisma.bus
      .create({ data: busData })
      .then((newBus) => createdBuses.push(newBus))
      .catch((e) =>
        console.error(`Failed to create bus ${busData.vehicleId}: ${e.message}`)
      );
  }
  console.log(`Created ${createdBuses.length} buses`);

  const busDrivesRoutes: Prisma.BusDrivesRouteCreateInput[] = [];
  const bus01 = createdBuses.find((b) => b.vehicleId === "BUS_01");
  if (bus01 && campusLoopRouteId) {
    busDrivesRoutes.push({
      bus: { connect: { vehicleId: bus01.vehicleId } },
      route: { connect: { routeId: campusLoopRouteId } },
    });
  } else {
    console.warn(
      "Bus BUS_01 or Campus Loop route ID not found, skipping specific bus drive."
    );
  }
  if (createdBuses.length > 0 && createdRoutes.length > 0) {
    for (const bus of createdBuses) {
      const numRoutesToDrive = getRandomNumber(1, 2);
      const availableRoutes = [...createdRoutes];
      for (let i = 0; i < numRoutesToDrive && availableRoutes.length > 0; i++) {
        const route = getRandomElement(availableRoutes);
        if (!route) continue;
        availableRoutes.splice(availableRoutes.indexOf(route), 1);
        if (
          !busDrivesRoutes.some(
            (bdr) =>
              bdr.bus?.connect?.vehicleId === bus.vehicleId &&
              bdr.route?.connect?.routeId === route.routeId
          )
        ) {
          busDrivesRoutes.push({
            bus: { connect: { vehicleId: bus.vehicleId } },
            route: { connect: { routeId: route.routeId } },
          });
        }
      }
    }
    for (const bdrData of busDrivesRoutes) {
      const existing = await prisma.busDrivesRoute.findUnique({
        where: {
          vehicleId_routeId: {
            vehicleId: bdrData.bus!.connect!.vehicleId!,
            routeId: bdrData.route!.connect!.routeId!,
          },
        },
      });
      if (!existing)
        await prisma.busDrivesRoute
          .create({ data: bdrData })
          .catch((e) =>
            console.error(
              `Error creating BusDrivesRoute ${
                bdrData.bus!.connect!.vehicleId
              }-${bdrData.route!.connect!.routeId}: ${e.message}`
            )
          );
    }
    console.log(`Created ${busDrivesRoutes.length} bus-route links`);
  } else {
    console.log("Skipping BusDrivesRoute: no buses or routes.");
  }

  const appointmentsData: Prisma.AppointmentCreateInput[] = [];
  const fetchedStudentUsersForAppt = await prisma.user.findMany({
    where: { student: { isNot: null } },
    select: { id: true },
  });
  const fetchedStaffUsersForAppt = await prisma.user.findMany({
    where: { staff: { isNot: null } },
    select: { id: true },
  });
  const specificApptId = "APPT_01_SPORT";

  if (
    fetchedStudentUsersForAppt.length > 0 &&
    fetchedStaffUsersForAppt.length > 0
  ) {
    const studentForSpecificAppt = fetchedStudentUsersForAppt.find(
      (s) => s.id === studentUserIdsSeed[1]
    ); // USR_STD2
    const staffForSpecificAppt = fetchedStaffUsersForAppt.find(
      (s) => s.id === staffUserIds[0]
    ); // USR_STAFF1

    if (studentForSpecificAppt && staffForSpecificAppt) {
      appointmentsData.push({
        appointmentId: specificApptId,
        takenByStudent: { connect: { userId: studentForSpecificAppt.id } },
        managedByStaff: { connect: { userId: staffForSpecificAppt.id } },
        appointmentDate: randomFutureDate(2, 2),
        appointmentStatus: AppointmentStatus.Scheduled,
        notes: "Basketball practice session",
      });
    } else {
      console.warn(
        "Student USR_STD2 or Staff USR_STAFF1 not found/valid for specific appointment. Skipping APPT_01_SPORT."
      );
    }

    for (let i = 0; i < 50; i++) {
      const studentUser = getRandomElement(fetchedStudentUsersForAppt);
      const staffUser = getRandomElement(fetchedStaffUsersForAppt);
      if (studentUser && staffUser) {
        appointmentsData.push({
          takenByStudent: { connect: { userId: studentUser.id } },
          managedByStaff: { connect: { userId: staffUser.id } },
          appointmentDate: randomDate(
            randomPastDate(0, 60),
            randomFutureDate(1, 60)
          ),
          appointmentStatus:
            getRandomElement(Object.values(AppointmentStatus)) ??
            AppointmentStatus.Scheduled,
          notes: `Appointment note ${i + 1}: Discuss ${
            getRandomElement(["grades", "schedule", "project", "health"]) ??
            "topic"
          }`,
        });
      }
    }
    const createdAppointments: Prisma.AppointmentGetPayload<null>[] = [];
    for (const apptData of appointmentsData) {
      await prisma.appointment
        .create({ data: apptData })
        .then((newAppt) => createdAppointments.push(newAppt))
        .catch((e) => {
          console.error(
            `Error creating appointment for student ${
              apptData.takenByStudent?.connect?.userId ?? "UNKNOWN_STUDENT"
            }: ${e.message}`
          );
        });
    }
    console.log(`Created ${createdAppointments.length} appointments`);

    const sportAppointments: Prisma.SportAppointmentCreateInput[] = [];
    const healthAppointments: Prisma.HealthAppointmentCreateInput[] = [];
    const specificCreatedAppointment = createdAppointments.find(
      (a) => a.appointmentId === specificApptId
    );

    if (specificCreatedAppointment) {
      const specificStartTimeSport = createDateTime(
        specificCreatedAppointment.appointmentDate,
        "14:00:00"
      );
      sportAppointments.push({
        appointment: {
          connect: { appointmentId: specificCreatedAppointment.appointmentId },
        },
        sportType: "Basketball",
        startTime: specificStartTimeSport,
        endTime: addHoursToDate(specificStartTimeSport, 1.5),
      });
    } else {
      console.warn(
        `Specific appointment ${specificApptId} was not created or found. Skipping its sport appointment subtype.`
      );
    }
    for (const appt of createdAppointments) {
      if (appt.appointmentId === specificApptId) continue;
      const r = Math.random();
      if (r < 0.3) {
        const startTime = createDateTime(
          appt.appointmentDate,
          randomTimeString()
        );
        sportAppointments.push({
          appointment: { connect: { appointmentId: appt.appointmentId } },
          sportType: getRandomElement(sportTypes) ?? "Tennis",
          startTime: startTime,
          endTime: addHoursToDate(startTime, getRandomNumber(1, 3)),
        });
      } else if (r < 0.6) {
        const startTime = createDateTime(
          appt.appointmentDate,
          randomTimeString()
        );
        healthAppointments.push({
          appointment: { connect: { appointmentId: appt.appointmentId } },
          healthType: getRandomElement(healthTypes) ?? "Check-up",
          startTime: startTime,
          endTime: addHoursToDate(startTime, getRandomNumber(1, 2)),
        });
      }
    }
    for (const saData of sportAppointments) {
      await prisma.sportAppointment
        .create({ data: saData })
        .catch((e) =>
          console.error(
            `Error creating SportAppointment ${
              saData.appointment?.connect?.appointmentId ?? "UNKNOWN_APPT"
            }: ${e.message}`
          )
        );
    }
    console.log(`Created ${sportAppointments.length} sport appointments`);
    for (const haData of healthAppointments) {
      await prisma.healthAppointment
        .create({ data: haData })
        .catch((e) =>
          console.error(
            `Error creating HealthAppointment ${
              haData.appointment?.connect?.appointmentId ?? "UNKNOWN_APPT"
            }: ${e.message}`
          )
        );
    }
    console.log(`Created ${healthAppointments.length} health appointments`);

    const books: Prisma.BookCreateInput[] = [];
    books.push({
      isbn: "ISBN123",
      title: "SQL Basics",
      author: "J.Doe",
      quantityInStock: 10,
      currentQuantity: 8,
    });
    for (let i = 0; i < 30; i++) {
      const title = getRandomElement(
        bookTitles.filter((bt) => !books.some((b) => b.title === bt))
      );
      if (title) {
        const stock = getRandomNumber(5, 50);
        books.push({
          isbn: `ISBN_GEN_${uuidv4().substring(0, 10).toUpperCase()}`,
          title: title,
          author: `${getRandomElement(firstNames) ?? "FN"} ${
            getRandomElement(lastNames) ?? "LN"
          }`,
          quantityInStock: stock,
          currentQuantity: getRandomNumber(0, stock),
        });
      }
    }
    const createdBooks: Prisma.BookGetPayload<null>[] = [];
    for (const bookData of books) {
      await prisma.book
        .create({ data: bookData })
        .then((newBook) => createdBooks.push(newBook))
        .catch((e) =>
          console.error(`Failed to create book ${bookData.title}: ${e.message}`)
        );
    }
    console.log(`Created ${createdBooks.length} books`);

    const bookBorrowRecords: Prisma.BookBorrowRecordCreateInput[] = [];
    const bookISBN123 = createdBooks.find((b) => b.isbn === "ISBN123");

    if (createdAppointments.length > 0 && createdBooks.length > 0) {
      if (specificCreatedAppointment && bookISBN123) {
        bookBorrowRecords.push({
          book: { connect: { isbn: bookISBN123.isbn } },
          appointment: {
            connect: {
              appointmentId: specificCreatedAppointment.appointmentId,
            },
          },
          borrowDate: specificCreatedAppointment.appointmentDate,
          returnDate: null,
          borrowQuantity: 1,
        });
      } else {
        console.warn(
          `Specific appointment ${specificApptId} or Book ISBN123 was not created/found. Skipping its book borrow record.`
        );
      }
      for (const appt of createdAppointments) {
        if (appt.appointmentId === specificApptId) continue;
        if (Math.random() < 0.2) {
          const bookToBorrow = getRandomElement(createdBooks);
          if (bookToBorrow && bookToBorrow.currentQuantity > 0) {
            const borrowDate = appt.appointmentDate;
            const shouldReturn = Math.random() < 0.7;
            const returnDate = shouldReturn
              ? randomDate(
                  addHoursToDate(borrowDate, 1),
                  addHoursToDate(borrowDate, getRandomNumber(24 * 1, 24 * 30))
                )
              : null;
            if (
              !bookBorrowRecords.some(
                (bbr) =>
                  bbr.book?.connect?.isbn === bookToBorrow.isbn &&
                  bbr.appointment?.connect?.appointmentId === appt.appointmentId
              )
            ) {
              bookBorrowRecords.push({
                book: { connect: { isbn: bookToBorrow.isbn } },
                appointment: { connect: { appointmentId: appt.appointmentId } },
                borrowDate: borrowDate,
                returnDate: returnDate,
                borrowQuantity: 1,
              });
              await prisma.book
                .update({
                  where: { isbn: bookToBorrow.isbn },
                  data: { currentQuantity: { decrement: 1 } },
                })
                .catch((e) =>
                  console.warn(
                    `Could not decrement book ${bookToBorrow.isbn} quantity: ${e.message}`
                  )
                );
            }
          }
        }
      }
      for (const bbrData of bookBorrowRecords) {
        const existing = await prisma.bookBorrowRecord.findUnique({
          where: {
            isbn_appointmentId: {
              isbn: bbrData.book!.connect!.isbn!,
              appointmentId: bbrData.appointment!.connect!.appointmentId!,
            },
          },
        });
        if (!existing)
          await prisma.bookBorrowRecord
            .create({ data: bbrData })
            .catch((e) =>
              console.error(
                `Error creating BookBorrowRecord ${
                  bbrData.book!.connect!.isbn
                }-${bbrData.appointment!.connect!.appointmentId}: ${e.message}`
              )
            );
        else if (
          bbrData.book!.connect!.isbn === "ISBN123" &&
          bbrData.appointment!.connect!.appointmentId === specificApptId
        ) {
          await prisma.bookBorrowRecord.update({
            where: {
              isbn_appointmentId: {
                isbn: bbrData.book!.connect!.isbn!,
                appointmentId: bbrData.appointment!.connect!.appointmentId!,
              },
            },
            data: {
              borrowDate: bbrData.borrowDate,
              returnDate: bbrData.returnDate,
              borrowQuantity: bbrData.borrowQuantity,
            },
          });
        }
      }
      console.log(
        `Created/Updated ${bookBorrowRecords.length} book borrow records`
      );
    } else {
      console.log(
        "Skipping BookBorrowRecords: No appointments or books found."
      );
    }
  } else {
    console.log(
      "Skipping Appointments and Book Borrows: No students or staff found to create appointments."
    );
  }

  const allCreatedUsers = await prisma.user.findMany({ select: { id: true } }); // Fetch all users that were actually created
  const userFavoriteRoutes: Prisma.UserFavoriteRouteCreateInput[] = [];
  if (allCreatedUsers.length > 0 && createdRoutes.length > 0) {
    for (const user of allCreatedUsers) {
      if (Math.random() < 0.3) {
        const numFavRoutes = getRandomNumber(1, 3);
        const availableRoutes = [...createdRoutes];
        for (let i = 0; i < numFavRoutes && availableRoutes.length > 0; i++) {
          const route = getRandomElement(availableRoutes);
          if (!route) continue;
          availableRoutes.splice(availableRoutes.indexOf(route), 1);
          if (
            !userFavoriteRoutes.some(
              (ufr) =>
                ufr.user?.connect?.id === user.id &&
                ufr.route?.connect?.routeId === route.routeId
            )
          ) {
            userFavoriteRoutes.push({
              user: { connect: { id: user.id } },
              route: { connect: { routeId: route.routeId } },
              isFavorite: true,
            });
          }
        }
      }
    }
    for (const ufrData of userFavoriteRoutes) {
      await prisma.userFavoriteRoute
        .create({ data: ufrData })
        .catch((e) =>
          console.error(
            `Error creating UserFavoriteRoute for ${
              ufrData.user?.connect?.id ?? "UNKNOWN_USER"
            }: ${e.message}`
          )
        );
    }
    console.log(`Created ${userFavoriteRoutes.length} user favorite routes.`);
  } else {
    console.log("Skipping UserFavoriteRoutes: No users or routes.");
  }

  const staffUsersForRoutes = await prisma.staff.findMany({
    select: { userId: true },
  });
  const staffManagesRoutesData: Prisma.StaffManagesRouteCreateInput[] = [];
  if (staffUsersForRoutes.length > 0 && createdRoutes.length > 0) {
    for (const route of createdRoutes) {
      if (Math.random() < 0.5) {
        const staffMember = getRandomElement(staffUsersForRoutes);
        if (
          staffMember &&
          !staffManagesRoutesData.some(
            (smr) =>
              smr.staff?.connect?.userId === staffMember.userId &&
              smr.route?.connect?.routeId === route.routeId
          )
        ) {
          staffManagesRoutesData.push({
            staff: { connect: { userId: staffMember.userId } },
            route: { connect: { routeId: route.routeId } },
          });
        }
      }
    }
    for (const smrData of staffManagesRoutesData) {
      await prisma.staffManagesRoute
        .create({ data: smrData })
        .catch((e) =>
          console.error(
            `Error creating StaffManagesRoute for ${smrData.staff}: ${e.message}`
          )
        );
    }
    console.log(
      `Created ${staffManagesRoutesData.length} staff manages route links.`
    );
  } else {
    console.log("Skipping StaffManagesRoutes: No staff or routes.");
  }

  const userLooksAtRoutesData: Prisma.UserLooksAtRouteCreateInput[] = [];
  if (allCreatedUsers.length > 0 && createdRoutes.length > 0) {
    for (const user of allCreatedUsers) {
      if (Math.random() < 0.7) {
        const numLookedRoutes = getRandomNumber(1, 5);
        const availableRoutes = [...createdRoutes];
        for (
          let i = 0;
          i < numLookedRoutes && availableRoutes.length > 0;
          i++
        ) {
          const route = getRandomElement(availableRoutes);
          if (!route) continue;
          availableRoutes.splice(availableRoutes.indexOf(route), 1);
          if (
            !userLooksAtRoutesData.some(
              (ulr) =>
                ulr.user?.connect?.id === user.id &&
                ulr.route?.connect?.routeId === route.routeId
            )
          ) {
            userLooksAtRoutesData.push({
              user: { connect: { id: user.id } },
              route: { connect: { routeId: route.routeId } },
            });
          }
        }
      }
    }
    for (const ulrData of userLooksAtRoutesData) {
      await prisma.userLooksAtRoute
        .create({ data: ulrData })
        .catch((e) =>
          console.error(
            `Error creating UserLooksAtRoute for ${
              ulrData.user?.connect?.id ?? "UNKNOWN_USER"
            }: ${e.message}`
          )
        );
    }
    console.log(
      `Created ${userLooksAtRoutesData.length} user looks at route links.`
    );
  } else {
    console.log("Skipping UserLooksAtRoute: No users or routes.");
  }

  const routeDepartureTimes: Prisma.RouteDepartureTimeCreateInput[] = [];
  if (createdRoutes.length > 0) {
    for (const route of createdRoutes) {
      const numDepartures = getRandomNumber(3, 10);
      const usedTimes = new Set<string>();
      for (let i = 0; i < numDepartures; i++) {
        const timeStr = randomTimeString();
        if (!usedTimes.has(timeStr)) {
          routeDepartureTimes.push({
            route: { connect: { routeId: route.routeId } },
            departureTime: createDateTime(new Date(), timeStr),
          });
          usedTimes.add(timeStr);
        }
      }
    }
    for (const rdtData of routeDepartureTimes) {
      await prisma.routeDepartureTime
        .create({ data: rdtData })
        .catch((e) =>
          console.warn(
            `Skipping duplicate RouteDepartureTime for ${
              rdtData.route?.connect?.routeId ?? "UNKNOWN_ROUTE"
            } at ${rdtData.departureTime.toString()}: ${e.message}`
          )
        );
    }
    console.log(`Created ${routeDepartureTimes.length} route departure times.`);
  } else {
    console.log("Skipping RouteDepartureTimes: No routes.");
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
