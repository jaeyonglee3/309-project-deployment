CSC309 Final Project - LoyaltyHub
NOTES:
FYI, for the “interface switching” requirement, we won’t have a page where a super user can say, switch to the “regular” role. Instead, we’ll do exactly what is described in this piazza question 
I.e., cashiers have access to all the pages regular users do + any pages unique to cashiers. Managers have access to all the pages cashier users do + any pages unique to managers, etc.
Put your name beside what you will work on, ✅ means it is complete
JAEYONG
LAWRENCE
DANIEL
When you work on any of the files, change them from tsx to jsx (we do not want any typescript files)
RUNNING THE PROJECT:
Start backend app
cd course-project/backend
node index.js 3000
Seed sqlite db
cd course-project/backend/prisma
npx prisma db push
npx prisma generate
node seed.js
Start frontend
cd course-project/frontend/LoyaltyHub
npm run dev
TEST USERS YOU CAN USE FROM DB SEED SCRIPT:
All users have the same password: Pass123!
Regular role
Username: jdoe123
Cashier role
Username: cashier01
Manager role
Username: manager01
Superuser role
Username: super01
TODOs - REQUIRED PAGES FROM THE ASSIGNMENT HANDOUT:
Regular Users
(JAEYONG) A page that displays the current available points. ✅
(JAEYONG) A page that displays the user's QR code for the purpose of initiating a transaction. ✅
(JAEYONG) A page that allows the user to manually enter a user ID to transfer points ✅
QR code scanning capability is NOT required.
(JAEYONG) A page that allows the user to make a point redemption request ✅
(JAEYONG) A page that displays the QR code of an unprocessed redemption request. ✅
(JAEYONG) A page that displays all available promotions. ✅
(JAEYONG) A page that displays all published events. ✅
(JAEYONG) A page that displays a specific event and allows a user to RSVP to an event. ✅
(JAEYONG) A page that displays all past transactions for the current logged in user (with filters, order-by, and pagination). ✅
(JAEYONG) Each transaction card should be displayed "nicely", e.g., instead of relatedId, it should display the UtorId of the sender/receiver. ✅
(JAEYONG) Some way to make each transaction type distinct in appearance, e.g., using different colors. ✅
Cashiers
(JAEYONG) A page that allows the cashier to create a transaction (QR code scanning capability is NOT required). ✅
(JAEYONG) A page that allows the cashier to manually enter a transaction ID to process redemption requests (QR code scanning capability is NOT required). ✅

Managers
(DANIEL) A page that displays all users (with filters, order-by, and pagination). ✅
(DANIEL) A page that allows managers to update users, e.g., make a user verified, promote a user to cashier, etc. ✅
(DANIEL) A page that displays ALL transactions (with filters, order-by, and pagination). ✅
(DANIEL) A page that displays a specific transaction, with the option of creating an adjustment transaction for it, and marking it as suspicious. ✅
(DANIEL) A page that allows managers to create new promotions. ✅
(DANIEL) A page that displays all promotions (with filters, order-by, and pagination). ✅
(DANIEL) A page that allows managers to view/edit/delete a specific promotion. ✅
(DANIEL) A page that allows managers to create new events. ✅
(DANIEL) A page that displays all events (with filters, order-by, and pagination). ✅
(DANIEL) A page that allows managers to view/edit/delete a specific event. ✅
(DANIEL) A page that allows managers to add or remove users from an event. ✅

Event Organizer (and all Managers)
(DANIEL) A page that displays the events that the user is responsible for. ✅
(DANIEL) A page that allows the user to view/edit a specific event that he/she is responsible for. ✅
(DANIEL) A page that allows adding a user to the event that he/she is responsible for. ✅
(DANIEL) A page that allows awarding points to a single guest, or to all guests who have RSVPed. ✅

Superuser
(DANIEL) The ability to promote any user to managers or superusers ✅
TODOs - EXTRA THINGS WE NEED:
(JAEYONG) Auth context for currently logged in user, login page, log out logic ✅
(JAEYONG) DB seed script seed.js ✅
(DANIEL) Deploy the application (frontend and backend), probably using railway to keep it simple
(DANIEL) INSTALL txt file ✅
(DANIEL) WEBSITE txt file ✅
(DANIEL) ai.txt file ✅
(DANIEL) Deal with any TODO comments left over in the codebase ✅
(DANIEL) Demo plan document ✅
USEFUL PIAZZA POSTS:
Clarification on “interface switching” requirement
https://piazza.com/class/mf2029ek64x3sz/post/596 

What should be in INSTALL?
https://piazza.com/class/mf2029ek64x3sz/post/593 


