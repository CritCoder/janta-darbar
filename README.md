# Janta Darbar - Grievance Management System

A comprehensive grievance management system built with React frontend and Node.js backend, designed to handle citizen complaints and government responses efficiently.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database
- Git

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shanbhuraje
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment file
   cp server/env.example server/env.local
   
   # Edit server/env.local with your database and API credentials
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   cd server
   node scripts/migrate.js
   ```

### Running the Application

#### Start the Backend Server
```bash
cd server
node index.js
```
The server will start on `http://localhost:5001`

#### Start the Frontend Client
```bash
cd client
npm start
```
The client will start on `http://localhost:3000`

### 🏗️ Project Structure

```
shanbhuraje/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── lib/            # Utility functions
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic
│   ├── config/             # Database configuration
│   └── package.json
├── tests/                  # Test files
└── README.md
```

### 🔧 API Endpoints

- **Authentication**: `/api/auth/*`
- **Grievances**: `/api/grievances/*`
- **Departments**: `/api/departments/*`
- **Officers**: `/api/officers/*`
- **Analytics**: `/api/analytics/*`
- **WhatsApp**: `/api/whatsapp/*`
- **Upload**: `/api/upload/*`

### 🧪 Testing

```bash
# Run comprehensive tests
npm test

# Run specific test suites
npx playwright test tests/otp-authentication.spec.js
npx playwright test tests/platform-comprehensive.spec.js
```

### 📱 Features

- **Citizen Portal**: Submit grievances with media attachments
- **Officer Dashboard**: Manage and respond to grievances
- **Admin Panel**: System administration and analytics
- **WhatsApp Integration**: Automated notifications
- **Multi-language Support**: Marathi and English
- **Real-time Updates**: Live status tracking
- **File Upload**: Document and image attachments
- **Analytics Dashboard**: Performance metrics and insights

### 🔐 Authentication

The system uses OTP-based authentication:
1. Enter phone number
2. Receive OTP via WhatsApp/SMS
3. Verify OTP to access the system

### 🌐 Environment Variables

Key environment variables in `server/env.local`:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/janta_darbar

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5001
NODE_ENV=development

# WhatsApp API
INTERAKT_API_KEY=your-interakt-api-key

# Email Service
POSTMARK_API_TOKEN=your-postmark-api-token

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket
```

### 🚀 Deployment

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy server**
   ```bash
   cd server
   npm start
   ```

### 📞 Support

For technical support or questions, please contact the development team.

### 📄 License

This project is licensed under the MIT License.

---

**Note**: Make sure both the client (port 3000) and server (port 5001) are running for the application to work properly.