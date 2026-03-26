# FAST University Sports Issuing System

Cloud-based full-stack application for issuing and booking university sports equipment.

## Overview

The **FAST Sports Booking System** digitizes sports equipment issuing in a university environment. It replaces manual tracking with an automated platform where students can:

- Log in using university email (`@nu.edu.pk`)
- View available sports items and time slots
- Create bookings
- Receive booking notifications
- Track recent bookings and return status from an admin-style dashboard

The project is designed as a practical AWS-integrated solution using frontend, backend, database, and email services.

## Objectives

- Build a full-stack cloud-based web application
- Implement booking and tracking workflow
- Store data in a scalable NoSQL cloud database
- Integrate booking email notifications
- Deploy using AWS services

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Hosting target: Amazon S3 (static website hosting)

### Backend
- Node.js
- Express.js
- Hosting target: Amazon EC2

### Database
- Amazon DynamoDB
  - `Users`
  - `Items`
  - `Bookings`

### Email
- Amazon SES (booking confirmations)

## System Architecture

Client-server cloud architecture:

1. Frontend (React) hosted on **S3**
2. Backend API hosted on **EC2**
3. Persistent data stored in **DynamoDB**
4. Email notifications sent via **SES**

## Core Features

- University email login flow
- Sports item listing and time-slot visibility
- Booking creation with duplicate-slot prevention logic
- Dashboard with:
  - available items
  - booking stats
  - recent bookings
  - mark-as-returned action
- CSV export options for bookings
- Toast notifications for admin actions

## AWS Implementation Notes

### 1) Frontend Deployment (S3)
- Static website hosting enabled
- `index.html` configured as index document
- SPA refresh routing fixed by setting error document to `index.html`

### 2) Backend Deployment (EC2)
- Node.js installed on EC2
- Backend app deployed and started on port `5001`
- Security group configured to allow required inbound traffic

### 3) DynamoDB Integration
- Replaces in-memory persistence for production workflow
- Supports scalable read/write operations
- Flexible NoSQL schema for booking data

### 4) SES Integration
- Booking confirmation emails sent on booking creation
- Verified identities used under SES sandbox constraints

## Local Development Setup

## Prerequisites
- Node.js and npm

## Run Backend

```bash
cd server
npm install
npm start
```

Backend runs on port `5001`.

## Run Frontend

```bash
cd client
npm install
npm start
```

Frontend runs on port `3000`.

## Build Frontend

```bash
cd client
npm run build
```

## API Endpoints (Current)

- `POST /api/auth/login` - university email validation/login
- `GET /api/items` - list items with available time slots
- `POST /api/bookings` - create booking
- `GET /api/bookings` - list bookings
- `PATCH /api/bookings/:id/return` - mark booking as returned

## Challenges Faced

- S3 SPA routing issue (`404` on refresh)
- DynamoDB key/case mismatch handling
- IAM and EC2 role configuration
- SES permissions and verification setup

## Conclusion

This system demonstrates a complete AWS-based full-stack deployment that automates university sports issuing and booking workflows with scalable cloud services.

## Future Enhancements

- JWT-based authentication and authorization
- Move backend to serverless architecture
- Advanced analytics dashboard
- SES production mode enablement (out of sandbox)

## Author

**Ahmed Umar Rehman**
