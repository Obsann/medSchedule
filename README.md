# 🏥 MedSchedule

![MedSchedule Banner](frontend/public/hospital_welcome_bg.png)

**MedSchedule** is a modern, unified Medical Duty Scheduling System designed for hospital administration, medical staff (doctors and nurses), and patients. Built on the **MERN stack** (MongoDB, Express, React, Node.js), it provides seamless shift management, departmental oversight, and real-time patient accessibility.

---

## ✨ Key Features

### 🔐 Robust & Secure Authentication
- **Smart Routing:** A single, clean login interface that dynamically routes users based on their credentials.
- **Hospital Staff Portal:** Secure domain-based authentication. Staff must log in using an official `@medschedule.et` email address.
- **Patient Portal:** Public access with standard email/password registration.
- **Email Verification (OTP):** New patient registrations require email verification via a 6-digit OTP code sent using Nodemailer.
- **Google OAuth Integration:** Patients can instantly sign up or log in using Google Identity Services (GIS).
- **Password Recovery:** Secure "Forgot Password" flow with OTP verification.

### 👑 Administrator Dashboard
- **Department Management:** Create, update, and oversee hospital departments (e.g., Cardiology, Neurology) with custom color-coding.
- **Staff Management:** Add, edit, and deactivate doctors and nurses. Automatically links staff profiles to system user accounts.
- **Shift Management:** Schedule morning, afternoon, and night shifts with built-in **overlap prevention** (BR1).
- **Live Statistics:** Real-time metrics on active staff, upcoming shifts, and departmental loads.

### 🩺 Medical Staff Interface
- **My Schedule:** Doctors and nurses can view their upcoming, current, and past assigned shifts.
- **Profile Management:** View and update personal information, profile photos (via Cloudinary), and contact details.

### 🧑‍⚕️ Patient Experience
- **Beautiful Welcome Page:** A modern, glassmorphism-styled landing page.
- **Find a Doctor:** Browse hospital departments and view active medical professionals and their specialties.
- **Today's Schedule:** Check hospital department schedules to see exactly which doctors and nurses are on duty today.
- **Privacy First:** Staff personal phone numbers and emails are hidden from patients; patients are directed to contact the Medical Secretary.
- **Multi-language Support:** Google Translate integration included for instant localization (e.g., Afaan Oromo).

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Date Formatting:** [date-fns](https://date-fns.org/)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/) & [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs)
- **Security:** [BcryptJS](https://www.npmjs.com/package/bcryptjs) (Hashing) & In-memory Rate Limiting
- **Emailing:** [Nodemailer](https://nodemailer.com/) & [Deep Email Validator](https://www.npmjs.com/package/deep-email-validator)
- **File Uploads:** [Cloudinary](https://cloudinary.com/) & [Multer](https://www.npmjs.com/package/multer)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string (Local or Atlas)
- Google Cloud Console Account (for OAuth Client ID)
- Cloudinary Account (for image uploads)
- Gmail / SMTP Account (for sending OTP emails)

### 1. Clone & Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

**Backend (`server/.env`)**
Create a `.env` file in the `server` directory:
```env
PORT=5123
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=8h
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
STAFF_EMAIL_DOMAIN=medschedule.et
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
SMTP_SERVICE=gmail
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Frontend (`frontend/.env`)**
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5123/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 3. Database Seeding
To populate the database with initial departments, staff, verified users, and a month's worth of dummy shifts:
```bash
cd server
npm run seed
```

### 4. Run the Application

You will need two terminal windows.

**Start the Backend:**
```bash
cd server
npm run dev
```
*The API will run on `http://localhost:5123`*

**Start the Frontend:**
```bash
cd frontend
npm run dev
```
*The UI will run on `http://localhost:5173`*

---

## 🔑 Demo Credentials (If Seeded)

**Hospital Staff (Domain Login)**
*   **Admin:** `admin@medschedule.et` / `admin123`
*   **Doctor:** `abebe.kebede@medschedule.et` / `staff123`
*   **Nurse:** `meron.girma@medschedule.et` / `staff123`

**Patient Portal (Standard Login)**
*   **Username:** `patient1` 
*   **Password:** `patient123`

---

## 📁 Project Structure

```text
medSchedule/
├── frontend/                 # React Application
│   ├── public/               # Static assets (images, icons)
│   ├── src/
│   │   ├── api/              # Fetch wrappers and API endpoint definitions
│   │   ├── components/       # Reusable UI components & Layouts
│   │   ├── context/          # React Context (AuthContext, DataContext)
│   │   ├── pages/            # Main views (Welcome, Dashboard, Admin, Staff, Patient)
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── App.tsx           # Router and App Provider wrappers
│   └── vite.config.ts
│
└── server/                   # Node.js / Express API
    ├── config/               # Database & Cloudinary connection setup
    ├── middleware/           # JWT Auth, Role verification, and Rate Limiting
    ├── models/               # Mongoose Schemas (User, Staff, Dept, Shift, Patient)
    ├── routes/               # Express API routers
    ├── utils/                # Utilities (Nodemailer, Email validation)
    ├── index.js              # Entry point
    └── seed.js               # Database population script
```

---
*Built as a comprehensive solution for hospital duty schedule management.*
