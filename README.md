# SQVS — Student Qualification Verification System - **Project**

A full-stack web application that allows students to register their academic qualifications, institutions to enter and verify records, external organizations to request verification, and ministry officials to oversee the entire ecosystem.

---

## 🌐 Live Demo

[https://sqvs.vercel.app/](https://sqvs.vercel.app/)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router v7, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT (HTTP-only cookies), bcryptjs |
| File handling | Multer, PDFKit, QRCode, ExcelJS |

---

## Project Structure

```
sqvs-main/
├── frontEnd/          # React + Vite client
│   └── src/
│       ├── pages/
│       │   ├── admin/      # Ministry official views
│       │   ├── staff/      # Institution staff views
│       │   ├── student/    # Student views
│       │   └── verifier/   # External verifier views
│       ├── components/
│       └── context/
└── server/            # Express API
    ├── controllers/
    ├── routes/
    ├── middleware/
    ├── config/        # DB config, schema, seed data
    └── utils/
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+

### 1. Database Setup

```bash
mysql -u root -p < server/config/database_schema.sql
mysql -u root -p < server/config/data_seeded.sql
```

### 2. Backend

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=SQVS
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

### 3. Frontend

```bash
cd frontEnd
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Roles & Login Credentials

All seed accounts use the password: **`password123`**

The login page requires you to select a role before entering credentials.

---

### 🏛️ Admin (Ministry Official)

Ministry officials approve institutions and verifiers, manage the system, and view analytics/audit logs.

| Name | Email | Password |
|---|---|---|
| Rajesh Kumar Sharma | `rajesh.sharma@gov.in` | `password123` |
| Priya Nair | `priya.nair@gov.in` | `password123` |
| Sanjay Kumar Gupta | `sanjay.gupta@gov.in` | `password123` |
| Meena Kumari Verma | `meena.verma@gov.in` | `password123` |

---

### 🏫 Staff (Institution Staff)

Institution staff can enter qualifications, verify records, and manage their team. Each staff member has a sub-role: **Administrator**, **Verifier**, or **Data Entry Operator**.

> Only staff from **Approved** institutions can log in.

**Delhi Technological University**

| Name | Email | Sub-Role |
|---|---|---|
| Amit Kumar Tiwari | `amit.tiwari@dtu.ac.in` | Administrator |
| Sneha Singh Rathore | `sneha.rathore@dtu.ac.in` | Verifier |
| Manish Yadav | `manish.yadav@dtu.ac.in` | Data Entry Operator |

**Mumbai Commerce College**

| Name | Email | Sub-Role |
|---|---|---|
| Rohit Mehta | `rohit.mehta@mumbaicommerce.edu` | Administrator |
| Kavita Sharma | `kavita.sharma@mumbaicommerce.edu` | Verifier |
| Nilesh Patil | `nilesh.patil@mumbaicommerce.edu` | Data Entry Operator |

**Bangalore Science Academy**

| Name | Email | Sub-Role |
|---|---|---|
| Suresh Babu Nair | `suresh.nair@bsacademy.edu` | Administrator |
| Divya Krishnamurthy | `divya.k@bsacademy.edu` | Verifier |
| Ravi Shankar Gowda | `ravi.gowda@bsacademy.edu` | Data Entry Operator |

**Hyderabad Tech University**

| Name | Email | Sub-Role |
|---|---|---|
| Venkat Reddy | `venkat.reddy@htuniv.edu.in` | Administrator |
| Anitha Padmanabhan | `anitha.p@htuniv.edu.in` | Verifier |
| Srikanth Babu | `srikanth.babu@htuniv.edu.in` | Data Entry Operator |

**Kolkata Management School**

| Name | Email | Sub-Role |
|---|---|---|
| Debashish Banerjee | `debashish.b@kms.edu.in` | Administrator |
| Rina Chakraborty | `rina.chakraborty@kms.edu.in` | Verifier |
| Arnab Ghosh | `arnab.ghosh@kms.edu.in` | Data Entry Operator |

> Password for all staff: **`password123`**

---

### 🎓 Student

Students can view their qualifications, track verification requests made about them, and report errors.

| Name | Email | NED ID |
|---|---|---|
| Anil Kumar Ahirwar | `anil.ahirwar@gmail.com` | NED-Q450J-L9GNI |
| Rahul Gupta | `rahul.gupta@gmail.com` | NED-PBYDC-W2ZDW |
| Neha Sharma | `neha.sharma97@gmail.com` | NED-JP2XB-P75NJ |
| Aman Singh Rathore | `aman.rathore@gmail.com` | NED-5QSFR-R64OP |
| Priya Venkatesh | `priya.venkatesh@gmail.com` | NED-BKFWM-YNECU |
| Mohammed Irfan Khan | `irfan.khan@gmail.com` | NED-Z9L5K-2HIV9 |
| Suman Das | `suman.das@gmail.com` | NED-O2YTK-92JME |
| Hardik Patel | `hardik.patel@gmail.com` | NED-LJFWN-H3E96 |
| Ankita Joshi | `ankita.joshi@gmail.com` | NED-PWJS5-322RG |
| Vikram Srivastava | `vikram.srivas@gmail.com` | NED-61QF0-K7EZR |
| Pooja Mishra | `pooja.mishra@gmail.com` | NED-JZBWC-OPVJ3 |

> Password for all students: **`password123`**

---

### 🔍 Verifier (External Organization)

External verifiers (employers, universities, immigration agencies) submit paid verification requests for student qualifications.

> Only **Approved** verifiers can log in.

| Organization | Email | Type |
|---|---|---|
| Tata Consultancy Services | `bgv@tcs.com` | Employer |
| Infosys Limited | `bgv@infosys.com` | Employer |
| Wipro Technologies | `verification@wipro.com` | Employer |
| HCL Technologies | `bgv@hcltech.com` | Employer |
| Tech Mahindra | `verify@techmahindra.com` | Employer |
| University of British Columbia | `admissions@ubc.ca` | University |
| Imperial College London | `intl.verify@imperial.ac.uk` | University |
| Global Visa & Immigration Svcs. | `india@globalvisa.ae` | Immigration |

> Password for all verifiers: **`password123`**

---

## API Overview

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login (body: `{ email, password, role }`) |
| POST | `/auth/register` | Register student, verifier, or institution |
| GET | `/auth/me` | Get current user |
| POST | `/auth/logout` | Logout |
| GET | `/student/*` | Student-specific routes (auth required) |
| GET | `/staff/*` | Staff-specific routes (auth required) |
| GET | `/verifier/*` | Verifier-specific routes (auth required) |
| GET | `/admin/*` | Admin-specific routes (auth required) |
| GET | `/public/*` | Public certificate verification (no auth) |

Auth is cookie-based (HTTP-only JWT). All protected routes require the cookie to be present.

---

## Key Features

- **Qualification management** — institutions enter and verify student certificates
- **Verification requests** — external organizations request credential checks with fee payment
- **Certificate issuance** — digitally signed PDF certificates with QR codes for public verification
- **Institution & verifier onboarding** — self-registration with ministry approval workflow
- **Audit logging** — all login and data-change events are recorded
- **Analytics dashboard** — admin view with charts (Recharts) for system-wide stats
- **Database transactions** — atomic operations for request + payment creation, with rollback on failure (see `transaction_explanation.md`)
- **Notifications** — in-app notification system for status updates

---

## Verification Fees (Seed Data)

| Purpose | Fee (₹) | Processing Days |
|---|---|---|
| Employment | 500 | 5 |
| Higher Education | 400 | 4 |
| Immigration | 800 | 7 |
| Scholarship | 300 | 3 |
| Government Job | 600 | 6 |

---

## Notes

- Staff accounts at **Pending** or **Rejected** institutions cannot log in.
- Verifier accounts with **Pending** or **Rejected** status cannot log in.
- New institution registrations start with `Pending` status and require admin approval before staff can access the system.
- The NED ID is a unique national education identifier auto-generated on student registration.
- Public certificate verification is available at `/certificate-verify` without login.
