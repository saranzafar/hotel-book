// src/database/db.js
import * as SQLite from 'expo-sqlite';

let db = null;
let initPromise = null;
const TARGET_SCHEMA_VERSION = 2;

// Initialize database
export const initDB = async () => {
    if (db) {
        return db;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            db = await SQLite.openDatabaseAsync('HotelMess.db');
            await db.execAsync('PRAGMA foreign_keys = ON;');
            console.log('✅ Database opened successfully');
            await migrateSchema();
            return db;
        } catch (error) {
            db = null;
            console.error('❌ Error opening database:', error);
            throw error;
        } finally {
            initPromise = null;
        }
    })();

    return initPromise;
};

const migrateSchema = async () => {
    await createTables();
    await ensureHistorySchema();
    await createIndexes();

    const needsMigration = await schemaNeedsMigration();
    if (needsMigration) {
        await rebuildTablesWithConstraints();
        await createIndexes();
    }

    await db.execAsync(`PRAGMA user_version = ${TARGET_SCHEMA_VERSION};`);
};

// Create all tables with safety constraints for integrity.
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
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        totalDays INTEGER NOT NULL CHECK(totalDays > 0),
        planType TEXT,
        totalAmount REAL NOT NULL CHECK(totalAmount > 0),
        amountPaid REAL NOT NULL DEFAULT 0 CHECK(amountPaid >= 0 AND amountPaid <= totalAmount),
        isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0, 1)),
        historyLogged INTEGER NOT NULL DEFAULT 0 CHECK(historyLogged IN (0, 1)),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY(clientId) REFERENCES clients(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ Mess subscriptions table created');

        // Payments table
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriptionId INTEGER NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        paymentDate TEXT NOT NULL,
        paymentMethod TEXT,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(subscriptionId) REFERENCES mess_subscriptions(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ Payments table created');

        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS subscription_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriptionId INTEGER NOT NULL,
        clientId INTEGER NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        totalDays INTEGER NOT NULL,
        planType TEXT,
        totalAmount REAL NOT NULL,
        amountPaid REAL NOT NULL,
        eventType TEXT NOT NULL,
        eventReason TEXT,
        eventAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY(subscriptionId) REFERENCES mess_subscriptions(id) ON DELETE CASCADE,
        FOREIGN KEY(clientId) REFERENCES clients(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payment_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriptionId INTEGER NOT NULL,
        clientId INTEGER NOT NULL,
        amount REAL NOT NULL CHECK(amount > 0),
        paymentDate TEXT NOT NULL,
        paymentMethod TEXT,
        notes TEXT,
        amountPaidBefore REAL NOT NULL DEFAULT 0,
        amountPaidAfter REAL NOT NULL DEFAULT 0,
        remainingAfter REAL NOT NULL DEFAULT 0,
        totalAmountSnapshot REAL NOT NULL DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(subscriptionId) REFERENCES mess_subscriptions(id) ON DELETE CASCADE,
        FOREIGN KEY(clientId) REFERENCES clients(id) ON DELETE CASCADE
      );
    `);
        console.log('✅ History tables created');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
};

const getTableColumns = async (tableName) => {
    const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
    return columns.map((column) => String(column.name));
};

const ensureHistorySchema = async () => {
    const messColumns = await getTableColumns('mess_subscriptions');
    if (!messColumns.includes('historyLogged')) {
        await db.execAsync(`
          ALTER TABLE mess_subscriptions
          ADD COLUMN historyLogged INTEGER NOT NULL DEFAULT 0 CHECK(historyLogged IN (0, 1));
        `);
    }
};

const createIndexes = async () => {
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_mess_subscriptions_clientId ON mess_subscriptions(clientId);
      CREATE INDEX IF NOT EXISTS idx_mess_subscriptions_endDate ON mess_subscriptions(endDate);
      CREATE INDEX IF NOT EXISTS idx_mess_subscriptions_isActive ON mess_subscriptions(isActive);
      CREATE INDEX IF NOT EXISTS idx_mess_subscriptions_historyLogged ON mess_subscriptions(historyLogged);
      CREATE INDEX IF NOT EXISTS idx_payments_subscriptionId ON payments(subscriptionId);
      CREATE INDEX IF NOT EXISTS idx_subscription_history_subscriptionId ON subscription_history(subscriptionId);
      CREATE INDEX IF NOT EXISTS idx_subscription_history_clientId ON subscription_history(clientId);
      CREATE INDEX IF NOT EXISTS idx_subscription_history_eventAt ON subscription_history(eventAt DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_history_unique_event
      ON subscription_history(subscriptionId, startDate, endDate, eventType);
      CREATE INDEX IF NOT EXISTS idx_payment_history_subscriptionId ON payment_history(subscriptionId);
      CREATE INDEX IF NOT EXISTS idx_payment_history_clientId ON payment_history(clientId);
      CREATE INDEX IF NOT EXISTS idx_payment_history_createdAt ON payment_history(createdAt DESC);
    `);
};

