// app/(tabs)/clients.js — Final Modern Design with Fixed Header
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Keyboard,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getAllClients, searchClients } from '../../src/database/queries';
import { showError } from '../../src/ui/toast.js';
import AddClientDrawer from '../components/AddClientDrawer';
import EditClientDrawer from '../components/EditClientDrawer';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 47 : StatusBar.currentHeight || 0;

export default function ClientsScreen() {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const [showEditDrawer, setShowEditDrawer] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;

    // Header animation values
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

    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await getAllClients();
            setClients(data);
            if (!searchTerm) setFilteredClients(data);
        } catch {
            showError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        loadClients();
    }, []));

    const handleSearch = async (text) => {
        setSearchTerm(text);
        if (text.trim() === '') {
            setFilteredClients(clients);
        } else {
            const results = await searchClients(text);
            setFilteredClients(results);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        setFilteredClients(clients);
        Keyboard.dismiss();
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const ClientCard = ({ item }) => {
        const initials = getInitials(item.name);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => {
                    setSelectedClient(item);
                    setShowEditDrawer(true);
                }}
            >
                <View style={styles.cardMain}>
                    <LinearGradient
                        colors={['#E53935', '#C62828']}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>{initials}</Text>
                    </LinearGradient>

                    <View style={styles.cardInfo}>
                        <Text style={styles.clientName}>{item.name}</Text>
                        <View style={styles.phoneContainer}>
                            <Ionicons name="call-outline" size={12} color="#64748B" />
                            <Text style={styles.phoneText}>{item.phone}</Text>
                        </View>

                        {item.email ? (
                            <View style={styles.emailContainer}>
                                <Ionicons name="mail-outline" size={12} color="#64748B" />
                                <Text style={styles.emailText} numberOfLines={1}>{item.email}</Text>
                            </View>
                        ) : null}

                        {item.address ? (
                            <View style={styles.addressContainer}>
                                <Ionicons name="location-outline" size={12} color="#64748B" />
                                <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                            </View>
                        ) : null}

                        {item.notes ? (
                            <View style={styles.notesBadge}>
                                <Ionicons name="document-text-outline" size={10} color="#64748B" />
                                <Text style={styles.notesText}>Note</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.chevronContainer}>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={40} color="#E53935" />
            </View>
            <Text style={styles.emptyTitle}>No clients yet</Text>
            <Text style={styles.emptyMessage}>
                {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "Add your first client to get started"}
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
                        <Text style={styles.emptyButtonText}>Add Client</Text>
                        <Ionicons name="add" size={18} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );

    const ListHeaderComponent = () => (
        <View style={styles.statsContainer}>
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{clients.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statValue}>
                    {clients.filter(c => c.email).length}
                </Text>
                <Text style={styles.statLabel}>With Email</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statValue}>
                    {clients.filter(c => c.address).length}
                </Text>
                <Text style={styles.statLabel}>With Address</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* Fixed top safety stripe */}
            <View style={styles.topSafetyStripe} />

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
                <SafeAreaView>
                    <View style={styles.headerInner}>
                        <View style={styles.titleRow}>
                            <View>
                                <Text style={styles.greeting}>Management</Text>
                                <Text style={styles.title}>Clients</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowAddDrawer(true)}
                                style={styles.addBtn}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#E53935', '#C62828']}
                                    style={styles.addBtnGrad}
                                >
                                    <Ionicons name="add" size={22} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.searchBox, isSearchFocused && styles.searchBoxActive]}>
                            <Ionicons
                                name="search"
                                size={18}
                                color={isSearchFocused ? "#E53935" : "#94A3B8"}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Search clients..."
                                placeholderTextColor="#94A3B8"
                                value={searchTerm}
                                onChangeText={handleSearch}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                returnKeyType="search"
                                clearButtonMode="never"
                            />
                            {searchTerm !== '' && (
                                <TouchableOpacity onPress={clearSearch}>
                                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </SafeAreaView>
            </Animated.View>

            {/* Main Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#E53935" />
                    <Text style={styles.loadingText}>Loading clients...</Text>
                </View>
            ) : (
                <Animated.FlatList
                    data={filteredClients}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listPadding}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => <ClientCard item={item} />}
                    ListHeaderComponent={clients.length > 0 ? ListHeaderComponent : null}
                    ListEmptyComponent={EmptyState}
                />
            )}

            <AddClientDrawer
                visible={showAddDrawer}
                onClose={() => setShowAddDrawer(false)}
                onClientAdded={loadClients}
            />

            <EditClientDrawer
                visible={showEditDrawer}
                onClose={() => setShowEditDrawer(false)}
                client={selectedClient}
                onClientUpdated={loadClients}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB'
    },

    // Fixed top stripe - matches background
    topSafetyStripe: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: STATUS_BAR_HEIGHT,
        backgroundColor: '#F8F9FB',
        zIndex: 100,
    },

    // Header
    header: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 20,
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
    headerInner: {
        paddingHorizontal: 20
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8
    },
    greeting: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    addBtn: {
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
    addBtnGrad: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
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
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
        paddingVertical: 8,
    },

    // List
    listPadding: {
        paddingTop: Platform.OS === 'ios' ? 200 : 180,
        paddingHorizontal: 20,
        paddingBottom: 100
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
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    phoneText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500'
    },
    emailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    emailText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    addressText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
    },
    notesBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F1F5F9',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 6,
    },
    notesText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    chevronContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
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