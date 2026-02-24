// src/database/queries.js
import { getDBAsync } from './db';
let syncExpiredPromise = null;

const getTodayLocalDateString = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
};

const mapQueryError = (error, fallbackMessage) => {
    if (error instanceof Error && error.message) {
        return new Error(error.message);
    }
    return new Error(fallbackMessage);
};

const insertSubscriptionHistorySnapshot = async (
    db,
    subscription,
    eventType,
    eventReason = '',
    notes = ''
) => {
    await db.runAsync(
        `INSERT OR IGNORE INTO subscription_history
       (subscriptionId, clientId, startDate, endDate, totalDays, planType, totalAmount, amountPaid, eventType, eventReason, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            subscription.id,
            subscription.clientId,
            subscription.startDate,
            subscription.endDate,
            subscription.totalDays,
            subscription.planType || 'custom',
            subscription.totalAmount,
            subscription.amountPaid,
            eventType,
            eventReason,
            notes || '',
        ]
    );
};

// Auto-expire subscriptions whose end date has passed.
const syncExpiredSubscriptions = async () => {
    if (syncExpiredPromise) {
        return syncExpiredPromise;
    }

    syncExpiredPromise = (async () => {
        const db = await getDBAsync();
        try {
            await db.runAsync(
                `INSERT OR IGNORE INTO subscription_history
             (subscriptionId, clientId, startDate, endDate, totalDays, planType, totalAmount, amountPaid, eventType, eventReason, notes)
             SELECT
               ms.id,
               ms.clientId,
               ms.startDate,
               ms.endDate,
               ms.totalDays,
               COALESCE(ms.planType, 'custom'),
               ms.totalAmount,
               ms.amountPaid,
               'expired',
               'Subscription period ended',
               COALESCE(ms.notes, '')
             FROM mess_subscriptions ms
             WHERE ms.isActive = 1
               AND date(ms.endDate) < date('now', 'localtime')`
            );

            await db.runAsync(
                `UPDATE mess_subscriptions
               SET isActive = 0,
                   historyLogged = 1,
                   lastModified = CURRENT_TIMESTAMP
               WHERE isActive = 1
                 AND date(endDate) < date('now', 'localtime')`
            );
        } catch (error) {
            throw mapQueryError(error, 'Failed to sync expired subscriptions');
        } finally {
            syncExpiredPromise = null;
        }
    })();

    return syncExpiredPromise;
};

// ==================== CLIENTS QUERIES ====================

// Add new client
export const addClient = async (name, phone, email = '', address = '', notes = '') => {
    try {
        const db = await getDBAsync();
        const result = await db.runAsync(
            `INSERT INTO clients (name, phone, email, address, notes) 
       VALUES (?, ?, ?, ?, ?)`,
            [name, phone, email, address, notes]
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.error('Error adding client:', error);
        throw mapQueryError(error, 'Failed to add client');
    }
};

// Get all clients
export const getAllClients = async () => {
    try {
        const db = await getDBAsync();
        const result = await db.getAllAsync('SELECT * FROM clients ORDER BY name ASC');
        return result;
    } catch (error) {
        console.error('Error fetching clients:', error);
        throw mapQueryError(error, 'Failed to fetch clients');
    }
};

// Search clients by name or phone
export const searchClients = async (searchTerm) => {
    try {
        const db = await getDBAsync();
        const result = await db.getAllAsync(
            `SELECT * FROM clients 
       WHERE name LIKE ? OR phone LIKE ? 
       ORDER BY name ASC`,
            [`%${searchTerm}%`, `%${searchTerm}%`]
        );
        return result;
    } catch (error) {
        console.error('Error searching clients:', error);
        throw mapQueryError(error, 'Failed to search clients');
    }
};

// Get client by ID
export const getClientById = async (clientId) => {
    try {
        const db = await getDBAsync();
        const result = await db.getFirstAsync(
            'SELECT * FROM clients WHERE id = ?',
            [clientId]
        );
        return result || null;
    } catch (error) {
        console.error('Error fetching client:', error);
        throw mapQueryError(error, 'Failed to fetch client details');
    }
};

// Update client
export const updateClient = async (clientId, name, phone, email, address, notes) => {
    try {
        const db = await getDBAsync();
        await db.runAsync(
            `UPDATE clients 
       SET name = ?, phone = ?, email = ?, address = ?, notes = ? 
       WHERE id = ?`,
            [name, phone, email, address, notes, clientId]
        );
    } catch (error) {
        console.error('Error updating client:', error);
        throw mapQueryError(error, 'Failed to update client');
    }
};

// Delete client
export const deleteClient = async (clientId) => {
    try {
        const db = await getDBAsync();
        await db.runAsync('DELETE FROM clients WHERE id = ?', [clientId]);
    } catch (error) {
        console.error('Error deleting client:', error);
        throw mapQueryError(error, 'Failed to delete client');
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
        const db = await getDBAsync();
        if (Number(totalAmount) <= 0) {
            throw new Error('Total amount must be greater than 0');
        }
        if (Number(amountPaid) < 0) {
            throw new Error('Amount paid cannot be negative');
        }
        if (Number(amountPaid) > Number(totalAmount)) {
            throw new Error('Amount paid cannot be greater than total amount');
        }
        if (endDate < startDate) {
            throw new Error('End date cannot be before start date');
        }

        const today = getTodayLocalDateString();
        const safeIsActive = endDate < today ? 0 : isActive;
        const result = await db.runAsync(
            `INSERT INTO mess_subscriptions 
       (clientId, startDate, endDate, totalDays, planType, totalAmount, amountPaid, isActive, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                clientId,
                startDate,
                endDate,
                totalDays,
                planType,
                totalAmount,
                amountPaid,
                safeIsActive,
                notes,
            ]
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.error('Error adding subscription:', error);
        throw mapQueryError(error, 'Failed to add subscription');
    }
};

