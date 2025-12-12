# LoyaltyHub Demo Plan

## Demo Overview
This document outlines the demo plan for presenting the LoyaltyHub application during the grading session. The demo should showcase all required features across different user roles.

**Total Demo Time: 60 minutes**

---

## Pre-Demo Setup (5 minutes)
1. **Start Backend Server**
   - Navigate to `course-project/backend`
   - Run: `node index.js 3000`
   - Verify server is running on http://localhost:3000

2. **Start Frontend Server**
   - Navigate to `course-project/frontend/LoyaltyHub`
   - Run: `npm run dev`
   - Verify frontend is running (usually http://localhost:5173 or 5174)

3. **Verify Database is Seeded**
   - Ensure seed data is loaded with test users, transactions, events, and promotions

4. **Test Accounts Ready**
   - Regular User: `jdoe123` / `Pass123!`
   - Cashier: `cashier01` / `Pass123!`
   - Manager: `manager01` / `Pass123!`
   - Superuser: `super01` / `Pass123!`

---

## Demo Flow (55 minutes)

### Part 1: Regular User Features (10 minutes)

#### 1.1 Login and Dashboard (2 min)
- **Action**: Login as `jdoe123`
- **Show**:
  - Login page with proper validation
  - Dashboard showing welcome message, points balance (5,000 points)
  - User profile information
  - Navigation menu

#### 1.2 Points Management (2 min)
- **Action**: Navigate to "View Points"
- **Show**:
  - Current points balance display
  - Link to transactions history

#### 1.3 QR Code Display (1 min)
- **Action**: Navigate to "My QR Code"
- **Show**:
  - QR code for user identification
  - Explanation of QR code usage for transactions

#### 1.4 Transfer Points (2 min)
- **Action**: Navigate to "Transfer Points"
- **Show**:
  - Form to enter recipient UtorId
  - Transfer amount input
  - Successful transfer confirmation
  - Updated points balance

#### 1.5 Redemption Request (2 min)
- **Action**: Navigate to "Point Redemption Request"
- **Show**:
  - Create redemption request
  - Display QR code for unprocessed redemption
  - Show redemption in transaction history

#### 1.6 View Promotions (1 min)
- **Action**: Navigate to "Promotions"
- **Show**:
  - List of available promotions
  - Filter and pagination functionality
  - Promotion details

---

### Part 2: Events and Transactions (5 minutes)

#### 2.1 Browse Events (2 min)
- **Action**: Navigate to "Events"
- **Show**:
  - List of published events
  - Event cards with details (name, location, time, capacity)
  - Filter and pagination

#### 2.2 RSVP to Event (1 min)
- **Action**: Click on an event, then RSVP
- **Show**:
  - Event detail page
  - RSVP button functionality
  - Confirmation of RSVP

#### 2.3 View Transactions (2 min)
- **Action**: Navigate to "Transactions"
- **Show**:
  - Transaction history with filters
  - Different transaction types with distinct colors
  - Proper display of related users (UtorId instead of relatedId)
  - Pagination controls
  - Order-by functionality

---

### Part 3: Cashier Features (5 minutes)

#### 3.1 Login as Cashier (1 min)
- **Action**: Logout and login as `cashier01`
- **Show**:
  - Cashier dashboard with additional options
  - Access to both regular user and cashier features

#### 3.2 Create Purchase Transaction (2 min)
- **Action**: Navigate to "Create Purchase Transaction"
- **Show**:
  - Form to enter customer UtorId
  - Amount spent input
  - Promotion selection (if applicable)
  - Successful transaction creation
  - Points awarded to customer

#### 3.3 Process Redemption (2 min)
- **Action**: Navigate to "Process Redemption Request"
- **Show**:
  - Form to enter transaction ID
  - Display redemption details
  - Process redemption
  - Confirmation and updated user balance

---

### Part 4: Manager Features (15 minutes)

#### 4.1 Login as Manager (1 min)
- **Action**: Logout and login as `manager01`
- **Show**:
  - Manager dashboard with all management options

#### 4.2 User Management (4 min)
- **4.2.1 View All Users (1 min)**
  - Navigate to "Users"
  - Show: User list with filters (name, role, verified, activated)
  - Show: Pagination and order-by functionality
  
- **4.2.2 Update User (2 min)**
  - Click on a user
  - Show: User detail page
  - Update: Verify user, change role to cashier
  - Show: Updated user information
  
- **4.2.3 User Filters (1 min)**
  - Demonstrate filtering by role, verification status
  - Show: Search by name/UtorId

#### 4.3 Transaction Management (3 min)
- **4.3.1 View All Transactions (1 min)**
  - Navigate to "Transactions"
  - Show: All transactions with manager-specific filters
  - Show: Suspicious transaction filter
  
- **4.3.2 Transaction Detail (2 min)**
  - Click on a purchase transaction
  - Show: Transaction details
  - Mark transaction as suspicious
  - Create adjustment transaction
  - Show: Updated transaction status

#### 4.4 Promotion Management (4 min)
- **4.4.1 View Promotions (1 min)**
  - Navigate to "Promotions"
  - Show: All promotions with filters and pagination
  
- **4.4.2 Create Promotion (1.5 min)**
  - Navigate to "Create Promotion"
  - Show: Form with all fields (name, description, type, dates, etc.)
  - Create an automatic promotion
  - Show: Success message and new promotion in list
  
- **4.4.3 Edit/Delete Promotion (1.5 min)**
  - Click on a promotion
  - Show: Promotion detail page
  - Edit promotion (e.g., extend end time)
  - Show: Updated promotion
  - Delete a promotion (if not started)

#### 4.5 Event Management (3 min)
- **4.5.1 View Events (1 min)**
  - Navigate to "Events"
  - Show: All events (including unpublished)
  - Show: Filters and pagination
  
- **4.5.2 Create Event (1 min)**
  - Navigate to "Create Event"
  - Show: Form with all fields
  - Create an event with organizers
  - Publish the event
  
- **4.5.3 Manage Event Members (1 min)**
  - Click on an event
  - Navigate to "Event Members"
  - Add users as guests
  - Remove guests
  - Show: Updated guest list

---

### Part 5: Event Organizer Features (5 minutes)

#### 5.1 Login as Manager/Organizer (1 min)
- **Action**: Ensure logged in as manager who is also an event organizer
- **Show**: Event Organizer menu options

#### 5.2 View My Events (1 min)
- **Action**: Navigate to "My Events" (Event Organizer section)
- **Show**:
  - List of events where user is organizer
  - Event status and details

#### 5.3 Edit Event (1 min)
- **Action**: Click on an event
- **Show**:
  - Event detail page with edit capabilities
  - Update event details (description, location, etc.)
  - Note: Cannot add/remove organizers or delete

#### 5.4 Add Guest to Event (1 min)
- **Action**: Navigate to "Add User" for an event
- **Show**:
  - Form to add guest by UtorId
  - Success confirmation
  - Updated guest list

#### 5.5 Award Points (1 min)
- **Action**: Navigate to "Award Points"
- **Show**:
  - Option to award to single guest
  - Option to award to all guests
  - Points distribution
  - Updated event points remaining

---

### Part 6: Superuser Features (3 minutes)

#### 6.1 Login as Superuser (1 min)
- **Action**: Logout and login as `super01`
- **Show**: Superuser dashboard with all privileges

#### 6.2 Promote User (2 min)
- **Action**: Navigate to "Promote User"
- **Show**:
  - Form to enter user email
  - Role selection (Manager, Superuser)
  - Promote a user to manager
  - Verify promotion in user list

---

### Part 7: Additional Features & Edge Cases (7 minutes)

#### 7.1 Responsive Design (2 min)
- **Action**: Resize browser window
- **Show**:
  - Mobile-friendly navigation
  - Responsive layouts
  - Touch-friendly buttons

#### 7.2 Error Handling (2 min)
- **Show**:
  - Invalid login attempt
  - Insufficient points for transfer/redemption
  - Invalid form submissions
  - 404 errors for non-existent resources

#### 7.3 Navigation & URL Management (1 min)
- **Show**:
  - Browser back/forward buttons work
  - Direct URL access works
  - Proper routing

#### 7.4 Data Persistence (2 min)
- **Show**:
  - Logout and login again
  - Data persists across sessions
  - Points balance maintained
  - Transaction history preserved

---

## Key Points to Emphasize

### Functionality
- ✅ All required pages implemented
- ✅ Role-based access control working correctly
- ✅ All CRUD operations functional
- ✅ Filters, pagination, and sorting implemented
- ✅ QR codes displayed correctly
- ✅ Transaction types visually distinct

### User Experience
- ✅ Clean, intuitive navigation
- ✅ Responsive design
- ✅ Proper error messages
- ✅ Loading states
- ✅ Success confirmations

### Technical Excellence
- ✅ Proper API integration
- ✅ Error handling
- ✅ Form validation
- ✅ State management
- ✅ Code organization

---

## Backup Scenarios

If something goes wrong during demo:
1. **Server Issues**: Have screenshots/video ready
2. **Database Issues**: Quick reset script ready
3. **Feature Not Working**: Skip and move to next, mention it at the end
4. **Time Running Out**: Prioritize core features (User management, Transactions, Events)

---

## Post-Demo Q&A Preparation

Be ready to answer:
1. How authentication/authorization works
2. Database schema design decisions
3. How transactions are processed
4. How promotions are applied
5. Event organizer permissions
6. Any new features implemented
7. Challenges faced and solutions

---

## Demo Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Database seeded with test data
- [ ] All test accounts working
- [ ] Browser bookmarks for key pages
- [ ] Screenshots/video backup ready
- [ ] Team members know their parts
- [ ] Timekeeper assigned
- [ ] Backup plan ready

---

**Good luck with your demo! 🚀**
