// app/(tabs)/mess.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { getAllSubscriptions } from '../../src/database/queries';
import { showError } from '../../src/ui/toast.js';
import AddSubscriptionDrawer from '../components/AddSubscriptionDrawer';
import EditSubscriptionDrawer from '../components/EditSubscriptionDrawer';

export default function MessScreen() {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState([]);
    const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const [showEditDrawer, setShowEditDrawer] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);

    const applyFilter = useCallback((data, status, search) => {
        let filtered = data;
        if (status === 'active') filtered = filtered.filter((s) => s.isActive === 1);
        else if (status === 'expired') filtered = filtered.filter((s) => s.isActive === 0);

        if (search.trim() !== '') {
            filtered = filtered.filter((s) =>
                s.clientName.toLowerCase().includes(search.toLowerCase())
            );
        }
        setFilteredSubscriptions(filtered);
    }, []);

    const loadSubscriptions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllSubscriptions();
            setSubscriptions(data);
        } catch (error) {
            showError('Failed to sync plans');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSubscriptions(); }, [loadSubscriptions]);
    useFocusEffect(useCallback(() => { loadSubscriptions(); }, [loadSubscriptions]));

    useEffect(() => {
        applyFilter(subscriptions, filterStatus, searchTerm);
    }, [subscriptions, filterStatus, searchTerm, applyFilter]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSubscriptions();
        setRefreshing(false);
    };

    const renderSubscriptionCard = ({ item }) => {
        const balance = item.totalAmount - item.amountPaid;
        const isActive = item.isActive === 1;

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => {
                    setSelectedSubscription(item);
                    setShowEditDrawer(true);
                }}
            >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                    <View style={styles.clientInfo}>
                        <Text style={styles.clientName} numberOfLines={1}>{item.clientName}</Text>
                        <View style={styles.dateBadge}>
                            <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                            <Text style={styles.dateRangeText}>{item.startDate} to {item.endDate}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusPill, isActive ? styles.pillActive : styles.pillExpired]}>
                        <Text style={[styles.statusText, isActive ? styles.textActive : styles.textExpired]}>
                            {isActive ? 'ACTIVE' : 'EXPIRED'}
                        </Text>
                    </View>
                </View>

                {/* Financial Summary Strip */}
                <View style={styles.financeStrip}>
                    <View style={styles.financeItem}>
                        <Text style={styles.financeLabel}>TOTAL</Text>
                        <Text style={styles.financeValue}>₹{item.totalAmount}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.financeItem}>
                        <Text style={styles.financeLabel}>PAID</Text>
                        <Text style={[styles.financeValue, { color: '#34C759' }]}>₹{item.amountPaid}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.financeItem}>
                        <Text style={styles.financeLabel}>BALANCE</Text>
                        <Text style={[styles.financeValue, balance > 0 ? { color: '#E53935' } : { color: '#8E8E93' }]}>
                            ₹{balance}
                        </Text>
                    </View>
                </View>

                {/* Footer Interaction */}
                <View style={styles.cardFooter}>
                    <View style={styles.daysBadge}>
                        <Ionicons name="time-outline" size={14} color="#1C1C1E" />
                        <Text style={styles.daysBadgeText}>{item.totalDays} Days Plan</Text>
                    </View>
                    <Ionicons name="chevron-forward-circle" size={24} color="#E53935" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.topHeader}>
                <Text style={styles.mainTitle}>Subscriptions</Text>

                <View style={styles.searchWrapper}>
                    <Ionicons name="search" size={18} color="#AEAEB2" />
                    <TextInput
                        placeholder="Search by member name..."
                        placeholderTextColor="#C7C7CC"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        style={styles.searchInput}
                    />
                </View>

                <View style={styles.filterBar}>
                    {['all', 'active', 'expired'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilterStatus(status)}
                            style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
                        >
                            <Text style={[styles.filterTabText, filterStatus === status && styles.filterTabTextActive]}>
                                {status.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}><ActivityIndicator color="#E53935" /></View>
            ) : (
                <FlatList
                    data={filteredSubscriptions}
                    renderItem={renderSubscriptionCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E53935" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={64} color="#D1D1D6" />
                            <Text style={styles.emptyText}>No subscriptions found</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setShowAddDrawer(true)}>
                <Ionicons name="add" size={30} color="#fff" />
                <Text style={styles.fabText}>New Mess</Text>
            </TouchableOpacity>

            <AddSubscriptionDrawer visible={showAddDrawer} onClose={() => setShowAddDrawer(false)} onSubscriptionAdded={loadSubscriptions} />
            <EditSubscriptionDrawer visible={showEditDrawer} onClose={() => setShowEditDrawer(false)} subscription={selectedSubscription} onSubscriptionUpdated={loadSubscriptions} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    topHeader: {
        backgroundColor: '#FFF',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    mainTitle: { fontSize: 32, fontWeight: '900', color: '#1C1C1E', marginBottom: 20, letterSpacing: -1 },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 16,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
    filterBar: { flexDirection: 'row', gap: 8 },
    filterTab: {
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#F2F2F7',
    },
    filterTabActive: { backgroundColor: '#1C1C1E' },
    filterTabText: { fontSize: 12, fontWeight: '800', color: '#8E8E93' },
    filterTabTextActive: { color: '#FFF' },

    listPadding: { padding: 20, paddingBottom: 120 },
    card: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    clientName: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
    dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateRangeText: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },

    statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    pillActive: { backgroundColor: '#E8F5E9' },
    pillExpired: { backgroundColor: '#F2F2F7' },
    statusText: { fontSize: 10, fontWeight: '900' },
    textActive: { color: '#34C759' },
    textExpired: { color: '#8E8E93' },

    financeStrip: {
        flexDirection: 'row', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 12, alignItems: 'center',
    },
    financeItem: { flex: 1, alignItems: 'center' },
    financeLabel: { fontSize: 9, fontWeight: '800', color: '#AEAEB2', marginBottom: 4 },
    financeValue: { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
    divider: { width: 1, height: 20, backgroundColor: '#E5E5EA' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    daysBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F2F2F7',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20
    },
    daysBadgeText: { fontSize: 12, fontWeight: '700', color: '#1C1C1E' },

    fab: {
        position: 'absolute', bottom: 30, right: 20, backgroundColor: '#E53935',
        paddingHorizontal: 24, height: 60, borderRadius: 30, flexDirection: 'row',
        alignItems: 'center', shadowColor: '#E53935', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    fabText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginLeft: 8 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#AEAEB2', fontWeight: '600', marginTop: 16 }
});