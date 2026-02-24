// app/(tabs)/clients.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { getAllClients, searchClients } from '../../src/database/queries';
import { showError } from '../../src/ui/toast.js';
import AddClientDrawer from '../components/AddClientDrawer';
import EditClientDrawer from '../components/EditClientDrawer';

export default function ClientsScreen() {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const [showEditDrawer, setShowEditDrawer] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    useEffect(() => { loadClients(); }, []);
    useFocusEffect(useCallback(() => { loadClients(); }, []));

    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await getAllClients();
            setClients(data);
            setFilteredClients(data);
        } catch (error) {
            showError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (text) => {
        setSearchTerm(text);
        if (text.trim() === '') {
            setFilteredClients(clients);
        } else {
            const results = await searchClients(text);
            setFilteredClients(results);
        }
    };

    const renderClientCard = ({ item }) => {
        const initials = item.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.6}
                onPress={() => {
                    setSelectedClient(item);
                    setShowEditDrawer(true);
                }}
            >
                <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.mainInfo}>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <View style={styles.phoneContainer}>
                            <Ionicons name="call" size={14} color="#E53935" />
                            <Text style={styles.phoneText}>{item.phone}</Text>
                        </View>
                    </View>
                    <View style={styles.editBadge}>
                        <Ionicons name="chevron-forward" size={18} color="#D1D1D6" />
                    </View>
                </View>

                {/* Separate Rows for long content */}
                <View style={styles.detailsSection}>
                    {item.email && (
                        <View style={styles.detailRow}>
                            <Ionicons name="mail-outline" size={16} color="#8E8E93" />
                            <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
                        </View>
                    )}

                    {item.address && (
                        <View style={[styles.detailRow, { marginTop: 8 }]}>
                            <Ionicons name="location-outline" size={16} color="#8E8E93" />
                            <Text style={styles.detailText} numberOfLines={2}>{item.address}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <Text style={styles.title}>Directory</Text>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#AEAEB2" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or phone..."
                        placeholderTextColor="#C7C7CC"
                        value={searchTerm}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}><ActivityIndicator color="#E53935" /></View>
            ) : (
                <FlatList
                    data={filteredClients}
                    renderItem={renderClientCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddDrawer(true)}
            >
                <Ionicons name="add" size={30} color="#fff" />
                <Text style={styles.fabText}>Add Client</Text>
            </TouchableOpacity>

            <AddClientDrawer visible={showAddDrawer} onClose={() => setShowAddDrawer(false)} onClientAdded={loadClients} />
            <EditClientDrawer visible={showEditDrawer} onClose={() => setShowEditDrawer(false)} client={selectedClient} onClientUpdated={loadClients} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7', // Pure light iOS system gray
    },
    header: {
        backgroundColor: '#FFF',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: '#1C1C1E',
        letterSpacing: -1,
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    list: {
        padding: 20,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#E53935',
        fontSize: 18,
        fontWeight: '800',
    },
    mainInfo: {
        flex: 1,
        marginLeft: 16,
    },
    nameText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    phoneText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '600',
        marginLeft: 6,
    },
    detailsSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        flex: 1,
        fontSize: 14,
        color: '#636366',
        marginLeft: 10,
        fontWeight: '500',
    },
    editBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#E53935',
        paddingHorizontal: 24,
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    fabText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 8,
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});