// Get all subscriptions with client names
export const getAllSubscriptions = async () => {
    try {
        await syncExpiredSubscriptions();
        const db = await getDBAsync();
        const result = await db.getAllAsync(`
      SELECT ms.*, c.name as clientName, c.phone 
      FROM mess_subscriptions ms 
      JOIN clients c ON ms.clientId = c.id 
      ORDER BY ms.createdAt DESC
    `);
        return result;
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw mapQueryError(error, 'Failed to fetch subscriptions');
    }
};

// Get active subscriptions only
export const getActiveSubscriptions = async () => {
    try {
        await syncExpiredSubscriptions();
        const db = await getDBAsync();
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
        throw mapQueryError(error, 'Failed to fetch active subscriptions');
    }
};

// Search subscriptions by client name
export const searchSubscriptions = async (searchTerm) => {
    try {
        await syncExpiredSubscriptions();
        const db = await getDBAsync();
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
        throw mapQueryError(error, 'Failed to search subscriptions');
    }
};

// Get subscription by ID
export const getSubscriptionById = async (subscriptionId) => {
    try {
        await syncExpiredSubscriptions();
        const db = await getDBAsync();
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
        throw mapQueryError(error, 'Failed to fetch subscription details');
    }
};

// Get all subscriptions for a specific client
export const getClientSubscriptions = async (clientId) => {
    try {
        await syncExpiredSubscriptions();
        const db = await getDBAsync();
        const result = await db.getAllAsync(
            `SELECT * FROM mess_subscriptions 
       WHERE clientId = ? 
       ORDER BY createdAt DESC`,
            [clientId]
        );
        return result;
    } catch (error) {
        console.error('Error fetching client subscriptions:', error);
        throw mapQueryError(error, 'Failed to fetch client subscriptions');
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
    let db;
    let transactionStarted = false;
    try {
        db = await getDBAsync();
        if (Number(totalAmount) <= 0) {
            throw new Error('Total amount must be greater than 0');
        }
        if (Number(amountPaid) < 0) {
            throw new Error('Amount paid cannot be negative');
        }
        if (Number(amountPaid) > Number(totalAmount)) {
            throw new Error('Amount paid cannot be greater than total amount');
        }
        if (endDate < startDate) {
            throw new Error('End date cannot be before start date');
        }

        await db.execAsync('BEGIN IMMEDIATE TRANSACTION;');
        transactionStarted = true;

        const currentSubscription = await db.getFirstAsync(
            `SELECT * FROM mess_subscriptions WHERE id = ?`,
            [subscriptionId]
        );
        if (!currentSubscription) {
            throw new Error('Subscription not found');
        }

        const isRenewal =
            currentSubscription.startDate !== startDate ||
            currentSubscription.endDate !== endDate;
        if (isRenewal) {
            await insertSubscriptionHistorySnapshot(
                db,
                currentSubscription,
                'renewed',
                'Subscription renewed with a new date range',
                currentSubscription.notes || ''
            );
        }

        const today = getTodayLocalDateString();
        const safeIsActive = endDate < today ? 0 : isActive;
        await db.runAsync(
            `UPDATE mess_subscriptions 
       SET startDate = ?, endDate = ?, totalDays = ?, totalAmount = ?, 
           amountPaid = ?, isActive = ?, planType = ?, notes = ?, historyLogged = ?, lastModified = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [
                startDate,
                endDate,
                totalDays,
                totalAmount,
                amountPaid,
                safeIsActive,
                planType,
                notes,
                safeIsActive === 0 ? 1 : 0,
                subscriptionId,
            ]
        );

        const previousPaid = Number(currentSubscription.amountPaid);
        const nextPaid = Number(amountPaid);
        let paymentDelta = 0;
        let amountPaidBefore = previousPaid;

        if (isRenewal) {
            paymentDelta = nextPaid > 0 ? nextPaid : 0;
            amountPaidBefore = 0;
        } else if (nextPaid > previousPaid) {
            paymentDelta = nextPaid - previousPaid;
        }

        if (paymentDelta > 0) {
            await db.runAsync(
                `INSERT INTO payment_history
               (subscriptionId, clientId, amount, paymentDate, paymentMethod, notes, amountPaidBefore, amountPaidAfter, remainingAfter, totalAmountSnapshot)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    subscriptionId,
                    currentSubscription.clientId,
                    paymentDelta,
                    getTodayLocalDateString(),
                    'manual-adjustment',
                    isRenewal
                        ? 'Opening paid amount captured at renewal'
                        : 'Paid amount increased from subscription update',
                    amountPaidBefore,
                    nextPaid,
                    Number(totalAmount) - nextPaid,
                    Number(totalAmount),
                ]
            );
        }

        await db.execAsync('COMMIT;');
        transactionStarted = false;
    } catch (error) {
        if (db && transactionStarted) {
            await db.execAsync('ROLLBACK;').catch(() => {});
        }
        console.error('Error updating subscription:', error);
        throw mapQueryError(error, 'Failed to update subscription');
    }
};

