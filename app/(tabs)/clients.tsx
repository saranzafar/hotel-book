// app/(tabs)/clients.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getAllClients, searchClients } from '../../src/database/queries';
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

    useEffect(() => {
        loadClients();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadClients();
        }, [])
    );

    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await getAllClients();
            setClients(data);
            setFilteredClients(data);
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (text) => {
        setSearchTerm(text);
        if (text.trim() === '') {
            setFilteredClients(clients);
        } else {
            try {
                const results = await searchClients(text);
                setFilteredClients(results);
            } catch (error) {
                console.error('Error searching clients:', error);
            }
        }
    };

    const renderClientCard = ({ item }) => {
        // Avatar initials
        const initials = item.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

        return (
            <TouchableOpacity
                style={styles.clientCard}
                onPress={() => {
                    setSelectedClient(item);
                    setShowEditDrawer(true);
                }}
            >
                {/* Row 1: Avatar + Name + More */}
                <View style={styles.row1}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>

                    <View style={styles.nameBlock}>
                        <Text style={styles.clientName}>{item.name}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.moreBtn}
                        onPress={() => {
                            setSelectedClient(item);
                            setShowEditDrawer(true);
                        }}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color="#E53935" />
                    </TouchableOpacity>
                </View>

                {/* Row 2: Phone + Email */}
                <View style={styles.row2}>
                    <Text style={styles.detailText}>📞 {item.phone}</Text>
                    {item.email ? <Text style={styles.detailText}>📧 {item.email}</Text> : null}
                </View>

                {/* Row 3: Address */}
                {item.address ? (
                    <View style={styles.row3}>
                        <Text style={styles.detailText}>📍 {item.address}</Text>
                    </View>
                ) : null}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#E53935" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or phone..."
                    placeholderTextColor="#999"
                    value={searchTerm}
                    onChangeText={handleSearch}
                />
            </View>

            {/* Clients List */}
            {filteredClients.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No clients found</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredClients}
                    renderItem={renderClientCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    scrollEnabled={true}
                />
            )}

            {/* Add Client Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAddDrawer(true)}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            {/* Add Client Drawer */}
            <AddClientDrawer
                visible={showAddDrawer}
                onClose={() => setShowAddDrawer(false)}
                onClientAdded={loadClients}
            />

            {/* Edit Client Drawer */}
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
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 15,
        borderRadius: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#333',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 100,
    },
    /** ========== Compact Client Card Styles ========== */

    clientCard: {
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

    /* Row 1: Avatar + Name + More Button */
    row1: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF22',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E53935',
    },

    nameBlock: {
        flex: 1,
    },

    clientName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },

    moreBtn: {
        padding: 6,
    },

    /* Row 2: Phone + Email in one line */
    row2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },

    /* Row 3: Address */
    row3: {
        marginTop: 2,
    },

    detailText: {
        fontSize: 12.5,
        color: '#555',
        flexShrink: 1,
    },
    clientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    clientInfo: {
        flex: 1,
    },
    clientPhone: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    clientEmail: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    clientAddress: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E53935',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
});