const getTableSQL = async (tableName) => {
    const row = await db.getFirstAsync(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`,
        [tableName]
    );
    return row?.sql || '';
};

const schemaNeedsMigration = async () => {
    const messForeignKeys = await db.getAllAsync(`PRAGMA foreign_key_list(mess_subscriptions)`);
    const paymentsForeignKeys = await db.getAllAsync(`PRAGMA foreign_key_list(payments)`);
    const messSql = await getTableSQL('mess_subscriptions');
    const paymentsSql = await getTableSQL('payments');

    const hasMessCascade = messForeignKeys.some(
        (fk) =>
            fk.table === 'clients' &&
            String(fk.from).toLowerCase() === 'clientid' &&
            String(fk.on_delete).toUpperCase() === 'CASCADE'
    );
    const hasPaymentsCascade = paymentsForeignKeys.some(
        (fk) =>
            fk.table === 'mess_subscriptions' &&
            String(fk.from).toLowerCase() === 'subscriptionid' &&
            String(fk.on_delete).toUpperCase() === 'CASCADE'
    );

    const hasSubscriptionChecks =
        messSql.includes('CHECK(totalDays > 0)') &&
        messSql.includes('CHECK(totalAmount > 0)') &&
        messSql.includes('CHECK(amountPaid >= 0 AND amountPaid <= totalAmount)');
    const hasPaymentChecks = paymentsSql.includes('CHECK(amount > 0)');

    return !hasMessCascade || !hasPaymentsCascade || !hasSubscriptionChecks || !hasPaymentChecks;
};

const rebuildTablesWithConstraints = async () => {
    try {
        await db.execAsync('PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE TRANSACTION;');

        await db.execAsync(`
          CREATE TABLE mess_subscriptions_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId INTEGER NOT NULL,
            startDate TEXT NOT NULL,
            endDate TEXT NOT NULL,
            totalDays INTEGER NOT NULL CHECK(totalDays > 0),
            planType TEXT,
            totalAmount REAL NOT NULL CHECK(totalAmount > 0),
            amountPaid REAL NOT NULL DEFAULT 0 CHECK(amountPaid >= 0 AND amountPaid <= totalAmount),
            isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0, 1)),
            historyLogged INTEGER NOT NULL DEFAULT 0 CHECK(historyLogged IN (0, 1)),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY(clientId) REFERENCES clients(id) ON DELETE CASCADE
          );

          INSERT INTO mess_subscriptions_new
          (id, clientId, startDate, endDate, totalDays, planType, totalAmount, amountPaid, isActive, createdAt, lastModified, notes)
          SELECT
            id,
            clientId,
            COALESCE(startDate, date('now', 'localtime')),
            COALESCE(endDate, COALESCE(startDate, date('now', 'localtime'))),
            CASE WHEN totalDays IS NULL OR totalDays < 1 THEN 1 ELSE totalDays END,
            COALESCE(planType, 'custom'),
            CASE WHEN totalAmount IS NULL OR totalAmount <= 0 THEN 0.01 ELSE totalAmount END,
            CASE
              WHEN amountPaid IS NULL OR amountPaid < 0 THEN 0
              WHEN totalAmount IS NULL OR totalAmount <= 0 THEN 0
              WHEN amountPaid > totalAmount THEN totalAmount
              ELSE amountPaid
            END,
            CASE WHEN isActive = 0 THEN 0 ELSE 1 END,
            COALESCE(createdAt, CURRENT_TIMESTAMP),
            COALESCE(lastModified, CURRENT_TIMESTAMP),
            notes
          FROM mess_subscriptions
          WHERE clientId IN (SELECT id FROM clients);

          DROP TABLE mess_subscriptions;
          ALTER TABLE mess_subscriptions_new RENAME TO mess_subscriptions;

          CREATE TABLE payments_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subscriptionId INTEGER NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            paymentDate TEXT NOT NULL,
            paymentMethod TEXT,
            notes TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(subscriptionId) REFERENCES mess_subscriptions(id) ON DELETE CASCADE
          );

          INSERT INTO payments_new
          (id, subscriptionId, amount, paymentDate, paymentMethod, notes, createdAt)
          SELECT
            id,
            subscriptionId,
            CASE WHEN amount IS NULL OR amount <= 0 THEN 0.01 ELSE amount END,
            COALESCE(paymentDate, date('now', 'localtime')),
            paymentMethod,
            notes,
            COALESCE(createdAt, CURRENT_TIMESTAMP)
          FROM payments
          WHERE subscriptionId IN (SELECT id FROM mess_subscriptions);

          DROP TABLE payments;
          ALTER TABLE payments_new RENAME TO payments;
        `);

        await db.execAsync('COMMIT; PRAGMA foreign_keys = ON;');
        console.log('✅ Database schema migrated to enforce integrity constraints');
    } catch (error) {
        await db.execAsync('ROLLBACK; PRAGMA foreign_keys = ON;');
        console.error('❌ Error migrating database schema:', error);
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

export const getDBAsync = async () => {
    if (db) {
        return db;
    }
    return initDB();
};

// Close database
export const closeDB = async () => {
    if (db) {
        try {
            await db.closeAsync();
            db = null;
            console.log('✅ Database closed');
        } catch (error) {
            console.error('❌ Error closing database:', error);
        }
    }
};
