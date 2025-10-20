const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/janta_darbar'
});

const createTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(15) UNIQUE NOT NULL,
        name VARCHAR(255),
        language VARCHAR(10) DEFAULT 'mr',
        consent_flags JSONB DEFAULT '{}',
        blocked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Departments table
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
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Officers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS officers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        department_id INTEGER REFERENCES departments(id),
        whatsapp VARCHAR(15),
        email VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Grievances table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grievances (
        id SERIAL PRIMARY KEY,
        ticket_id VARCHAR(50) UNIQUE NOT NULL,
        citizen_id INTEGER REFERENCES users(id),
        summary TEXT,
        description TEXT,
        language VARCHAR(10) DEFAULT 'mr',
        category VARCHAR(100),
        severity VARCHAR(20) DEFAULT 'medium',
        pincode VARCHAR(10),
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        status VARCHAR(50) DEFAULT 'NEW',
        department_id INTEGER REFERENCES departments(id),
        approver_id INTEGER,
        assigned_officer_id INTEGER REFERENCES officers(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Events table for audit trail
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        type VARCHAR(100) NOT NULL,
        payload_json JSONB,
        actor_id INTEGER,
        actor_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Letters table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS letters (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        outward_no VARCHAR(100) UNIQUE NOT NULL,
        pdf_url TEXT,
        qr_code_url TEXT,
        signed_by INTEGER,
        signed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Media table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        url TEXT NOT NULL,
        type VARCHAR(50),
        exif_json JSONB,
        uploaded_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tags table for deduplication and keywords
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        tag VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // SLA tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sla_tracking (
        id SERIAL PRIMARY KEY,
        grievance_id INTEGER REFERENCES grievances(id),
        stage VARCHAR(50) NOT NULL,
        target_time TIMESTAMP,
        actual_time TIMESTAMP,
        breached BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_citizen ON grievances(citizen_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(department_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_grievance ON events(grievance_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tags_grievance ON tags(grievance_id)`);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.end();
  }
};

// Insert initial data
const insertInitialData = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/janta_darbar'
  });

  try {
    // Insert default departments
    const departments = [
      { name: 'Water Resources', name_marathi: 'जलसंपदा', name_hindi: 'जल संसाधन', district: 'Pune' },
      { name: 'Public Works', name_marathi: 'रस्ता', name_hindi: 'सार्वजनिक निर्माण', district: 'Pune' },
      { name: 'Electricity', name_marathi: 'वीज', name_hindi: 'बिजली', district: 'Pune' },
      { name: 'Health', name_marathi: 'आरोग्य', name_hindi: 'स्वास्थ्य', district: 'Pune' },
      { name: 'Sanitation', name_marathi: 'स्वच्छता', name_hindi: 'स्वच्छता', district: 'Pune' },
      { name: 'Women & Child Development', name_marathi: 'महिला व बालविकास', name_hindi: 'महिला एवं बाल विकास', district: 'Pune' },
      { name: 'Police', name_marathi: 'पोलीस', name_hindi: 'पुलिस', district: 'Pune' },
      { name: 'Revenue', name_marathi: 'महसूल', name_hindi: 'राजस्व', district: 'Pune' },
      { name: 'Education', name_marathi: 'शिक्षण', name_hindi: 'शिक्षा', district: 'Pune' }
    ];

    for (const dept of departments) {
      await pool.query(`
        INSERT INTO departments (name, name_marathi, name_hindi, district)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [dept.name, dept.name_marathi, dept.name_hindi, dept.district]);
    }

    console.log('✅ Initial data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting initial data:', error);
  } finally {
    await pool.end();
  }
};

// Run migrations
const runMigrations = async () => {
  await createTables();
  await insertInitialData();
};

if (require.main === module) {
  runMigrations();
}

module.exports = { createTables, insertInitialData, runMigrations };
