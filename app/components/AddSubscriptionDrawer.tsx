// app/components/AddSubscriptionDrawer.js
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { addSubscription, getAllClients } from '../../src/database/queries';

export default function AddSubscriptionDrawer({
    visible,
    onClose,
    onSubscriptionAdded,
}) {
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [showClientPicker, setShowClientPicker] = useState(false);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const [totalAmount, setTotalAmount] = useState('');
    const [amountPaid, setAmountPaid] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);

    useEffect(() => {
        if (visible) loadClients();
    }, [visible]);

    const loadClients = async () => {
        try {
            setLoadingClients(true);
            const data = await getAllClients();
            setClients(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load clients');
        } finally {
            setLoadingClients(false);
        }
    };

    const calculateTotalDays = () => {
        const diffTime = Math.abs(endDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const formatDate = (date) => date.toISOString().split('T')[0];

    const handleStartDateChange = (_, selectedDate) => {
        setShowStartDatePicker(false);
        if (selectedDate) setStartDate(selectedDate);
    };

    const handleEndDateChange = (_, selectedDate) => {
        setShowEndDatePicker(false);
        if (selectedDate) setEndDate(selectedDate);
    };

    const validateInputs = () => {
        if (!selectedClient) {
            Alert.alert('Error', 'Please select a client');
            return false;
        }
        if (!totalAmount.trim()) {
            Alert.alert('Error', 'Total amount is required');
            return false;
        }
        if (isNaN(totalAmount) || parseFloat(totalAmount) <= 0) {
            Alert.alert('Error', 'Enter a valid positive total amount');
            return false;
        }
        if (amountPaid && isNaN(amountPaid)) {
            Alert.alert('Error', 'Amount paid must be numeric');
            return false;
        }
        if (endDate <= startDate) {
            Alert.alert('Error', 'End date must be after start date');
            return false;
        }
        return true;
    };

    const handleAddSubscription = async () => {
        if (!validateInputs()) return;
        try {
            setLoading(true);

            await addSubscription(
                selectedClient.id,
                formatDate(startDate),
                formatDate(endDate),
                calculateTotalDays(),
                parseFloat(totalAmount),
                amountPaid ? parseFloat(amountPaid) : 0,
                'custom',
                1,
                ''
            );

            Alert.alert('Success', 'Subscription added!');
            resetForm();
            onClose();
            onSubscriptionAdded();
        } catch (error) {
            Alert.alert('Error', error.message || 'Could not add subscription');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedClient(null);
        setClientSearch('');
        setStartDate(new Date());
        setEndDate(new Date());
        setTotalAmount('');
        setAmountPaid('');
    };

    const filteredClients = clients.filter(
        (c) =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.phone.includes(clientSearch)
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <View style={styles.overlay} />

                <View style={styles.drawerContent}>
                    {/* HEADER */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Add Subscription</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* FORM */}
                    <ScrollView
                        style={styles.formContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* CLIENT SELECTOR */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Select Client *</Text>
                            <TouchableOpacity
                                style={[styles.inputWrapper, styles.clientSelector]}
                                onPress={() => setShowClientPicker(!showClientPicker)}
                            >
                                <Ionicons name="person" size={18} color="#999" />
                                <Text
                                    style={[
                                        styles.clientSelectorText,
                                        selectedClient && styles.clientSelectorTextSelected,
                                    ]}
                                >
                                    {selectedClient ? selectedClient.name : 'Select a client'}
                                </Text>
                                <Ionicons name="chevron-down" size={18} color="#999" />
                            </TouchableOpacity>

                            {/* DROPDOWN */}
                            {showClientPicker && (
                                <View style={styles.clientDropdown}>
                                    {/* SEARCH BOX */}
                                    <View style={styles.searchBox}>
                                        <Ionicons name="search" size={18} color="#888" />
                                        <TextInput
                                            placeholder="Search clients..."
                                            placeholderTextColor="#aaa"
                                            value={clientSearch}
                                            onChangeText={setClientSearch}
                                            style={styles.searchInput}
                                        />
                                    </View>

                                    {/* LIST */}
                                    {loadingClients ? (
                                        <ActivityIndicator size="small" color="#E53935" />
                                    ) : (
                                        <ScrollView style={{ maxHeight: 220 }}>
                                            {filteredClients.length === 0 ? (
                                                <Text style={{ textAlign: 'center', paddingVertical: 10, color: '#888' }}>
                                                    No matching clients
                                                </Text>
                                            ) : (
                                                filteredClients.map((item) => (
                                                    <TouchableOpacity
                                                        key={item.id}
                                                        style={styles.clientOption}
                                                        onPress={() => {
                                                            setSelectedClient(item);
                                                            setShowClientPicker(false);
                                                        }}
                                                    >
                                                        <Text style={styles.clientOptionName}>{item.name}</Text>
                                                        <Text style={styles.clientOptionPhone}>{item.phone}</Text>
                                                    </TouchableOpacity>
                                                ))
                                            )}
                                        </ScrollView>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* ROW 1 — START & END DATE */}
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Start Date *</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <Ionicons
                                        name="calendar"
                                        size={18}
                                        color="#E53935"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                                </TouchableOpacity>
                                {showStartDatePicker && (
                                    <DateTimePicker
                                        value={startDate}
                                        mode="date"
                                        onChange={handleStartDateChange}
                                    />
                                )}
                            </View>

                            <View style={styles.col}>
                                <Text style={styles.label}>End Date *</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowEndDatePicker(true)}
                                >
                                    <Ionicons
                                        name="calendar"
                                        size={18}
                                        color="#E53935"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                                </TouchableOpacity>
                                {showEndDatePicker && (
                                    <DateTimePicker
                                        value={endDate}
                                        mode="date"
                                        onChange={handleEndDateChange}
                                    />
                                )}
                            </View>
                        </View>

                        {/* TOTAL DAYS */}
                        {endDate > startDate && (
                            <View style={styles.daysDisplay}>
                                <Ionicons name="timer" size={18} color="#E53935" />
                                <Text style={styles.daysText}>
                                    Total Days: {calculateTotalDays()}
                                </Text>
                            </View>
                        )}

                        {/* ROW 2 — TOTAL AMOUNT & PAID */}
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Total Amount (₹) *</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="cash"
                                        size={18}
                                        color="#999"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Total"
                                        keyboardType="decimal-pad"
                                        value={totalAmount}
                                        onChangeText={setTotalAmount}
                                    />
                                </View>
                            </View>

                            <View style={styles.col}>
                                <Text style={styles.label}>Amount Paid (₹)</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={18}
                                        color="#999"
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Paid"
                                        keyboardType="decimal-pad"
                                        value={amountPaid}
                                        onChangeText={setAmountPaid}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* REMAINING AMOUNT */}
                        {totalAmount !== '' && (
                            <View style={styles.remainingDisplay}>
                                <Text style={styles.remainingLabel}>Remaining:</Text>
                                <Text style={styles.remainingValue}>
                                    ₹
                                    {(
                                        parseFloat(totalAmount) -
                                        (amountPaid ? parseFloat(amountPaid) : 0)
                                    ).toFixed(2)}
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* BUTTONS */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.submitButton,
                                loading && styles.submitButtonDisabled,
                            ]}
                            onPress={handleAddSubscription}
                            disabled={loading}
                        >
                            <Ionicons
                                name="checkmark"
                                size={20}
                                color="#fff"
                                style={styles.buttonIcon}
                            />
                            <Text style={styles.submitButtonText}>
                                {loading ? 'Adding...' : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

/* ============================================================
   ALL STYLES
   ============================================================ */

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-end' },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },

    drawerContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingBottom: 20,
        maxHeight: '90%',
    },

    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },

    formContainer: { paddingHorizontal: 20, paddingTop: 12 },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#444',
        marginBottom: 6,
    },

    /* Rows & Column Layout */
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 14,
        marginBottom: 16,
    },
    col: {
        flex: 1,
    },

    /* Inputs */
    inputGroup: { marginBottom: 16 },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333',
    },

    /* Client Selector */
    clientSelector: { justifyContent: 'space-between' },
    clientSelectorText: {
        flex: 1,
        fontSize: 14,
        marginLeft: 8,
        color: '#aaa',
    },
    clientSelectorTextSelected: { color: '#333' },

    clientDropdown: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        marginTop: 10,
        padding: 12,
    },

    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eee',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },

    clientOption: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    clientOptionName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    clientOptionPhone: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },

    /* Dates */
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#f7f7f7',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
    },
    dateText: { fontSize: 14, color: '#333' },

    daysDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    daysText: { marginLeft: 8, color: '#E53935', fontWeight: '600' },

    /* Remaining Amount */
    remainingDisplay: {
        backgroundColor: '#E8F5E9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    remainingLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E53935',
    },
    remainingValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E53935',
    },

    /* Buttons */
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: { backgroundColor: '#e0e0e0' },
    cancelButtonText: { fontWeight: '600', color: '#444' },

    submitButton: { backgroundColor: '#E53935' },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 4,
    },
    buttonIcon: { marginRight: 4 },
});
