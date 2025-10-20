# जनता दरबार (Janta Darbar)
## Maharashtra State Grievance Management System

A comprehensive web application for managing citizen complaints and grievances in Maharashtra state, built with modern web technologies and featuring Marathi language support.

![Dashboard](https://img.shields.io/badge/Status-Live-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Language](https://img.shields.io/badge/Language-Marathi%20%7C%20Hindi%20%7C%20English-orange)

## 🌟 Features

### 🎯 Core Functionality
- **Citizen Grievance Management**: Complete complaint tracking system
- **Multi-Department Support**: Handle complaints across various government departments
- **Real-time Analytics**: Dashboard with KPIs and performance metrics
- **Officer Management**: Assign and track officer responsibilities
- **Status Tracking**: Real-time updates on complaint resolution

### 🌐 Language Support
- **Marathi** (Primary) - मराठी
- **Hindi** - हिंदी  
- **English** - English
- Dynamic language switching with proper font support

### 📱 User Experience
- **Mobile Responsive**: Optimized for all device sizes
- **Modern UI**: Clean, intuitive interface with Framer Motion animations
- **Fixed Header**: Persistent navigation for better UX
- **Sidebar Navigation**: Easy access to all features
- **Real-time Updates**: Live data refresh and notifications

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different access levels for citizens and officers
- **Data Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: Protection against abuse

## 🏗️ Architecture

### Frontend (React)
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout/         # Header, Sidebar, Layout
│   │   └── UI/             # Buttons, Spinners, Badges
│   ├── contexts/           # React Context for state management
│   ├── pages/              # Main application pages
│   ├── services/           # API service layer
│   └── i18n.js            # Internationalization setup
```

### Backend (Express.js)
```
server/
├── routes/                 # API route handlers
├── middleware/             # Authentication & validation
├── services/               # Business logic services
├── config/                 # Database configuration
├── scripts/                # Database migration scripts
└── utils/                  # Utility functions
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CritCoder/janta-darbar.git
   cd janta-darbar
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb janta_darbar
   
   # Run migrations
   cd server && npm run migrate
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment files
   cp server/env.example server/.env
   cp client/env.local client/.env
   
   # Update database URL and other settings in server/.env
   ```

5. **Start the application**
   ```bash
   # Start backend server (Terminal 1)
   cd server && npm start
   
   # Start frontend client (Terminal 2)
   cd client && npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - Health Check: http://localhost:5001/health

## 📊 Database Schema

### Key Tables
- **users**: Citizen and officer accounts
- **grievances**: Complaint records with full lifecycle tracking
- **departments**: Government departments and their details
- **officers**: Department staff and their assignments
- **events**: Audit trail for all grievance activities
- **media**: File attachments and evidence
- **sla_tracking**: Service level agreement monitoring

## 🎨 UI Components

### Dashboard Features
- **KPI Cards**: Total, Resolved, Pending, and New grievances
- **Status Distribution**: Visual breakdown of complaint statuses
- **Category Distribution**: Complaint type analysis
- **Department Performance**: Resolution rates and response times
- **Real-time Updates**: Live data refresh every 30 seconds

### Navigation
- **Sidebar Menu**: Easy access to all features
- **Fixed Header**: Persistent search and user controls
- **Breadcrumbs**: Clear navigation context
- **Mobile Menu**: Responsive navigation for mobile devices

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Grievances
- `GET /api/grievances` - List grievances
- `POST /api/grievances` - Create new grievance
- `GET /api/grievances/:id` - Get grievance details
- `PUT /api/grievances/:id` - Update grievance

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/trends` - Performance trends

## 🌍 Internationalization

The application supports three languages with proper font rendering:

- **Marathi**: Primary language with Devanagari script
- **Hindi**: Secondary language for broader accessibility  
- **English**: For technical users and documentation

Language switching is available in the header with flag indicators.

## 📱 Mobile Responsiveness

- **Responsive Design**: Works seamlessly on all screen sizes
- **Touch-friendly**: Optimized for mobile interactions
- **Progressive Web App**: Can be installed on mobile devices
- **Offline Support**: Basic functionality available offline

## 🚀 Deployment

### Production Deployment
   ```bash
# Build the application
cd client && npm run build

# Start production server
cd server && npm start
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://localhost:5432/janta_darbar

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=5001
NODE_ENV=production

# External APIs
INTERAKT_API_KEY=your-interakt-api-key
POSTMARK_API_TOKEN=your-postmark-token
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Shambhu Raja Deshai** - Project Lead
- **Development Team** - Full-stack development

## 📞 Support

For support and queries:
- Email: support@jantadarbar.gov.in
- Phone: +91-XXX-XXXX-XXX
- Website: https://jantadarbar.gov.in

## 🙏 Acknowledgments

- Maharashtra State Government
- Open source community
- React and Express.js teams
- PostgreSQL community

---

**जनता दरबार** - Empowering citizens through technology