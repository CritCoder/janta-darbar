const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/janta_darbar'
});

const createComprehensiveTables = async () => {
  try {
    console.log('🚀 Starting comprehensive database migration...');

    // 1. Users table (enhanced with role and additional fields)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(15) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        language VARCHAR(10) DEFAULT 'mr',
        role VARCHAR(20) DEFAULT 'citizen',
        consent_flags JSONB DEFAULT '{}',
        blocked BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Departments table (enhanced)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        name_marathi VARCHAR(255),
        name_hindi VARCHAR(255),
        district VARCHAR(100),
        contact_whatsapp VARCHAR(15),
        contact_email VARCHAR(255),
        escalation_contact VARCHAR(15),
        address TEXT,
        description TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Officers table (enhanced)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS officers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        department_id INTEGER REFERENCES departments(id),
        whatsapp VARCHAR(15),
        email VARCHAR(255),
        phone VARCHAR(15),
        address TEXT,
        designation VARCHAR(100),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Grievances table (enhanced with all required fields)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grievances (
        id SERIAL PRIMARY KEY,
        ticket_id VARCHAR(50) UNIQUE NOT NULL,
        citizen_id INTEGER REFERENCES users(id),
        summary TEXT,
        description TEXT,
        language VARCHAR(10) DEFAULT 'mr',
        category VARCHAR(100),
        subcategory VARCHAR(100),
        severity VARCHAR(20) DEFAULT 'medium',
        priority VARCHAR(20) DEFAULT 'normal',
        pincode VARCHAR(10),
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        address TEXT,
        status VARCHAR(50) DEFAULT 'NEW',
        department_id INTEGER REFERENCES departments(id),
        approver_id INTEGER,
        assigned_officer_id INTEGER REFERENCES officers(id),
        assigned_at TIMESTAMP,
        resolved_at TIMESTAMP,
        closed_at TIMESTAMP,
        resolution_notes TEXT,
        citizen_satisfaction INTEGER CHECK (citizen_satisfaction >= 1 AND citizen_satisfaction <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Events table for audit trail (enhanced)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255),
        description TEXT,
        payload_json JSONB,
        actor_id INTEGER,
        actor_type VARCHAR(50),
        actor_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Letters table (enhanced)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS letters (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        outward_no VARCHAR(100) UNIQUE NOT NULL,
        inward_no VARCHAR(100),
        pdf_url TEXT,
        qr_code_url TEXT,
        signed_by INTEGER,
        signed_at TIMESTAMP,
        letter_type VARCHAR(50) DEFAULT 'outward',
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Media table (enhanced)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        url TEXT NOT NULL,
        type VARCHAR(50),
        original_name VARCHAR(255),
        file_size INTEGER,
        mime_type VARCHAR(100),
        exif_json JSONB,
        uploaded_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Tags table for deduplication and keywords
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        tag VARCHAR(100) NOT NULL,
        tag_type VARCHAR(50) DEFAULT 'keyword',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. SLA tracking table (enhanced)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sla_tracking (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        stage VARCHAR(50) NOT NULL,
        target_time TIMESTAMP,
        actual_time TIMESTAMP,
        breached BOOLEAN DEFAULT FALSE,
        breach_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. OTP verification table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(15) UNIQUE NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 11. Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        grievance_id INTEGER REFERENCES grievances(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        message TEXT,
        read BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 12. WhatsApp messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        phone VARCHAR(15) NOT NULL,
        message TEXT,
        template_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP,
        error_message TEXT
      )
    `);

    // 13. Analytics cache table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_cache (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(255) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 14. System settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        updated_by INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 15. User sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create comprehensive indexes for better performance
    console.log('📊 Creating indexes...');
    
    // Grievances indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_citizen ON grievances(citizen_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(department_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_officer ON grievances(assigned_officer_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_category ON grievances(category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_severity ON grievances(severity)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_created ON grievances(created_at)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_ticket ON grievances(ticket_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_pincode ON grievances(pincode)`);

    // Events indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_grievance ON events(grievance_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_actor ON events(actor_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)`);

    // Users indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(blocked)`);

    // Officers indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_officers_department ON officers(department_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_officers_active ON officers(active)`);

    // Departments indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(active)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_departments_district ON departments(district)`);

    // Media indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_media_grievance ON media(grievance_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_media_type ON media(type)`);

    // Tags indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tags_grievance ON tags(grievance_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag)`);

    // Notifications indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`);

    // WhatsApp messages indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_grievance ON whatsapp_messages(grievance_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_phone ON whatsapp_messages(phone)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_status ON whatsapp_messages(status)`);

    // SLA tracking indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sla_grievance ON sla_tracking(grievance_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sla_breached ON sla_tracking(breached)`);

    // Analytics cache indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_analytics_key ON analytics_cache(cache_key)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_analytics_expires ON analytics_cache(expires_at)`);

    // User sessions indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at)`);

    console.log('✅ Comprehensive database tables created successfully');
    console.log('📊 All indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating comprehensive tables:', error);
    throw error;
  }
};

const insertInitialData = async () => {
  try {
    console.log('🌱 Inserting initial data...');

    // Insert default departments
    const departments = [
      { 
        name: 'Water Resources', 
        name_marathi: 'जलसंपदा', 
        name_hindi: 'जल संसाधन', 
        district: 'Pune',
        contact_whatsapp: '+919876543210',
        contact_email: 'water@pune.gov.in'
      },
      { 
        name: 'Public Works', 
        name_marathi: 'रस्ता', 
        name_hindi: 'सार्वजनिक निर्माण', 
        district: 'Pune',
        contact_whatsapp: '+919876543211',
        contact_email: 'pwd@pune.gov.in'
      },
      { 
        name: 'Electricity', 
        name_marathi: 'वीज', 
        name_hindi: 'बिजली', 
        district: 'Pune',
        contact_whatsapp: '+919876543212',
        contact_email: 'electricity@pune.gov.in'
      },
      { 
        name: 'Health', 
        name_marathi: 'आरोग्य', 
        name_hindi: 'स्वास्थ्य', 
        district: 'Pune',
        contact_whatsapp: '+919876543213',
        contact_email: 'health@pune.gov.in'
      },
      { 
        name: 'Sanitation', 
        name_marathi: 'स्वच्छता', 
        name_hindi: 'स्वच्छता', 
        district: 'Pune',
        contact_whatsapp: '+919876543214',
        contact_email: 'sanitation@pune.gov.in'
      },
      { 
        name: 'Women & Child Development', 
        name_marathi: 'महिला व बालविकास', 
        name_hindi: 'महिला एवं बाल विकास', 
        district: 'Pune',
        contact_whatsapp: '+919876543215',
        contact_email: 'wcd@pune.gov.in'
      },
      { 
        name: 'Police', 
        name_marathi: 'पोलीस', 
        name_hindi: 'पुलिस', 
        district: 'Pune',
        contact_whatsapp: '+919876543216',
        contact_email: 'police@pune.gov.in'
      },
      { 
        name: 'Revenue', 
        name_marathi: 'महसूल', 
        name_hindi: 'राजस्व', 
        district: 'Pune',
        contact_whatsapp: '+919876543217',
        contact_email: 'revenue@pune.gov.in'
      },
      { 
        name: 'Education', 
        name_marathi: 'शिक्षण', 
        name_hindi: 'शिक्षा', 
        district: 'Pune',
        contact_whatsapp: '+919876543218',
        contact_email: 'education@pune.gov.in'
      }
    ];

    for (const dept of departments) {
      await pool.query(`
        INSERT INTO departments (name, name_marathi, name_hindi, district, contact_whatsapp, contact_email)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [dept.name, dept.name_marathi, dept.name_hindi, dept.district, dept.contact_whatsapp, dept.contact_email]);
    }

    // Insert default admin user
    await pool.query(`
      INSERT INTO users (phone, name, email, role, language)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role
    `, ['+919876543210', 'Admin User', 'admin@jantadarbar.com', 'admin', 'mr']);

    // Insert system settings
    const settings = [
      { key: 'app_name', value: 'Janta Darbar', description: 'Application name' },
      { key: 'app_version', value: '1.0.0', description: 'Application version' },
      { key: 'sla_critical_hours', value: '2', description: 'SLA for critical issues (hours)' },
      { key: 'sla_high_hours', value: '24', description: 'SLA for high priority issues (hours)' },
      { key: 'sla_medium_hours', value: '72', description: 'SLA for medium priority issues (hours)' },
      { key: 'sla_low_hours', value: '168', description: 'SLA for low priority issues (hours)' },
      { key: 'whatsapp_enabled', value: 'true', description: 'WhatsApp notifications enabled' },
      { key: 'email_enabled', value: 'true', description: 'Email notifications enabled' },
      { key: 'auto_assignment', value: 'true', description: 'Automatic officer assignment enabled' }
    ];

    for (const setting of settings) {
      await pool.query(`
        INSERT INTO system_settings (key, value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          description = EXCLUDED.description
      `, [setting.key, setting.value, setting.description]);
    }

    console.log('✅ Initial data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting initial data:', error);
    throw error;
  }
};

const runComprehensiveMigration = async () => {
  try {
    await createComprehensiveTables();
    await insertInitialData();
    console.log('🎉 Comprehensive database migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  runComprehensiveMigration();
}

module.exports = { createComprehensiveTables, insertInitialData, runComprehensiveMigration };

