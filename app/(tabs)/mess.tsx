// app/(tabs)/mess.js — Clean Modern Design
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
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
import SubscriptionHistoryDrawer from '../components/SubscriptionHistoryDrawer';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 47 : StatusBar.currentHeight || 0;

export default function MessScreen() {
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState([]);
    const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const [showEditDrawer, setShowEditDrawer] = useState(false);
    const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);

    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;

    // Header animation
    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -70],
        extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 60, 100],
        outputRange: [1, 0.9, 0.95],
        extrapolate: 'clamp',
    });

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
        } catch {
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

    const clearSearch = () => {
        setSearchTerm('');
        setFilteredSubscriptions(subscriptions);
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const renderSubscriptionCard = ({ item }) => {
        const balance = item.totalAmount - item.amountPaid;
        const isActive = item.isActive === 1;
        const initials = getInitials(item.clientName);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => {
                    setSelectedSubscription(item);
                    setShowEditDrawer(true);
                }}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.clientInfoRow}>
                        <LinearGradient
                            colors={['#E53935', '#C62828']}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{initials}</Text>
                        </LinearGradient>

                        <View style={styles.clientInfo}>
                            <Text style={styles.clientName} numberOfLines={1}>{item.clientName}</Text>
                            <View style={styles.dateRange}>
                                <Ionicons name="calendar-outline" size={12} color="#64748B" />
                                <Text style={styles.dateText}>{item.startDate} - {item.endDate}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.historyButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                setSelectedSubscription(item);
                                setShowHistoryDrawer(true);
                            }}
                        >
                            <Ionicons name="time-outline" size={18} color="#E53935" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusExpired]}>
                        <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextExpired]}>
                            {isActive ? 'ACTIVE' : 'EXPIRED'}
                        </Text>
                    </View>
                </View>

                {/* Financial Summary */}
                <View style={styles.financeGrid}>
                    <View style={styles.financeItem}>
                        <Text style={styles.financeLabel}>Total</Text>
                        <Text style={styles.financeValue}>₹{item.totalAmount}</Text>
                    </View>

                    <View style={styles.financeDivider} />

                    <View style={styles.financeItem}>
                        <Text style={styles.financeLabel}>Paid</Text>
                        <Text style={[styles.financeValue, styles.paidValue]}>₹{item.amountPaid}</Text>
                    </View>

                    <View style={styles.financeDivider} />

                    <View style={styles.financeItem}>
                        <Text style={styles.financeLabel}>Balance</Text>
                        <Text style={[
                            styles.financeValue,
                            balance > 0 ? styles.balanceDue : styles.balanceZero
                        ]}>
                            ₹{balance}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                    <View style={styles.daysInfo}>
                        <Ionicons name="time-outline" size={14} color="#64748B" />
                        <Text style={styles.daysText}>{item.totalDays} days plan</Text>
                    </View>

                    <View style={styles.editIndicator}>
                        <Text style={styles.editText}>Details</Text>
                        <Ionicons name="chevron-forward" size={16} color="#E53935" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={48} color="#E53935" />
            </View>
            <Text style={styles.emptyTitle}>No subscriptions yet</Text>
            <Text style={styles.emptyMessage}>
                {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "Create your first subscription plan"}
            </Text>
            {!searchTerm && (
                <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setShowAddDrawer(true)}
                >
                    <LinearGradient
                        colors={['#E53935', '#C62828']}
                        style={styles.emptyButtonGradient}
                    >
                        <Text style={styles.emptyButtonText}>New Subscription</Text>
                        <Ionicons name="add" size={18} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );

    const ListHeaderComponent = () => (
        <View style={styles.statsContainer}>
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{subscriptions.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statValue}>
                    {subscriptions.filter(s => s.isActive === 1).length}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statValue}>
                    {subscriptions.filter(s => s.isActive === 0).length}
                </Text>
                <Text style={styles.statLabel}>Expired</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* Fixed top safety stripe */}
            <View style={[styles.topSafetyStripe, { height: STATUS_BAR_HEIGHT }]} />

            {/* Animated Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        transform: [{ translateY: headerTranslateY }],
                        opacity: headerOpacity,
                    }
                ]}
            >
                <View style={styles.headerContent}>
                    <View style={styles.titleRow}>
                        <View>
                            <Text style={styles.headerGreeting}>Management</Text>
                            <Text style={styles.headerTitle}>Subscriptions</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setShowAddDrawer(true)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#E53935', '#C62828']}
                                style={styles.addButtonGradient}
                            >
                                <Ionicons name="add" size={22} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={[styles.searchBox, isSearchFocused && styles.searchBoxActive]}>
                        <Ionicons
                            name="search"
                            size={18}
                            color={isSearchFocused ? "#E53935" : "#94A3B8"}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by member name..."
                            placeholderTextColor="#94A3B8"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            returnKeyType="search"
                        />
                        {searchTerm !== '' && (
                            <TouchableOpacity onPress={clearSearch}>
                                <Ionicons name="close-circle" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.filterTabs}>
                        {['all', 'active', 'expired'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => setFilterStatus(status)}
                                style={[
                                    styles.filterTab,
                                    filterStatus === status && styles.filterTabActive
                                ]}
                            >
                                <Text style={[
                                    styles.filterTabText,
                                    filterStatus === status && styles.filterTabTextActive
                                ]}>
                                    {status.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Animated.View>

            {/* Main Content */}
            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#E53935" />
                    <Text style={styles.loadingText}>Loading subscriptions...</Text>
                </View>
            ) : (
                <Animated.FlatList
                    data={filteredSubscriptions}
                    renderItem={renderSubscriptionCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listPadding}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#E53935"
                            colors={['#E53935']}
                        />
                    }
                    ListHeaderComponent={subscriptions.length > 0 ? ListHeaderComponent : null}
                    ListEmptyComponent={EmptyState}
                />
            )}

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

            <SubscriptionHistoryDrawer
                visible={showHistoryDrawer}
                onClose={() => setShowHistoryDrawer(false)}
                subscription={selectedSubscription}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB'
    },

    // Fixed top stripe
    topSafetyStripe: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#F8F9FB',
        zIndex: 100,
    },

    // Header
    header: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: STATUS_BAR_HEIGHT,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    headerGreeting: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    addButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Search
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: 'transparent',
        marginBottom: 16,
    },
    searchBoxActive: {
        backgroundColor: '#FFF',
        borderColor: '#E53935',
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
        paddingVertical: 8,
    },

    // Filter Tabs
    filterTabs: {
        flexDirection: 'row',
        gap: 8,
    },
    filterTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterTabActive: {
        backgroundColor: '#E53935',
        borderColor: '#E53935',
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    filterTabTextActive: {
        color: '#FFF',
    },

    // List
    listPadding: {
        paddingTop: Platform.OS === 'ios' ? 270 : 250,
        paddingHorizontal: 20,
        paddingBottom: 100,
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F0F0F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#F0F0F5',
        alignSelf: 'center',
    },

    // Cards
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    cardHeader: {
        marginBottom: 12,
    },
    clientInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    dateRange: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    historyButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Status
    statusContainer: {
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusActive: {
        backgroundColor: '#E8F5E9',
        borderColor: '#34C759',
    },
    statusExpired: {
        backgroundColor: '#F1F5F9',
        borderColor: '#CBD5E1',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statusTextActive: {
        color: '#34C759',
    },
    statusTextExpired: {
        color: '#64748B',
    },

    // Finance Grid
    financeGrid: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FC',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    financeItem: {
        flex: 1,
        alignItems: 'center',
    },
    financeLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    financeValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    paidValue: {
        color: '#34C759',
    },
    balanceDue: {
        color: '#E53935',
    },
    balanceZero: {
        color: '#64748B',
    },
    financeDivider: {
        width: 1,
        height: '70%',
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
    },

    // Card Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    daysInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    daysText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    editIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    editText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E53935',
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    emptyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    emptyButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },

    // Loading
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
});