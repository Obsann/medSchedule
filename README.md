# MedSchedule

MedSchedule is a modern, unified Medical Duty Scheduling System designed for hospital administration, medical staff (doctors and nurses), and patients. Built on the MERN stack (MongoDB, Express, React, Node.js), it provides seamless shift management, departmental oversight, and patient accessibility.

## 🌟 Features

### 🔐 Unified, Role-Based Authentication
*   **Smart Routing Login:** A single, clean login interface that dynamically routes users based on their credentials.
*   **Hospital Staff Portal:** Secure domain-based authentication. Staff must log in using an official `@medSchedule.et` email address.
*   **Patient Portal:** Public access with standard username/password registration.
*   **Google OAuth Integration:** Patients can instantly sign up or log in using Google Identity Services (GIS).

### 🏥 Administrator Dashboard
*   **Department Management:** Create, update, and oversee hospital departments (e.g., Cardiology, Neurology).
*   **Staff Management:** Add, edit, and deactivate doctors and nurses. Automatically links staff profiles to system user accounts.
*   **Shift Management:** Schedule morning, afternoon, and night shifts. Track completed and canceled shifts.
*   **Live Statistics:** Real-time metrics on active staff, upcoming shifts, and departmental loads.

### ⚕️ Medical Staff Interface
*   **My Schedule:** Doctors and nurses can view their upcoming, current, and past assigned shifts.
*   **Profile Management:** View assigned department, specialization, and contact information.

### 🧑‍⚕️ Patient Experience
*   **Find a Doctor:** Browse hospital departments and view active medical professionals and their specialties.
*   **Schedule Viewer:** Check hospital department schedules to see when specific doctors are on duty.

---

## 🛠️ Technology Stack

**Frontend**
*   [React 19](https://react.dev/)
*   [Vite](https://vitejs.dev/)
*   [Tailwind CSS 4](https://tailwindcss.com/)
*   [React Router 7](https://reactrouter.com/)
*   [Lucide React](https://lucide.dev/) (Iconography)

**Backend**
*   [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
*   [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
*   [JSON Web Tokens (JWT)](https://jwt.io/)
*   [BcryptJS](https://www.npmjs.com/package/bcryptjs) (Password Hashing)
*   [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   MongoDB URI (Local or Atlas)
*   Google Cloud Console Account (for OAuth Client ID)

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
STAFF_EMAIL_DOMAIN=medSchedule.et
```

**Frontend (`frontend/.env`)**
Create a `.env` file in the `frontend` directory:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 3. Database Seeding
To populate the database with initial departments, staff, users, and dummy shifts:
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
*   Admin: `admin@medSchedule.et` / `admin123`
*   Doctor: `abebe.kebede@medSchedule.et` / `staff123`
*   Nurse: `meron.girma@medSchedule.et` / `staff123`

**Patient**
*   Patient: `patient1` / `patient123`

---

## 📁 Project Structure

```text
medSchedule/
├── frontend/                 # React Application
│   ├── src/
│   │   ├── api/              # Fetch wrappers and API endpoint definitions
│   │   ├── components/       # Reusable UI components & Layouts
│   │   ├── context/          # React Context (AuthContext, DataContext)
│   │   ├── pages/            # Main views (Dashboard, Admin, Staff, Patient)
│   │   ├── types.ts          # TypeScript interfaces
│   │   └── App.tsx           # Router and App Provider wrappers
│   └── vite.config.ts
│
└── server/                   # Node.js / Express API
    ├── config/               # Database connection setup
    ├── middleware/           # JWT Auth and Role verification
    ├── models/               # Mongoose Schemas (User, Staff, Dept, Shift)
    ├── routes/               # Express API routers
    ├── index.js              # Entry point
    └── seed.js               # Database population script
```
