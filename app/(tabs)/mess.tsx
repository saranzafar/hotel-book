import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { getAllSubscriptions } from '../../src/database/queries';
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

    useEffect(() => {
        loadSubscriptions();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadSubscriptions();
        }, [])
    );

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const data = await getAllSubscriptions();
            setSubscriptions(data);
            applyFilter(data, filterStatus, searchTerm);
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadSubscriptions();
        setRefreshing(false);
    };

    const applyFilter = (data, status, search) => {
        let filtered = data;

        // Status filter
        if (status === 'active') {
            filtered = filtered.filter((s) => s.isActive == 1);
        } else if (status === 'expired') {
            filtered = filtered.filter((s) => s.isActive == 0);
        }

        // Search
        if (search.trim() !== '') {
            filtered = filtered.filter((s) =>
                s.clientName.toLowerCase().includes(search.toLowerCase())
            );
        }

        setFilteredSubscriptions(filtered);
    };

    const handleSearch = (text) => {
        setSearchTerm(text);
        applyFilter(subscriptions, filterStatus, text);
    };

    const handleFilterChange = (status) => {
        setFilterStatus(status);
        applyFilter(subscriptions, status, searchTerm);
    };

    const renderSubscriptionCard = ({ item }) => {
        const progress = (item.amountPaid / item.totalAmount) * 100;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    setSelectedSubscription(item);
                    setShowEditDrawer(true);
                }}
            >
                {/* Row 1: Header */}
                <View style={styles.row1}>
                    <Text style={styles.clientName}>{item.clientName}</Text>

                    <View
                        style={[
                            styles.statusBadge,
                            item.isActive === 1 ? styles.statusActive : styles.statusExpired,
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {item.isActive ? 'ACTIVE' : 'EXPIRED'}
                        </Text>
                    </View>
                </View>

                {/* Row 2: Dates + Days */}
                <View style={styles.row2}>
                    <Text style={styles.dateText}>
                        {item.startDate} → {item.endDate}
                    </Text>
                    <Text style={styles.daysText}>{item.totalDays} days</Text>
                </View>

                {/* Row 3: Payment Summary */}
                <View style={styles.row3}>
                    <Text style={styles.paymentChip}>Rs.{item.totalAmount} Total</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.paymentChip}>Rs.{item.amountPaid} Paid</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.paymentChip}>
                        Rs.{item.totalAmount - item.amountPaid} Left
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E53935" />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
                <TextInput
                    placeholder="Search client..."
                    placeholderTextColor="#999"
                    value={searchTerm}
                    onChangeText={handleSearch}
                    style={styles.searchInput}
                />
            </View>

            {/* Fixed Height Filter Bar (PREVENT JUMPING) */}
            <View style={styles.filterContainer}>
                {['all', 'active', 'expired'].map((status) => (
                    <TouchableOpacity
                        key={status}
                        onPress={() => handleFilterChange(status)}
                        style={[
                            styles.filterBtn,
                            filterStatus === status && styles.filterBtnActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filterStatus === status && styles.filterTextActive,
                            ]}
                        >
                            {status.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Subscription List */}
            {filteredSubscriptions.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="folder-open" size={60} color="#bbb" />
                    <Text style={styles.emptyText}>No subscriptions found</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredSubscriptions}
                    renderItem={renderSubscriptionCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: 15, paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E53935']} />
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowAddDrawer(true)}>
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>

            {/* Drawers */}
            <AddSubscriptionDrawer
                visible={showAddDrawer}
                onClose={() => setShowAddDrawer(false)}
                onSubscriptionAdded={loadSubscriptions}
            />
            <EditSubscriptionDrawer
                visible={showEditDrawer}
                onClose={() => setShowEditDrawer(false)}
                subscription={selectedSubscription}
                onSubscriptionUpdated={loadSubscriptions}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7f7f7' },

    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 5,
        padding: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },

    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
        height: 55, // FIXES THE JUMPING ISSUE
    },
    filterBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
    },
    filterBtnActive: {
        backgroundColor: '#E53935',
    },
    filterText: {
        color: '#555',
        fontWeight: '500',
        fontSize: 13,
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '700',
    },

    /** Cards */
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#E53935',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },

    /** ROW 1 — Header */
    row1: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clientName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        maxWidth: '70%',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
    },
    statusActive: {
        backgroundColor: '#E53935',
    },
    statusExpired: {
        backgroundColor: '#E74C3C',
    },
    statusText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '700',
    },

    /** ROW 2 — Dates & Days */
    row2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    dateText: {
        fontSize: 12,
        color: '#666',
        maxWidth: '65%',
    },
    daysText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },

    /** ROW 3 — Payment Summary */
    row3: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 6,
    },
    paymentChip: {
        fontSize: 13,
        fontWeight: '600',
        color: '#444',
    },
    dot: {
        marginHorizontal: 6,
        color: '#aaa',
    },

    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: { marginTop: 10, fontSize: 15, color: '#999' },

    fab: {
        position: 'absolute',
        bottom: 25,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E53935',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
});
