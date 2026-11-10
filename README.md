# FAST University Sports Issuing System

**A Cloud-Based University Sports Equipment Booking and Management Platform**

![Project Status](https://img.shields.io/badge/Status-In%20Progress-orange)
![Frontend](https://img.shields.io/badge/Frontend-React.js-blue)
![Backend](https://img.shields.io/badge/Backend-Supabase-green)
![Deployment](https://img.shields.io/badge/Hosting-Vercel-black)
![Cloud](https://img.shields.io/badge/Cloud-AWS%20Integration%20Planned-orange)

---

## 1. Project Overview

The **FAST University Sports Issuing System** is a cloud-based full-stack web application designed to digitize and streamline the process of booking, issuing, and managing sports equipment within a university environment.

The system replaces traditional manual record-keeping with a centralized digital platform where students can view sports equipment, check availability, make bookings, and track their booking history.

Administrators can manage sports equipment, configure time slots, monitor bookings, and maintain equipment issuing and return records.

The project is being developed as a practical cloud computing and DevOps implementation, combining modern web technologies, managed backend infrastructure, cloud hosting, and AWS monitoring services.

The application is currently under active development. Its frontend has been deployed to Vercel, and Supabase is being used as the backend platform. Additional cloud infrastructure and monitoring capabilities are planned.

## 2. Project Objectives

The primary objectives are:

- Digitize university sports equipment booking and issuing operations.
- Provide a centralized platform for students and administrators.
- Implement secure authentication and role-based access.
- Manage sports equipment availability and booking time slots.
- Prevent duplicate or conflicting bookings.
- Maintain booking and equipment return records.
- Use managed cloud infrastructure for backend services.
- Deploy the frontend through a cloud hosting platform.
- Integrate cloud monitoring and observability using AWS.
- Demonstrate practical knowledge of cloud architecture, DevOps, and application deployment.

## 3. Current Technology Stack

The project architecture has evolved from its original AWS-hosted design. The current implementation uses the following technologies.

### Frontend

| Technology | Purpose |
|---|---|
| React.js | Frontend application and UI |
| JavaScript | Application logic |
| CSS | Styling and responsive layouts |
| Vercel | Frontend hosting and deployment |
| GitHub | Source code management and deployment integration |

### Backend and Database

| Technology | Purpose |
|---|---|
| Supabase | Managed backend platform |
| Supabase Auth | User authentication |
| PostgreSQL | Relational database |
| Supabase Row Level Security (RLS) | Database access control |
| Supabase MFA | Multi-factor authentication support |

### Cloud and DevOps

| Technology | Purpose | Status |
|---|---|---|
| Vercel | Frontend hosting | Implemented |
| GitHub | Version control | Implemented |
| Supabase | Backend and database services | In use |
| AWS CloudWatch | Application monitoring and observability | Planned |
| AWS IAM | AWS access and permissions management | Planned |
| AWS Lambda / API Gateway | Potential serverless integration | Under consideration |

**Note:** AWS S3, EC2, DynamoDB, and SES were part of the original architecture proposal. They are not currently the deployed production architecture.

## 4. Current System Architecture

The current architecture separates the frontend application from managed backend services.

```text
                    STUDENTS / ADMIN
                           |
                           |
                     Web Browser
                           |
                           |
                    React Application
                           |
                           |
                    Vercel Hosting
                           |
                           |
                  Supabase Client SDK
                           |
                +----------+----------+
                |                     |
                |                     |
           Supabase Auth         PostgreSQL
                |                     |
                |                     |
           User Login           Application Data
                |                     |
                +----------+----------+
                           |
                           |
                    Row Level Security
```

### Architecture Components

**1. React Frontend**

The React application provides the user interface for students and administrators.

It handles navigation, forms, equipment listings, booking interfaces, and dashboard functionality.

**2. Vercel Hosting**

Vercel hosts the React frontend and provides automated deployment through the connected GitHub repository.

The application is deployed from the `client` directory.

**3. Supabase Backend**

Supabase provides managed backend functionality, including authentication and PostgreSQL database services.

The React application connects to Supabase using environment variables.

**4. PostgreSQL Database**

PostgreSQL provides structured relational data storage for application entities such as users, sports equipment, time slots, and bookings.

**5. AWS Monitoring (Planned)**

AWS CloudWatch will be evaluated for monitoring application activity, infrastructure metrics, and operational events through an appropriate integration.

## 5. Implemented Features

The following features are present in the current application or its deployed frontend.

### 5.1 Authentication

- User login interface.
- Supabase authentication integration.
- Authentication context for managing user state.
- Protected application routes.
- Separate administrative route protection.
- Multi-factor authentication interface and TOTP workflow support.

### 5.2 Student Dashboard

- View available sports equipment.
- Browse sports equipment information.
- View available booking time slots.
- Access booking functionality.
- View personal booking records.
- Track booking and return information.

### 5.3 Administrator Dashboard

- Administrative dashboard.
- Sports equipment management.
- Add and edit sports equipment records.
- Equipment unit management.
- Time slot management.
- Booking management.
- Booking status and return management.

### 5.4 Booking Management

- Booking creation workflow.
- Time-slot selection.
- Booking confirmation interface.
- Booking history through the student interface.
- Return status tracking.

### 5.5 User Interface

- React-based application structure.
- Separate student and administrator interfaces.
- Navigation components.
- Responsive styling.
- Text-based sports equipment listings without image upload or image display functionality.

*Feature availability and end-to-end behaviour should continue to be validated as backend integration and testing progress.*

## 6. Development and Deployment Progress

This section records the work completed so far.

### Phase 1: Application Development

- Established the React frontend application.
- Organized the application into reusable components and pages.
- Developed student and administrator interfaces.
- Implemented authentication-related components and route protection.
- Developed sports equipment and time-slot management interfaces.
- Developed booking and confirmation pages.
- Added student booking history functionality.
- Removed sports equipment image upload and display functionality.

### Phase 2: Backend Architecture

- Selected Supabase as the managed backend platform.
- Configured Supabase connection through environment variables.
- Integrated Supabase authentication into the frontend.
- Established the application structure for managed database access.
- Introduced authentication context and protected routes.

**Remaining work:** Complete and verify the database schema, access policies, and all frontend-to-database operations. The existing Express backend and its JSON-based booking persistence also need to be reviewed and migrated or retired.

### Phase 3: GitHub Integration

The project is maintained in GitHub.

Repository:

[FAST University Sports Issuing System](https://github.com/ahmedumarehman/AWS-UNIVERSITY-SPORTS-ISSUING-SYSTEM)

Completed tasks:

- Created and maintained the Git repository.
- Added project-level `.gitignore` configuration.
- Excluded environment files and dependency/build directories.
- Committed the application source code.
- Resolved divergent local and remote Git history through rebase.
- Successfully pushed the updated application to the `main` branch.

### Phase 4: Vercel Deployment

The React frontend has been successfully deployed to Vercel.

Completed tasks:

- Connected the GitHub repository to Vercel.
- Selected the `client` directory as the project root.
- Configured Create React App as the application framework.
- Configured the build and output settings.
- Added the required frontend environment variables.
- Resolved a React build execution permission issue.
- Successfully deployed the application.

Deployment configuration:

| Configuration | Value |
|---|---|
| Hosting Platform | Vercel |
| Framework | Create React App |
| Root Directory | `client` |
| Build Command | Node-based React build command |
| Output Directory | `build` |
| Source Repository | GitHub |
| Production Branch | `main` |

### Phase 5: AWS Integration

AWS integration is the next major development phase.

The objective is to introduce AWS cloud services into the existing application architecture without unnecessarily replacing the current Supabase backend or Vercel frontend.

AWS CloudWatch is the first proposed service for this phase.

## 7. Environment Configuration

The frontend requires the following environment variables.

Create a `.env` file inside the `client` directory:

```env
REACT_APP_API_BASE_URL=your_api_base_url
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Environment Variable Description

| Variable | Description |
|---|---|
| `REACT_APP_API_BASE_URL` | Base URL for application API requests |
| `REACT_APP_SUPABASE_URL` | Supabase project URL |
| `REACT_APP_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

**Security considerations:**

- Never commit `.env` files to GitHub.
- Configure production environment variables through Vercel.
- Never expose Supabase service-role or secret keys in frontend code.
- Use Supabase Row Level Security to control database access.
- Keep privileged operations on trusted server-side infrastructure.

## 8. Local Development Setup

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- Visual Studio Code (recommended)
- A configured Supabase project

### Clone the Repository

```bash
git clone https://github.com/ahmedumarehman/AWS-UNIVERSITY-SPORTS-ISSUING-SYSTEM.git
```

Navigate into the project:

```bash
cd AWS-UNIVERSITY-SPORTS-ISSUING-SYSTEM
```

### Configure the Frontend

```bash
cd client
npm install
```

Create the `.env` file using the variables described in Section 7.

### Start the React Application

```bash
npm start
```

The development server runs at:

```text
http://localhost:3000
```

### Build the React Application

```bash
npm run build
```

The production build is generated in:

```text
client/build
```

### Legacy Express Backend

The repository also contains an Express backend under `server`.

Its existing JSON-based booking persistence is legacy functionality and is not yet fully migrated to the current Supabase architecture.

It should be treated separately from the deployed React frontend until its API responsibilities and data migration are completed.

## 9. Project Directory Structure

```text
AWS-UNIVERSITY-SPORTS-ISSUING-SYSTEM/
│
├── client/
│   ├── public/
│   │   └── assets/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminRoute.js
│   │   │   ├── EquipmentUnitManagement.js
│   │   │   ├── ProtectedRoute.js
│   │   │   ├── SportsItemManagement.js
│   │   │   └── TimeSlotManagement.js
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   │
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   │
│   │   └── pages/
│   │       ├── AdminDashboard.js
│   │       ├── BookingForm.js
│   │       ├── Confirmation.js
│   │       ├── Dashboard.js
│   │       ├── Login.js
│   │       ├── Mfa.js
│   │       └── MyBookings.js
│   │
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
│
├── server/
│   └── data/
│       └── bookings.json
│
├── .gitignore
└── README.md
```

## 10. Current Development Roadmap

The project is still in progress. The following roadmap describes the remaining work.

### Phase 1: Backend Completion

- [ ] Finalize the Supabase PostgreSQL database schema.
- [ ] Verify relationships between users, equipment, time slots, and bookings.
- [ ] Configure and test Row Level Security policies.
- [ ] Verify student and administrator authorization.
- [ ] Complete all frontend database operations.
- [ ] Resolve remaining legacy Express backend dependencies.
- [ ] Migrate existing JSON-based booking persistence where required.

### Phase 2: Authentication and Security

- [ ] Complete authentication testing.
- [ ] Verify email-based account registration and login.
- [ ] Verify role-based access restrictions.
- [ ] Complete TOTP MFA testing.
- [ ] Verify session management and logout behaviour.
- [ ] Test unauthorized access to protected resources.
- [ ] Review database security policies.

### Phase 3: Application Testing

- [ ] Test student booking workflows.
- [ ] Test administrator equipment management.
- [ ] Test time-slot availability.
- [ ] Verify duplicate booking prevention.
- [ ] Test booking cancellation and return workflows.
- [ ] Test application behaviour across devices.
- [ ] Perform production smoke testing.

### Phase 4: AWS CloudWatch Integration

**Objective:** Introduce AWS CloudWatch to demonstrate cloud monitoring and observability.

Planned activities:

- [ ] Design the AWS monitoring architecture.
- [ ] Configure AWS IAM permissions.
- [ ] Identify application events and metrics worth monitoring.
- [ ] Integrate CloudWatch logging through an appropriate backend or server-side component.
- [ ] Explore CloudWatch custom metrics.
- [ ] Configure CloudWatch dashboards.
- [ ] Configure monitoring alarms where appropriate.
- [ ] Test and document the monitoring integration.

CloudWatch integration will require an appropriate telemetry path. The React application hosted on Vercel will not automatically send its logs to CloudWatch.

### Phase 5: DevOps Improvements

- [ ] Establish a structured Git branching strategy.
- [ ] Configure GitHub Actions for automated build and testing.
- [ ] Improve deployment validation.
- [ ] Configure environment-specific settings.
- [ ] Introduce application health checks.
- [ ] Document deployment and rollback procedures.

### Phase 6: Final Production Readiness

- [ ] Complete end-to-end testing.
- [ ] Review application security.
- [ ] Optimize application performance.
- [ ] Configure a custom domain if required.
- [ ] Complete AWS monitoring integration.
- [ ] Update architecture diagrams and technical documentation.

## 11. Future Enhancements

Potential future improvements include:

- Advanced booking analytics.
- Equipment utilization reports.
- Automated email notifications.
- Improved administrator reporting.
- Advanced monitoring dashboards.
- Automated backup and recovery strategies.
- Serverless backend architecture where appropriate.
- Improved application scalability and availability.

## 12. Project Status

| Area | Current Status |
|---|---|
| React Frontend | Implemented |
| Student Interface | Implemented |
| Admin Interface | Implemented |
| Supabase Integration | In use; further validation required |
| Authentication | Implemented; testing ongoing |
| PostgreSQL | Backend platform selected |
| GitHub Integration | Completed |
| Vercel Hosting | Successfully deployed |
| Legacy Backend Migration | Pending |
| AWS CloudWatch | Planned |
| CI/CD Automation | Planned |
| Production Readiness | In progress |

## 13. Conclusion

The FAST University Sports Issuing System is an ongoing cloud application development project focused on modernizing university sports equipment booking and management.

The project has progressed from its initial full-stack application design to a deployed React frontend using Vercel and a managed Supabase backend.

The next development stage focuses on completing backend integration, strengthening authentication and database security, migrating legacy functionality, and introducing AWS CloudWatch for cloud monitoring and observability.

The ultimate goal is to deliver a secure, maintainable, and scalable university sports management application while demonstrating practical cloud computing and DevOps engineering skills.

---

## Author

**Ahmed Umar Rehman**

GitHub: [ahmedumarehman](https://github.com/ahmedumarehman)

Project Repository: [AWS University Sports Issuing System](https://github.com/ahmedumarehman/AWS-UNIVERSITY-SPORTS-ISSUING-SYSTEM)

**Project Status:** Active Development
