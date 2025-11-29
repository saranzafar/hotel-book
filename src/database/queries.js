// src/database/queries.js
import { getDB } from './db';

// ==================== CLIENTS QUERIES ====================

// Add new client
export const addClient = async (name, phone, email = '', address = '', notes = '') => {
    try {
        const db = getDB();
        const result = await db.runAsync(
            `INSERT INTO clients (name, phone, email, address, notes) 
       VALUES (?, ?, ?, ?, ?)`,
            [name, phone, email, address, notes]
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.error('Error adding client:', error);
        throw error;
    }
};

// Get all clients
export const getAllClients = async () => {
    try {
        const db = getDB();
        const result = await db.getAllAsync('SELECT * FROM clients ORDER BY name ASC');
        return result;
    } catch (error) {
        console.error('Error fetching clients:', error);
        throw error;
    }
};

// Search clients by name or phone
export const searchClients = async (searchTerm) => {
    try {
        const db = getDB();
        const result = await db.getAllAsync(
            `SELECT * FROM clients 
       WHERE name LIKE ? OR phone LIKE ? 
       ORDER BY name ASC`,
            [`%${searchTerm}%`, `%${searchTerm}%`]
        );
        return result;
    } catch (error) {
        console.error('Error searching clients:', error);
        throw error;
    }
};

// Get client by ID
export const getClientById = async (clientId) => {
    try {
        const db = getDB();
        const result = await db.getFirstAsync(
            'SELECT * FROM clients WHERE id = ?',
            [clientId]
        );
        return result || null;
    } catch (error) {
        console.error('Error fetching client:', error);
        throw error;
    }
};

// Update client
export const updateClient = async (clientId, name, phone, email, address, notes) => {
    try {
        const db = getDB();
        await db.runAsync(
            `UPDATE clients 
       SET name = ?, phone = ?, email = ?, address = ?, notes = ? 
       WHERE id = ?`,
            [name, phone, email, address, notes, clientId]
        );
    } catch (error) {
        console.error('Error updating client:', error);
        throw error;
    }
};

// Delete client
export const deleteClient = async (clientId) => {
    try {
        const db = getDB();
        await db.runAsync('DELETE FROM clients WHERE id = ?', [clientId]);
    } catch (error) {
        console.error('Error deleting client:', error);
        throw error;
    }
};

// ==================== MESS SUBSCRIPTIONS QUERIES ====================

// Add new subscription
export const addSubscription = async (
    clientId,
    startDate,
    endDate,
    totalDays,
    totalAmount,
    amountPaid = 0,
    planType = 'custom',
    isActive = 1,
    notes = ''
) => {
    try {
        const db = getDB();
        const result = await db.runAsync(
            `INSERT INTO mess_subscriptions 
       (clientId, startDate, endDate, totalDays, planType, totalAmount, amountPaid, isActive, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [clientId, startDate, endDate, totalDays, planType, totalAmount, amountPaid, isActive, notes]
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.error('Error adding subscription:', error);
        throw error;
    }
};

// Get all subscriptions with client names
export const getAllSubscriptions = async () => {
    try {
        const db = getDB();
        const result = await db.getAllAsync(`
      SELECT ms.*, c.name as clientName, c.phone 
      FROM mess_subscriptions ms 
      JOIN clients c ON ms.clientId = c.id 
      ORDER BY ms.createdAt DESC
    `);
        return result;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
    }
};

// Get active subscriptions only
export const getActiveSubscriptions = async () => {
    try {
        const db = getDB();
        const result = await db.getAllAsync(`
      SELECT ms.*, c.name as clientName, c.phone 
      FROM mess_subscriptions ms 
      JOIN clients c ON ms.clientId = c.id 
      WHERE ms.isActive = 1 
      ORDER BY ms.startDate DESC
    `);
        return result;
    } catch (error) {
        console.error('Error fetching active subscriptions:', error);
        throw error;
    }
};

// Search subscriptions by client name
export const searchSubscriptions = async (searchTerm) => {
    try {
        const db = getDB();
        const result = await db.getAllAsync(
            `SELECT ms.*, c.name as clientName, c.phone 
       FROM mess_subscriptions ms 
       JOIN clients c ON ms.clientId = c.id 
       WHERE c.name LIKE ? 
       ORDER BY ms.createdAt DESC`,
            [`%${searchTerm}%`]
        );
        return result;
    } catch (error) {
        console.error('Error searching subscriptions:', error);
        throw error;
    }
};

// Get subscription by ID
export const getSubscriptionById = async (subscriptionId) => {
    try {
        const db = getDB();
        const result = await db.getFirstAsync(
            `SELECT ms.*, c.name as clientName, c.phone 
       FROM mess_subscriptions ms 
       JOIN clients c ON ms.clientId = c.id 
       WHERE ms.id = ?`,
            [subscriptionId]
        );
        return result || null;
    } catch (error) {
        console.error('Error fetching subscription:', error);
        throw error;
    }
};

// Get all subscriptions for a specific client
export const getClientSubscriptions = async (clientId) => {
    try {
        const db = getDB();
        const result = await db.getAllAsync(
            `SELECT * FROM mess_subscriptions 
       WHERE clientId = ? 
       ORDER BY createdAt DESC`,
            [clientId]
        );
        return result;
    } catch (error) {
        console.error('Error fetching client subscriptions:', error);
        throw error;
    }
};

// Update subscription
export const updateSubscription = async (
    subscriptionId,
    startDate,
    endDate,
    totalDays,
    totalAmount,
    amountPaid,
    isActive,
    planType,
    notes
) => {
    try {
        const db = getDB();
        await db.runAsync(
            `UPDATE mess_subscriptions 
       SET startDate = ?, endDate = ?, totalDays = ?, totalAmount = ?, 
           amountPaid = ?, isActive = ?, planType = ?, notes = ?, lastModified = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [startDate, endDate, totalDays, totalAmount, amountPaid, isActive, planType, notes, subscriptionId]
        );
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
};

// Delete subscription
export const deleteSubscription = async (subscriptionId) => {
    try {
        const db = getDB();
        await db.runAsync('DELETE FROM mess_subscriptions WHERE id = ?', [subscriptionId]);
    } catch (error) {
        console.error('Error deleting subscription:', error);
        throw error;
    }
};

// ==================== PAYMENTS QUERIES ====================

// Add payment
export const addPayment = async (subscriptionId, amount, paymentDate, paymentMethod = '', notes = '') => {
    try {
        const db = getDB();
        const result = await db.runAsync(
            `INSERT INTO payments (subscriptionId, amount, paymentDate, paymentMethod, notes) 
       VALUES (?, ?, ?, ?, ?)`,
            [subscriptionId, amount, paymentDate, paymentMethod, notes]
        );

        // Update amountPaid in subscription
        const subscription = await getSubscriptionById(subscriptionId);
        if (subscription) {
            const newAmountPaid = subscription.amountPaid + amount;
            await db.runAsync(
                'UPDATE mess_subscriptions SET amountPaid = ? WHERE id = ?',
                [newAmountPaid, subscriptionId]
            );
        }

        return result.lastInsertRowId;
    } catch (error) {
        console.error('Error adding payment:', error);
        throw error;
    }
};

// Get all payments for a subscription
export const getSubscriptionPayments = async (subscriptionId) => {
    try {
        const db = getDB();
        const result = await db.getAllAsync(
            `SELECT * FROM payments WHERE subscriptionId = ? ORDER BY paymentDate DESC`,
            [subscriptionId]
        );
        return result;
    } catch (error) {
        console.error('Error fetching payments:', error);
        throw error;
    }
};

// ==================== DASHBOARD QUERIES ====================

// Get total active subscriptions count
export const getTotalActiveSubscriptions = async () => {
    try {
        const db = getDB();
        const result = await db.getFirstAsync(
            `SELECT COUNT(*) as count FROM mess_subscriptions WHERE isActive = 1`
        );
        return result?.count || 0;
    } catch (error) {
        console.error('Error fetching active subscriptions count:', error);
        throw error;
    }
};

// Get total revenue (all amountPaid)
export const getTotalRevenue = async () => {
    try {
        const db = getDB();
        const result = await db.getFirstAsync(
            `SELECT SUM(amountPaid) as total FROM mess_subscriptions`
        );
        return result?.total || 0;
    } catch (error) {
        console.error('Error fetching total revenue:', error);
        throw error;
    }
};

// Get overdue subscriptions (active but with remaining balance)
export const getOverduePayments = async () => {
    try {
        const db = getDB();
        const result = await db.getAllAsync(`
      SELECT ms.*, c.name as clientName, c.phone,
             (ms.totalAmount - ms.amountPaid) as remainingAmount
      FROM mess_subscriptions ms 
      JOIN clients c ON ms.clientId = c.id 
      WHERE ms.isActive = 1 AND (ms.totalAmount - ms.amountPaid) > 0
      ORDER BY ms.startDate ASC
    `);
        return result;
    } catch (error) {
        console.error('Error fetching overdue payments:', error);
        throw error;
    }
};

// Get expiring soon (ending in next 7 days)
export const getExpiringSoon = async () => {
    try {
        const db = getDB();
        const result = await db.getAllAsync(`
      SELECT ms.*, c.name as clientName, c.phone
      FROM mess_subscriptions ms 
      JOIN clients c ON ms.clientId = c.id 
      WHERE ms.isActive = 1 
      AND date(ms.endDate) BETWEEN date('now') AND date('now', '+7 days')
      ORDER BY ms.endDate ASC
    `);
        return result;
    } catch (error) {
        console.error('Error fetching expiring subscriptions:', error);
        throw error;
    }
};

// Get total clients count
export const getTotalClientsCount = async () => {
    try {
        const db = getDB();
        const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM clients');
        return result?.count || 0;
    } catch (error) {
        console.error('Error fetching clients count:', error);
        throw error;
    }
};