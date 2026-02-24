import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
} from 'react-native';
import { getPaymentHistoryPage, getSubscriptionHistoryPage } from '../../src/database/queries';
import { getErrorMessage, showError } from '../../src/ui/toast.js';

const PAGE_SIZE = 12;

export default function SubscriptionHistoryDrawer({ visible, onClose, subscription }) {
    const [activeTab, setActiveTab] = useState('subscription');
    const [initialLoading, setInitialLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [subscriptionPage, setSubscriptionPage] = useState(1);
    const [subscriptionHasMore, setSubscriptionHasMore] = useState(true);
    const [subscriptionItems, setSubscriptionItems] = useState([]);

    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentHasMore, setPaymentHasMore] = useState(true);
    const [paymentItems, setPaymentItems] = useState([]);

    const selectedSubscriptionId = subscription?.id || null;

    const resetState = useCallback(() => {
        setSubscriptionItems([]);
        setPaymentItems([]);
        setSubscriptionPage(1);
        setPaymentPage(1);
        setSubscriptionHasMore(true);
        setPaymentHasMore(true);
        setActiveTab('subscription');
    }, []);

    const loadSubscriptionHistory = useCallback(
        async (page, append = false) => {
            if (!selectedSubscriptionId) return;
            const result = await getSubscriptionHistoryPage(selectedSubscriptionId, page, PAGE_SIZE);
            setSubscriptionItems((prev) => (append ? [...prev, ...result.items] : result.items));
            setSubscriptionHasMore(result.hasMore);
            setSubscriptionPage(page);
        },
        [selectedSubscriptionId]
    );

    const loadPaymentHistory = useCallback(
        async (page, append = false) => {
            if (!selectedSubscriptionId) return;
            const result = await getPaymentHistoryPage(selectedSubscriptionId, page, PAGE_SIZE);
            setPaymentItems((prev) => (append ? [...prev, ...result.items] : result.items));
            setPaymentHasMore(result.hasMore);
            setPaymentPage(page);
        },
        [selectedSubscriptionId]
    );

    const loadInitial = useCallback(async () => {
        if (!selectedSubscriptionId) return;
        try {
            setInitialLoading(true);
            await Promise.all([loadSubscriptionHistory(1), loadPaymentHistory(1)]);
        } catch (error) {
            showError(getErrorMessage(error, 'Failed to load history'));
        } finally {
            setInitialLoading(false);
        }
    }, [selectedSubscriptionId, loadSubscriptionHistory, loadPaymentHistory]);

    useEffect(() => {
        if (visible && selectedSubscriptionId) {
            resetState();
            loadInitial();
        }
    }, [visible, selectedSubscriptionId, resetState, loadInitial]);

    const onRefresh = async () => {
        if (!selectedSubscriptionId) return;
        try {
            setRefreshing(true);
            await Promise.all([loadSubscriptionHistory(1), loadPaymentHistory(1)]);
        } catch (error) {
            showError(getErrorMessage(error, 'Failed to refresh history'));
        } finally {
            setRefreshing(false);
        }
    };

    const loadMore = async () => {
        if (loadingMore || !selectedSubscriptionId) return;
        try {
            setLoadingMore(true);
            if (activeTab === 'subscription' && subscriptionHasMore) {
                await loadSubscriptionHistory(subscriptionPage + 1, true);
            } else if (activeTab === 'payments' && paymentHasMore) {
                await loadPaymentHistory(paymentPage + 1, true);
            }
        } catch (error) {
            showError(getErrorMessage(error, 'Failed to load more history'));
        } finally {
            setLoadingMore(false);
        }
    };

    const data = useMemo(
        () => (activeTab === 'subscription' ? subscriptionItems : paymentItems),
        [activeTab, subscriptionItems, paymentItems]
    );

    const renderSubscriptionHistoryItem = ({ item }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyTopRow}>
                <Text style={styles.historyType}>{String(item.eventType || '').toUpperCase()}</Text>
                <Text style={styles.historyAt}>{item.eventAt?.slice(0, 16).replace('T', ' ')}</Text>
            </View>
            <Text style={styles.historyLine}>{item.startDate} to {item.endDate}</Text>
            <Text style={styles.historyLine}>Total: ₹{item.totalAmount} | Paid: ₹{item.amountPaid}</Text>
            {item.eventReason ? <Text style={styles.historyReason}>{item.eventReason}</Text> : null}
        </View>
    );

    const renderPaymentHistoryItem = ({ item }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyTopRow}>
                <Text style={styles.historyType}>PAYMENT</Text>
                <Text style={styles.historyAt}>{item.paymentDate}</Text>
            </View>
            <Text style={styles.historyLine}>
                Paid ₹{item.amount} | Remaining ₹{item.remainingAfter}
            </Text>
            <Text style={styles.historyLine}>
                Before ₹{item.amountPaidBefore} → After ₹{item.amountPaidAfter}
            </Text>
            {item.paymentMethod ? <Text style={styles.historyReason}>Method: {item.paymentMethod}</Text> : null}
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.drawer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>History</Text>
                            <Text style={styles.subtitle}>{subscription?.clientName || 'Subscription'}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={26} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabs}>
                        <TouchableOpacity
                            onPress={() => setActiveTab('subscription')}
                            style={[styles.tabBtn, activeTab === 'subscription' && styles.tabBtnActive]}
                        >
                            <Text style={[styles.tabText, activeTab === 'subscription' && styles.tabTextActive]}>
                                Subscription
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('payments')}
                            style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]}
                        >
                            <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
                                Payments
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {initialLoading ? (
                        <View style={styles.loaderWrap}>
                            <ActivityIndicator color="#E53935" />
                        </View>
                    ) : (
                        <FlatList
                            data={data}
                            keyExtractor={(item) => `${activeTab}-${item.id}`}
                            renderItem={activeTab === 'subscription' ? renderSubscriptionHistoryItem : renderPaymentHistoryItem}
                            contentContainerStyle={styles.listContent}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E53935" />}
                            onEndReached={loadMore}
                            onEndReachedThreshold={0.3}
                            ListEmptyComponent={
                                <View style={styles.emptyWrap}>
                                    <Text style={styles.emptyText}>No history found.</Text>
                                </View>
                            }
                            ListFooterComponent={
                                loadingMore ? (
                                    <View style={styles.footerLoading}>
                                        <ActivityIndicator color="#E53935" />
                                    </View>
                                ) : null
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    drawer: {
        height: '86%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: { fontSize: 20, fontWeight: '800', color: '#222' },
    subtitle: { marginTop: 2, fontSize: 13, color: '#666' },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        paddingTop: 12,
    },
    tabBtn: {
        flex: 1,
        backgroundColor: '#f1f1f1',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
    },
    tabBtnActive: { backgroundColor: '#E53935' },
    tabText: { fontSize: 13, fontWeight: '700', color: '#666' },
    tabTextActive: { color: '#fff' },
    listContent: { padding: 16, paddingBottom: 30, gap: 10 },
    historyCard: {
        backgroundColor: '#FAFAFA',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 12,
    },
    historyTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    historyType: { fontSize: 11, fontWeight: '800', color: '#E53935' },
    historyAt: { fontSize: 11, color: '#999' },
    historyLine: { fontSize: 13, color: '#333', marginBottom: 2 },
    historyReason: { fontSize: 12, color: '#666', marginTop: 4 },
    loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: { paddingTop: 80, alignItems: 'center' },
    emptyText: { color: '#999' },
    footerLoading: { paddingVertical: 12 },
});
