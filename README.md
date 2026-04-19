<div align="center">

# Sales Approval & Lead Management Portal

### A high-performance MERN-stack portal for hierarchical lead tracking, real-time approvals, and audit transparency.

[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](https://github.com/jayyvarmaa/sales)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-MERN-red?style=for-the-badge)](https://www.mongodb.com/mern-stack)
[![Auth](https://img.shields.io/badge/auth-Session--Based-orange?style=for-the-badge)](https://expressjs.com/en/resources/middleware/session.html)
[![Realtime](https://img.shields.io/badge/realtime-Socket.io-black?style=for-the-badge&logo=socket.io)](https://socket.io/)

[🚀 Features](#-features) • [📦 Setup & Install](#-setup--install) • [🔐 Security](#-security) • [⚙️ Technology Stack](#️-technology-stack) • [🌐 Deployment](#-deployment) • [🤝 Support](#-support)

---

</div>

## 📖 About

The **Sales Approval Portal** is a production-grade enterprise application designed to manage the lifecycle of sales leads across different organizational levels (**Sales Rep**, **Country Manager**, and **Master Admin**). 

It features a custom-built **Session-based Authentication** system (replacing JWT/Auth0 for better server-side control), real-time notification pipelines via Socket.io, and a comprehensive audit trail for every action taken within the system.

🔓 **Hierarchical Access Control** • 🧠 **Session-based Persistence** • 🔄 **Real-time Approval Sync** • 📊 **Performance Analytics**

---

## ✨ Features

### 🏗️ **Lead Management Workflow**
- **Sales Reps**: Create and track leads, submit for review, and receive real-time Feedback.
- **Managers**: Review regional leads, approve/deny with comments, and monitor team performance.
- **Master Admins**: Global oversight across all countries, user management, and system-wide audit logs.

### 🔐 **Identity & Security**
- **Session-based Auth**: Secure server-side sessions stored in MongoDB via `express-session`.
- **RBAC**: Strict Role-Based Access Control enforced at the API and UI levels.
- **Privacy**: Cross-domain cookie security with `SameSite: None` and `Secure` flags for separate deployments.

### 📈 **Intelligence & Monitoring**
- **Audit Logs**: Immutable history of every login, approval decision, and lead creation.
- **Visual Analytics**: Dynamic charts using `Recharts` for conversion rates and revenue distribution.
- **Global Search**: High-performance search across leads, users, and audit records.

### 🔔 **Real-time Interaction**
- **Socket.io Integration**: Instant desktop notifications for lead status updates and mentions.
- **Live Sync**: Dashboards update in real-time without requiring page refreshes when approvals are granted.

---

## 📦 Setup & Install

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- npm or yarn

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jayyvarmaa/sales.git
   cd sales
   ```

2. **Install all dependencies**:
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables**:
   Create a `.env` in the `server` folder:
   ```env
   MONGO_URI=your_mongodb_atlas_uri
   SESSION_SECRET=your_random_secret_key
   FRONTEND_URL=http://localhost:5173
   ```

4. **Seed the Database**:
   ```bash
   npm run seed
   ```

5. **Run the Application**:
   ```bash
   npm run dev
   ```

---

## ⚙️ Technology Stack

| Category | Technology |
|---|---|
| **Frontend** | React 18, Vite, Recharts, React Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Authentication** | express-session, connect-mongo, bcryptjs |
| **Real-time** | Socket.io |
| **Deployment** | Vercel (Split Client/Server) |

---

## 🗂️ Project Layout

| Path | Responsibility |
|---|---|
| `client/src/context` | Global State Management (Auth, Theme, Notifications) |
| `client/src/components` | UI Components (LeadCards, Charts, Layout) |
| `server/routes` | RESTful API Endpoints (Auth, Leads, Audit) |
| `server/models` | Mongoose Schemas (User, Lead, AuditLog) |
| `server/middleware` | Security, RBAC, and Audit tracking middleware |

---

## 📊 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Master Admin** | `master@salesportal.com` | `password123` |
| **US Manager** | `kodi@salesportal.com` | `password123` |
| **US Sales Rep** | `sarah@salesportal.com` | `password123` |

---

## 🌐 Deployment

The project is optimized for deployment on **Vercel** with the following production domains:

- **Frontend**: [sales.jayvarma.site](https://sales.jayvarma.site)
- **Backend API**: [sales-backend.jayvarma.site](https://sales-backend.jayvarma.site)

### Serverless Stability
The backend uses a **Singleton Connection Pattern** for Mongoose, ensuring that serverless function "cold starts" don't exhaust MongoDB connection limits or cause timeouts.

---

## 🤝 Support

### 💖 Show Your Support

If this portal project helped you build a better management system, please consider:

<div align="center">

[![Star this repo](https://img.shields.io/badge/⭐-Star%20this%20repo-yellow?style=for-the-badge&logo=github)](https://github.com/jayyvarmaa/sales)

**Your support fuels the development of more production-grade MERN templates!** ✨

</div>

### 📬 Connect With The Author

- 💼 **GitHub**: [@jayyvarmaa](https://github.com/jayyvarmaa)
- 🔗 **LinkedIn**: [Jay Varma](https://linkedin.com/in/jayyvarmaa)

---

## 📄 License

Licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

### 🌟 Enterprise-Grade Sales Mastery at your Fingertips 🌟

Built by [Jay Varma](https://github.com/jayyvarmaa) | 2026

</div>
