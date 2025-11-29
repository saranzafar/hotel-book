// src/database/db.js
import * as SQLite from 'expo-sqlite';

let db = null;

// Initialize database
export const initDB = async () => {
    try {
        db = await SQLite.openDatabaseAsync('HotelMess.db');
        console.log('✅ Database opened successfully');
        await createTables();
        return db;
    } catch (error) {
        console.error('❌ Error opening database:', error);
        throw error;
    }
};

// Create all tables
const createTables = async () => {
    try {
        // Clients table
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        address TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `);
        console.log('✅ Clients table created');

        // Mess subscriptions table
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS mess_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        totalDays INTEGER NOT NULL,
        planType TEXT,
        totalAmount DECIMAL NOT NULL,
        amountPaid DECIMAL DEFAULT 0,
        isActive BOOLEAN DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY(clientId) REFERENCES clients(id)
      );
    `);
        console.log('✅ Mess subscriptions table created');

        // Payments table
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriptionId INTEGER NOT NULL,
        amount DECIMAL NOT NULL,
        paymentDate DATE NOT NULL,
        paymentMethod TEXT,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(subscriptionId) REFERENCES mess_subscriptions(id)
      );
    `);
        console.log('✅ Payments table created');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
};

// Get database instance
export const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initDB() first.');
    }
    return db;
};

// Close database
export const closeDB = async () => {
    if (db) {
        try {
            await db.closeAsync();
            console.log('✅ Database closed');
        } catch (error) {
            console.error('❌ Error closing database:', error);
        }
    }
};