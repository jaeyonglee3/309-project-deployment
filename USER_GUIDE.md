# LoyaltyHub User Guide

Welcome to **LoyaltyHub**! This guide will help you get started with the loyalty points system.

## Table of Contents

1. [What is LoyaltyHub?](#what-is-loyaltyhub)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Features by Role](#features-by-role)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## What is LoyaltyHub?

LoyaltyHub is a comprehensive loyalty points management system that allows users to:
- Earn points through purchases and events
- Redeem points for rewards
- Transfer points to other users
- Participate in promotions and special events
- Manage transactions and view point history

---

## Getting Started

### First Time Login

1. **Open the Application**
   - Navigate to `http://localhost:5173` (or the URL provided by your administrator)

2. **Login Page**
   - You'll see the login page when you first visit
   - Enter your **UtorId** (username) and **Password**
   - Click "Login" to access your account

3. **Test Accounts** (for development/testing)
   - **Regular User**: `jdoe123` / Password: `Pass123!`
   - **Cashier**: `cashier01` / Password: `Pass123!`
   - **Manager**: `manager01` / Password: `Pass123!`
   - **Superuser**: `super01` / Password: `Pass123!`

### After Login

Once logged in, you'll see the **Home Page** with options based on your user role. The navigation bar at the top shows:
- **LoyaltyHub** logo (click to return home)
- **Profile** button (view/edit your profile)
- **Log out** button

---

## User Roles

LoyaltyHub has four user roles with different permissions:

### 1. Regular User
- View and manage your own points
- Make purchases and earn points
- Redeem points for rewards
- Transfer points to other users
- View your transaction history
- Participate in promotions and events

### 2. Cashier
- All Regular User features, plus:
- Create purchase transactions for customers
- Process redemption requests
- View customer transaction details

### 3. Manager
- All Cashier features, plus:
- View all users and their details
- View all transactions across the system
- Create and manage promotions
- Create and manage events
- Mark transactions as suspicious
- View system-wide analytics

### 4. Superuser
- All Manager features, plus:
- Promote users to higher roles
- Full system administration

---

## Features by Role

### Regular User Features

#### **Points Dashboard**
- View your current point balance
- See recent point activity

#### **Transactions**
- View all your transaction history
- Filter by:
  - Transaction type (Purchase, Redemption, Transfer, etc.)
  - Promotion ID
  - Amount (with ≥ or ≤ operators)
- Sort by amount or type
- Pagination support

#### **QR Code**
- Generate QR codes for:
  - Your profile (for others to send you points)
  - Redemption requests (for cashiers to process)

#### **Transfer Points**
- Send points to other users
- Enter recipient's UtorId and amount
- Add optional remarks

#### **Promotions**
- Browse available promotions
- See promotion details:
  - Type (Automatic or One-time)
  - Discount rate or bonus points
  - Minimum spending requirements
  - Validity period
- View which promotions you've used

#### **Events**
- View available events
- See event details:
  - Event name and description
  - Points available
  - Guest list
  - Organizer information
- Join events (if applicable)

#### **Redemption**
- Create redemption requests
- Select promotion to redeem
- Generate QR code for cashier processing
- Track redemption status

### Cashier Features

#### **Create Transaction**
- Record purchase transactions for customers
- Enter customer UtorId
- Add amount spent
- Select applicable promotions
- Add optional remarks
- System automatically calculates points earned

#### **Process Redemption**
- Scan or enter redemption QR code
- Process customer redemption requests
- Complete the redemption transaction

### Manager Features

#### **Users Management**
- View all users in the system
- Search users by name or UtorId
- Filter by role
- View user details:
  - Point balance
  - Transaction history
  - Account status
  - Suspicious flag

#### **All Transactions**
- View all transactions across the system
- Advanced filtering:
  - User name/UtorId
  - Created by (UtorId)
  - Suspicious flag
  - Transaction type
  - Promotion ID
  - Amount with operators
- Sort and paginate results
- Mark transactions as suspicious

#### **Promotions Management**
- Create new promotions:
  - Set promotion type (Automatic/One-time)
  - Configure discount rate or bonus points
  - Set minimum spending requirements
  - Set start and end dates
- Edit existing promotions
- View promotion details and usage statistics

#### **Events Management**
- Create new events:
  - Set event name and description
  - Allocate points budget
  - Set start and end dates
- Add guests to events
- Award points to event guests
- View event details and guest lists

### Superuser Features

#### **Promote Users**
- Promote users to higher roles:
  - Regular → Cashier
  - Cashier → Manager
  - Manager → Superuser
- View current user roles

---

## Common Tasks

### How to Earn Points

1. **Through Purchases**
   - Make a purchase at a participating store
   - Cashier records your transaction
   - Points are automatically calculated and added
   - Promotions may apply for bonus points

2. **Through Events**
   - Event organizers can award points to attendees
   - Points are added to your account automatically

3. **Through Transfers**
   - Other users can transfer points to you
   - You'll receive a notification (check transaction history)

### How to Redeem Points

1. **Browse Promotions**
   - Go to "Promotions" page
   - Find a promotion you want to use
   - Check if you meet the requirements

2. **Create Redemption Request**
   - Go to "Redemption" page
   - Select the promotion
   - Confirm the points to be deducted
   - Generate QR code

3. **Get Processed**
   - Show QR code to cashier
   - Cashier scans and processes the redemption
   - Points are deducted and reward is given

### How to Transfer Points

1. **Go to Transfer Page**
   - Click "Transfer" in the navigation menu

2. **Enter Details**
   - Enter recipient's UtorId
   - Enter amount to transfer
   - Add optional remark

3. **Confirm Transfer**
   - Review the details
   - Click "Transfer"
   - Transaction is recorded immediately

### How to View Transaction History

1. **Go to Transactions Page**
   - Click "Transactions" in the navigation menu

2. **Use Filters (Optional)**
   - Click "Show" next to "Filters"
   - Select transaction type, promotion, or amount range
   - Click "Show" next to "Order Results By" to sort

3. **Navigate Pages**
   - Use "Next Page" and "Prev Page" buttons
   - Adjust "Results per page" if needed

### How to Generate QR Codes

1. **Profile QR Code**
   - Go to "QR Code" page
   - Your profile QR code is displayed
   - Others can scan this to send you points

2. **Redemption QR Code**
   - Create a redemption request
   - QR code is automatically generated
   - Show to cashier for processing

---

## Troubleshooting

### Login Issues

**Problem**: Can't log in
- **Solution**: 
  - Verify your UtorId and password are correct
  - Check if your account exists (contact administrator)
  - Ensure the backend server is running

**Problem**: "Invalid credentials" error
- **Solution**: 
  - Double-check your username and password
  - Passwords are case-sensitive
  - Try resetting your password (if available)

### Transaction Issues

**Problem**: Points not showing after purchase
- **Solution**: 
  - Refresh the page
  - Check your transaction history
  - Contact the cashier or manager if issue persists

**Problem**: Can't redeem points
- **Solution**: 
  - Verify you have enough points
  - Check if the promotion is still active
  - Ensure you meet minimum spending requirements (if applicable)
  - Check if you've already used a one-time promotion

### Display Issues

**Problem**: Page shows "0 results found" or errors
- **Solution**: 
  - Refresh the page
  - Check your internet connection
  - Ensure backend server is running
  - Try logging out and logging back in

**Problem**: Filters not working
- **Solution**: 
  - Clear all filters and try again
  - Ensure you're entering correct values
  - Check if there's data matching your filters

### QR Code Issues

**Problem**: QR code not displaying
- **Solution**: 
  - Refresh the page
  - Ensure JavaScript is enabled
  - Try a different browser

**Problem**: Cashier can't scan QR code
- **Solution**: 
  - Ensure QR code is fully visible
  - Check screen brightness
  - Try generating a new QR code

### General Issues

**Problem**: Page not loading
- **Solution**: 
  - Check if frontend server is running (`http://localhost:5173`)
  - Check if backend server is running (`http://localhost:3000`)
  - Clear browser cache
  - Try a different browser

**Problem**: "Network error" messages
- **Solution**: 
  - Verify backend server is running
  - Check API connection settings
  - Contact system administrator

---

## Tips and Best Practices

1. **Keep Track of Your Points**
   - Regularly check your point balance
   - Review transaction history monthly
   - Set reminders for expiring promotions

2. **Use Promotions Wisely**
   - Check promotion requirements before making purchases
   - Plan purchases around active promotions
   - Note one-time promotions can only be used once

3. **Secure Your Account**
   - Don't share your password
   - Log out when using shared computers
   - Report suspicious activity immediately

4. **For Cashiers**
   - Always verify customer UtorId before transactions
   - Double-check amounts before processing
   - Keep redemption QR codes visible until processed

5. **For Managers**
   - Regularly review suspicious transactions
   - Monitor promotion usage and effectiveness
   - Keep event information up to date

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check the Troubleshooting section** above
2. **Contact your system administrator**
3. **Review transaction history** for clues about issues
4. **Check system status** (if available)

---

## Quick Reference

### Keyboard Shortcuts
- None currently available (future feature)

### Important URLs
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

### Support Contacts
- Contact your system administrator for account issues
- Technical support: Check with your IT department

---

**Last Updated**: January 2025

**Version**: 1.0

---

Thank you for using LoyaltyHub! 🎉