// Delete subscription
export const deleteSubscription = async (subscriptionId) => {
    try {
        const db = await getDBAsync();
        await db.runAsync('DELETE FROM mess_subscriptions WHERE id = ?', [subscriptionId]);
    } catch (error) {
        console.error('Error deleting subscription:', error);
        throw mapQueryError(error, 'Failed to delete subscription');
    }
};

// ==================== PAYMENTS QUERIES ====================

// Add payment
export const addPayment = async (subscriptionId, amount, paymentDate, paymentMethod = '', notes = '') => {
    let db;
    let transactionStarted = false;
    try {
        db = await getDBAsync();
        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            throw new Error('Payment amount must be a valid positive number');
        }

        await db.execAsync('BEGIN IMMEDIATE TRANSACTION;');
        transactionStarted = true;
        const subscription = await db.getFirstAsync(
            `SELECT id, clientId, amountPaid, totalAmount FROM mess_subscriptions WHERE id = ?`,
            [subscriptionId]
        );

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        const newAmountPaid = Number(subscription.amountPaid) + parsedAmount;
        if (newAmountPaid > Number(subscription.totalAmount)) {
            throw new Error('Payment exceeds remaining subscription balance');
        }

        const result = await db.runAsync(
            `INSERT INTO payments (subscriptionId, amount, paymentDate, paymentMethod, notes) 
       VALUES (?, ?, ?, ?, ?)`,
            [subscriptionId, parsedAmount, paymentDate, paymentMethod, notes]
        );

        await db.runAsync(
            `UPDATE mess_subscriptions
             SET amountPaid = ?, lastModified = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [newAmountPaid, subscriptionId]
        );

        await db.runAsync(
            `INSERT INTO payment_history
           (subscriptionId, clientId, amount, paymentDate, paymentMethod, notes, amountPaidBefore, amountPaidAfter, remainingAfter, totalAmountSnapshot)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                subscriptionId,
                subscription.clientId,
                parsedAmount,
                paymentDate,
                paymentMethod,
                notes,
                Number(subscription.amountPaid),
                newAmountPaid,
                Number(subscription.totalAmount) - newAmountPaid,
                Number(subscription.totalAmount),
            ]
        );

        await db.execAsync('COMMIT;');
        transactionStarted = false;
        return result.lastInsertRowId;
    } catch (error) {
        if (db && transactionStarted) {
            await db.execAsync('ROLLBACK;').catch(() => {});
        }
        console.error('Error adding payment:', error);
        throw mapQueryError(error, 'Failed to add payment');
    }
};

// Get all payments for a subscription
export const getSubscriptionPayments = async (subscriptionId) => {
    try {
        const db = await getDBAsync();
        const result = await db.getAllAsync(
            `SELECT * FROM payments WHERE subscriptionId = ? ORDER BY paymentDate DESC`,
            [subscriptionId]
        );
        return result;
    } catch (error) {
        console.error('Error fetching payments:', error);
        throw mapQueryError(error, 'Failed to fetch payments');
    }
};

