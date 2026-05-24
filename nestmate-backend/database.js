const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nestmate.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const database = getDB();

  // Create tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'student',
      phone TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT,
      amenities TEXT,
      image_path TEXT,
      is_approved INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      move_in_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id) REFERENCES listings(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS admin_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT,
      done_by INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      student_phone TEXT NOT NULL,
      message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id) REFERENCES listings(id)
    );

    CREATE TABLE IF NOT EXISTS otp_store (
      phone TEXT PRIMARY KEY,
      otp TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  // Migration for existing users table
  try {
    database.exec("ALTER TABLE users ADD COLUMN phone TEXT UNIQUE");
  } catch (e) {
    // Column already exists or other error
  }
  
  // Make email and password nullable for OTP users (if they were NOT NULL previously)
  // SQLite doesn't support ALTER COLUMN, but since it's a demo we'll assume the new CREATE TABLE
  // will handle new DBs, and for existing DBs, we'll just handle it in JS or leave it.

  // Seed admin user if not exists
  const adminExists = database.prepare('SELECT id FROM users WHERE email = ?').get('admin@nestmate.com');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    database.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    ).run('Admin', 'admin@nestmate.com', hashedPassword, 'admin');
    console.log('✅ Admin user seeded: admin@nestmate.com / admin123');
  }

  // Seed some demo listings if none exist (so the browse page has content)
  const listingCount = database.prepare('SELECT COUNT(*) as count FROM listings').get();
  if (listingCount.count === 0) {
    const adminUser = database.prepare('SELECT id FROM users WHERE email = ?').get('admin@nestmate.com');

    // Seed a demo owner
    const ownerExists = database.prepare('SELECT id FROM users WHERE email = ?').get('owner@nestmate.com');
    let ownerId;
    if (!ownerExists) {
      const ownerPassword = bcrypt.hashSync('owner123', 10);
      const ownerInsert = database.prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
      ).run('Demo Owner', 'owner@nestmate.com', ownerPassword, 'owner');
      ownerId = ownerInsert.lastInsertRowid;
      console.log('✅ Demo owner seeded: owner@nestmate.com / owner123');
    } else {
      ownerId = ownerExists.id;
    }

    // Seed demo listings
    const demoListings = [
      {
        owner_id: ownerId,
        title: 'Sunset Residency PG',
        location: 'IIT Delhi Campus, New Delhi',
        price: 12500,
        description: 'A fully furnished PG near IIT Delhi campus with all modern amenities. Safe, secure and comfortable.',
        amenities: 'WiFi,AC,Furnished,Security',
        image_path: null,
        is_approved: 1,
        is_available: 1
      },
      {
        owner_id: ownerId,
        title: 'Urban Heights PG',
        location: 'Koramangala, Bangalore',
        price: 8000,
        description: 'Budget-friendly PG in the heart of Koramangala. Food included. Walking distance from tech parks.',
        amenities: 'WiFi,Food Included,Laundry,Cleaning',
        image_path: null,
        is_approved: 1,
        is_available: 1
      },
      {
        owner_id: ownerId,
        title: 'The Scholars Hub',
        location: 'Vasant Vihar, Mumbai',
        price: 15000,
        description: 'Premium student housing with gym, security and high-speed internet. Perfect for serious students.',
        amenities: 'WiFi,AC,Gym,Security,Furnished',
        image_path: null,
        is_approved: 1,
        is_available: 1
      },
      {
        owner_id: ownerId,
        title: 'Heritage Loft Studio',
        location: 'Banjara Hills, Hyderabad',
        price: 10000,
        description: 'Independent studio apartment with modern interiors. Peaceful neighbourhood, great connectivity.',
        amenities: 'WiFi,AC,Parking,Furnished',
        image_path: null,
        is_approved: 1,
        is_available: 1
      }
    ];

    const insertListing = database.prepare(`
      INSERT INTO listings (owner_id, title, location, price, description, amenities, image_path, is_approved, is_available)
      VALUES (@owner_id, @title, @location, @price, @description, @amenities, @image_path, @is_approved, @is_available)
    `);

    for (const listing of demoListings) {
      insertListing.run(listing);
    }
    console.log('✅ Demo listings seeded');
  }

  console.log('✅ Database initialized successfully');
}

module.exports = { getDB, initDB };
