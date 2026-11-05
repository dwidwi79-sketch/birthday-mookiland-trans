/**
 * Birthday Mookiland — database schema.
 * Keep these headers in sync with the API and admin dashboard.
 */
const BM_SCHEMA = {
  Settings: ["Key", "Value", "UpdatedAt"],
  Packages: ["PackageId", "Name", "WeekdayPrice", "WeekendPrice", "MinimumChildren", "Active"],
  Locations: ["LocationId", "Name", "WeekdayFee", "WeekendFee", "Capacity", "Active"],
  AddOns: ["AddOnId", "Category", "Name", "Description", "Unit", "Price", "Active"],
  Bookings: [
    "BookingId", "CreatedAt", "UpdatedAt", "CustomerName", "Email", "WhatsApp",
    "BirthdayChild", "BirthdayAge", "EventDate", "Session", "LocationId",
    "ChildrenCount", "PackageUnitPrice", "VenueFee", "AddOnsTotal", "BookingTotal",
    "DepositRequired", "BookingStatus", "HoldExpiresAt", "PaymentStatus",
    "SpecialRequest", "Source"
  ],
  Participants: ["ParticipantId", "BookingId", "ChildName", "Age", "Notes"],
  Payments: [
    "PaymentId", "BookingId", "PaymentType", "Amount", "TransferDate",
    "ProofFileId", "ProofUrl", "VerificationStatus", "VerifiedBy", "VerifiedAt", "Notes"
  ],
  Availability: ["Date", "LocationId", "Session", "Status", "BookingId", "UpdatedAt"],
  BlockedSlots: ["BlockId", "Date", "LocationId", "Session", "Reason", "CreatedAt", "CreatedBy"],
  Customers: ["CustomerId", "Name", "Email", "WhatsApp", "FirstSeenAt", "LastBookingAt"],
  AdminUsers: ["Email", "Role", "Active", "CreatedAt"],
  ActivityLog: ["Timestamp", "Actor", "Action", "EntityType", "EntityId", "Details"]
};

const BM_DEFAULT_SETTINGS = [
  ["BusinessName", "Mookiland Birthday Party"],
  ["AdminEmail", "dwi.purnami@mookiland.com"],
  ["Timezone", "Asia/Makassar"],
  ["Currency", "IDR"],
  ["DepositPercent", "50"],
  ["SlotHoldHours", "72"],
  ["MinimumChildren", "10"],
  ["SessionMorningLabel", "Morning"],
  ["SessionAfternoonLabel", "Afternoon"],
  ["WeekdayPackagePrice", "275000"],
  ["WeekendPackagePrice", "325000"],
  ["CoveredTerraceWeekdayFee", "1000000"],
  ["CoveredTerraceWeekendFee", "1200000"]
];

const BM_DEFAULT_LOCATIONS = [
  ["LOC-GARDEN", "Mooki Garden", 0, 0, "", true],
  ["LOC-BACKYARD", "Mooki Backyard", 0, 0, "", true],
  ["LOC-TERRACE", "Covered Terrace Lounge", 1000000, 1200000, 30, true]
];
