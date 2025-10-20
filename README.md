# जनता दरबार - Janta Darbar Platform

A comprehensive WhatsApp-first grievance management platform built for Maharashtra, featuring end-to-end tracking, approvals, routing, and public-facing impact analytics.

## 🚀 Features

### Core Functionality
- **WhatsApp Integration**: Primary communication channel with Marathi/Hindi/English support
- **End-to-End Tracking**: Complete audit trail with unique ticket IDs
- **Intelligent Routing**: Automatic department assignment based on category and location
- **SLA Monitoring**: Automated escalation system with configurable timeframes
- **Letter Generation**: PDF letters with QR codes and digital signatures
- **Multi-language Support**: Marathi (default), Hindi, and English

### User Roles
- **Citizens**: Submit grievances and receive updates via WhatsApp
- **Intake Agents**: Review, normalize, and tag grievances
- **Approvers**: Accept/reject and sign letters
- **Routing Officers**: Forward to appropriate departments
- **Department Officers**: Acknowledge, resolve, and upload proof
- **Supervisors**: Monitor SLA breaches and escalate
- **Analysts**: Generate insights and reports

### Status Flow
```
NEW → INTAKE → APPROVAL_PENDING → APPROVED → DISPATCHED → 
ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CITIZEN_CONFIRMED → CLOSED
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with modern hooks
- **Framer Motion** for animations and mobile responsiveness
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **i18next** for internationalization

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Redis** for queues and caching
- **JWT** for authentication
- **Multer** for file uploads
- **Puppeteer** for PDF generation
- **QRCode** for QR code generation

### Integrations
- **Interakt** for WhatsApp Business API
- **Postmark** for email notifications
- **AWS S3** for file storage (configurable)

## 📁 Project Structure

```
janta-darbar-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Language)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── server/                 # Node.js backend
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   └── scripts/            # Database migration scripts
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd janta-darbar-platform
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp server/env.example server/.env
   cp client/env.example client/.env
   
   # Edit the .env files with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb janta_darbar
   
   # Run migrations
   cd server
   npm run migrate
   ```

5. **Start the development servers**
   ```bash
   # From project root
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/janta_darbar

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# WhatsApp Business API (Interakt)
INTERAKT_API_KEY=your-interakt-api-key
INTERAKT_WEBHOOK_SECRET=your-webhook-secret

# Email Service (Postmark)
POSTMARK_API_TOKEN=your-postmark-api-token
POSTMARK_FROM_EMAIL=noreply@yourdomain.com

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-s3-bucket

# Redis
REDIS_URL=redis://localhost:6379
```

#### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📱 WhatsApp Integration

### Message Templates

The platform uses pre-approved WhatsApp templates for different scenarios:

1. **Grievance Created**: Confirmation message with ticket ID
2. **Status Updates**: Progress notifications
3. **Resolution**: Completion notification with feedback request
4. **Reminders**: SLA breach notifications

### Supported Languages
- **Marathi** (default): मराठी
- **Hindi**: हिन्दी  
- **English**: English

## 🗄️ Database Schema

### Core Tables
- `users` - Citizen information
- `grievances` - Main grievance records
- `events` - Complete audit trail
- `departments` - Department information
- `officers` - Officer details
- `letters` - Generated letters
- `media` - File attachments
- `tags` - Categorization and deduplication

## 📊 Analytics & Reporting

### Dashboard Metrics
- Total grievances and resolution rates
- Department-wise performance
- SLA compliance tracking
- Category-wise distribution
- Daily trends and patterns

### Export Options
- CSV export for data analysis
- PDF reports for official use
- Real-time analytics dashboard

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers

## 📱 Mobile Responsiveness

The platform is built with mobile-first design principles:
- Responsive layouts for all screen sizes
- Touch-friendly interfaces
- Optimized for WhatsApp mobile usage
- Progressive Web App (PWA) capabilities

## 🚀 Deployment

### Production Setup

1. **Database Setup**
   ```bash
   # Create production database
   createdb janta_darbar_prod
   
   # Run migrations
   NODE_ENV=production npm run migrate
   ```

2. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

3. **Start Production Server**
   ```bash
   cd server
   NODE_ENV=production npm start
   ```

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: support@jantadarbar.com
- WhatsApp: +91-XXXXXXXXXX
- Documentation: [Link to docs]

## 🙏 Acknowledgments

- Built for the people of Maharashtra
- Special thanks to Shambhu Raja Desai
- Community feedback and contributions

---

**जनता दरबार - जनतेसाठी, जनतेकडून, जनतेसोबत** 🇮🇳