// ==================== DASHBOARD QUERIES ====================

// Get total active subscriptions count
export const getTotalActiveSubscriptions = async () => {
    try {
        await syncExpiredSubscriptions();
        const db = await getDBAsync();
        const result = await db.getFirstAsync(
            `SELECT COUNT(*) as count FROM mess_subscriptions WHERE isActive = 1`
        );
        return result?.count || 0;
    } catch (error) {
        console.error('Error fetching active subscriptions count:', error);
        throw mapQueryError(error, 'Failed to fetch active subscriptions count');
    }
};

// Get total revenue (all amountPaid)
export const getTotalRevenue = async () => {
    try {
        const db = await getDBAsync();
        const result = await db.getFirstAsync(
            `SELECT SUM(amountPaid) as total FROM mess_subscriptions`
        );
        return result?.total || 0;
    } catch (error) {
        console.error('Error fetching total revenue:', error);
        throw mapQueryError(error, 'Failed to fetch total revenue');
    }
};

// Get subscriptions with pending balance.
export const getPendingPayments = async () => {
    try {
        await syncExpiredSubscriptions();
        const db = await getDBAsync();
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
        console.error('Error fetching pending payments:', error);
        throw mapQueryError(error, 'Failed to fetch pending payments');
    }
};

// Backward compatibility alias.
export const getOverduePayments = getPendingPayments;

// Get expiring soon (ending in next 7 days)
export const getExpiringSoon = async () => {
    try {
        await syncExpiredSubscriptions();
        const db = await getDBAsync();
        const result = await db.getAllAsync(`
      SELECT ms.*, c.name as clientName, c.phone
      FROM mess_subscriptions ms 
      JOIN clients c ON ms.clientId = c.id 
      WHERE ms.isActive = 1 
      AND date(ms.endDate) BETWEEN date('now', 'localtime') AND date('now', 'localtime', '+7 days')
      ORDER BY ms.endDate ASC
    `);
        return result;
    } catch (error) {
        console.error('Error fetching expiring subscriptions:', error);
        throw mapQueryError(error, 'Failed to fetch expiring subscriptions');
    }
};

// Get total clients count
export const getTotalClientsCount = async () => {
    try {
        const db = await getDBAsync();
        const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM clients');
        return result?.count || 0;
    } catch (error) {
        console.error('Error fetching clients count:', error);
        throw mapQueryError(error, 'Failed to fetch clients count');
    }
};

export const getSubscriptionHistoryPage = async (subscriptionId, page = 1, pageSize = 15) => {
    try {
        const db = await getDBAsync();
        const safePage = Math.max(1, Number(page) || 1);
        const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || 15));
        const offset = (safePage - 1) * safePageSize;

        const rows = await db.getAllAsync(
            `SELECT sh.*, c.name AS clientName
           FROM subscription_history sh
           JOIN clients c ON c.id = sh.clientId
           WHERE sh.subscriptionId = ?
           ORDER BY datetime(sh.eventAt) DESC, sh.id DESC
           LIMIT ? OFFSET ?`,
            [subscriptionId, safePageSize, offset]
        );

        return {
            items: rows,
            page: safePage,
            pageSize: safePageSize,
            hasMore: rows.length === safePageSize,
        };
    } catch (error) {
        console.error('Error fetching subscription history:', error);
        throw mapQueryError(error, 'Failed to fetch subscription history');
    }
};

export const getPaymentHistoryPage = async (subscriptionId, page = 1, pageSize = 15) => {
    try {
        const db = await getDBAsync();
        const safePage = Math.max(1, Number(page) || 1);
        const safePageSize = Math.max(1, Math.min(50, Number(pageSize) || 15));
        const offset = (safePage - 1) * safePageSize;

        const rows = await db.getAllAsync(
            `SELECT ph.*, c.name AS clientName
           FROM payment_history ph
           JOIN clients c ON c.id = ph.clientId
           WHERE ph.subscriptionId = ?
           ORDER BY datetime(ph.createdAt) DESC, ph.id DESC
           LIMIT ? OFFSET ?`,
            [subscriptionId, safePageSize, offset]
        );

        return {
            items: rows,
            page: safePage,
            pageSize: safePageSize,
            hasMore: rows.length === safePageSize,
        };
    } catch (error) {
        console.error('Error fetching payment history:', error);
        throw mapQueryError(error, 'Failed to fetch payment history');
    }
};
