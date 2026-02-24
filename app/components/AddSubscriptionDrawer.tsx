// app/components/AddSubscriptionDrawer.js
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
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
import { getErrorMessage, showError, showSuccess } from '../../src/ui/toast.js';

export default function AddSubscriptionDrawer({ visible, onClose, onSubscriptionAdded }) {
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
        } catch {
            showError('Failed to load clients');
        } finally {
            setLoadingClients(false);
        }
    };

    const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const calculateTotalDays = () => {
        const start = normalizeDate(startDate);
        const end = normalizeDate(endDate);
        const diffTime = end.getTime() - start.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDbDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleStartDateChange = (_, selectedDate) => {
        setShowStartDatePicker(false);
        if (selectedDate) setStartDate(selectedDate);
    };

    const handleEndDateChange = (_, selectedDate) => {
        setShowEndDatePicker(false);
        if (selectedDate) setEndDate(selectedDate);
    };

    const validateInputs = () => {
        if (!selectedClient) { showError('Please select a client'); return false; }
        if (!totalAmount.trim() || isNaN(totalAmount) || parseFloat(totalAmount) <= 0) {
            showError('Enter a valid total amount'); return false;
        }
        if (amountPaid && parseFloat(amountPaid) > parseFloat(totalAmount)) {
            showError('Amount paid cannot exceed total'); return false;
        }
        if (normalizeDate(endDate) < normalizeDate(startDate)) {
            showError('End date is before start date'); return false;
        }
        return true;
    };

    const handleAddSubscription = async () => {
        if (!validateInputs()) return;
        try {
            setLoading(true);
            await addSubscription(
                selectedClient.id,
                formatDbDate(startDate),
                formatDbDate(endDate),
                calculateTotalDays(),
                parseFloat(totalAmount),
                amountPaid ? parseFloat(amountPaid) : 0,
                'custom', 1, ''
            );
            showSuccess('Subscription activated');
            resetForm();
            onClose();
            onSubscriptionAdded();
        } catch (error) {
            showError(getErrorMessage(error, 'Failed to add subscription'));
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
        setShowClientPicker(false);
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch)
    );

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} disabled={loading} />

                <View style={styles.floatingSheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar" size={24} color="#E53935" />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>New Subscription</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        {/* Client Picker */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>MEMBER <Text style={styles.required}>*</Text></Text>
                            <TouchableOpacity
                                style={[styles.inputWrapper, styles.pickerTrigger, showClientPicker && styles.activePicker]}
                                onPress={() => setShowClientPicker(!showClientPicker)}
                            >
                                <Text style={[styles.pickerValue, !selectedClient && styles.placeholder]}>
                                    {selectedClient ? selectedClient.name : 'Choose a member...'}
                                </Text>
                                <Ionicons name={showClientPicker ? "chevron-up" : "chevron-down"} size={20} color="#8E8E93" />
                            </TouchableOpacity>

                            {showClientPicker && (
                                <View style={styles.dropdownContainer}>
                                    <View style={styles.miniSearch}>
                                        <Ionicons name="search" size={16} color="#8E8E93" />
                                        <TextInput
                                            placeholder="Search..."
                                            value={clientSearch}
                                            onChangeText={setClientSearch}
                                            style={styles.miniSearchInput}
                                        />
                                    </View>
                                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                        {filteredClients.map(client => (
                                            <TouchableOpacity
                                                key={client.id}
                                                style={styles.clientItem}
                                                onPress={() => { setSelectedClient(client); setShowClientPicker(false); }}
                                            >
                                                <Text style={styles.clientItemName}>{client.name}</Text>
                                                <Text style={styles.clientItemPhone}>{client.phone}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Date Selection */}
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>START DATE</Text>
                                <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowStartDatePicker(true)}>
                                    <Text style={styles.pickerValue}>{formatDate(startDate)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>END DATE</Text>
                                <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowEndDatePicker(true)}>
                                    <Text style={styles.pickerValue}>{formatDate(endDate)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Amount Selection */}
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>TOTAL AMOUNT</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="₹ 0.00"
                                        keyboardType="decimal-pad"
                                        value={totalAmount}
                                        onChangeText={setTotalAmount}
                                    />
                                </View>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>PAID</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="₹ 0.00"
                                        keyboardType="decimal-pad"
                                        value={amountPaid}
                                        onChangeText={setAmountPaid}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Summary Card */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Duration</Text>
                                <Text style={styles.summaryValue}>{calculateTotalDays()} Days</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Balance Due</Text>
                                <Text style={[styles.summaryValue, { color: '#E53935' }]}>
                                    ₹{((parseFloat(totalAmount) || 0) - (parseFloat(amountPaid) || 0)).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View style={{ height: 20 }} />
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.disabledButton]}
                            onPress={handleAddSubscription}
                            disabled={loading}
                        >
                            <Text style={styles.submitButtonText}>{loading ? 'Activating...' : 'Activate Subscription'}</Text>
                            {!loading && <Ionicons name="flash" size={20} color="#fff" />}
                        </TouchableOpacity>
                    </View>

                    {showStartDatePicker && <DateTimePicker value={startDate} mode="date" onChange={handleStartDateChange} />}
                    {showEndDatePicker && <DateTimePicker value={endDate} mode="date" onChange={handleEndDateChange} />}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-end' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    floatingSheet: {
        backgroundColor: '#FFF', borderRadius: 32, marginHorizontal: 16, marginBottom: 30,
        paddingTop: 24, paddingBottom: 24, maxHeight: '85%', shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15,
    },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
    iconContainer: { width: 48, height: 48, borderRadius: 20, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    headerTextContainer: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
    closeButton: { backgroundColor: '#F2F2F7', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    formContainer: { paddingHorizontal: 24 },
    label: { fontSize: 11, fontWeight: '800', color: '#8E8E93', marginBottom: 8, marginLeft: 4, letterSpacing: 1.2 },
    required: { color: '#E53935' },
    row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    col: { flex: 1 },
    inputWrapper: { backgroundColor: '#F5F5F7', borderRadius: 20, paddingHorizontal: 20, minHeight: 60, justifyContent: 'center' },
    pickerTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    activePicker: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, backgroundColor: '#EFEFF4' },
    pickerValue: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
    placeholder: { color: '#A1A1AA', fontWeight: '500' },
    input: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
    inputGroup: { marginBottom: 20 },
    dropdownContainer: { backgroundColor: '#F5F5F7', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, padding: 12, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
    miniSearch: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 40, marginBottom: 8 },
    miniSearchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1C1C1E' },
    dropdownList: { maxHeight: 150 },
    clientItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
    clientItemName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
    clientItemPhone: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
    summaryCard: { backgroundColor: '#F5F5F7', borderRadius: 24, padding: 20, marginTop: 10, borderLeftWidth: 5, borderLeftColor: '#E53935' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
    summaryValue: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
    buttonContainer: { paddingHorizontal: 24, marginTop: 10 },
    submitButton: {
        height: 64, borderRadius: 32, backgroundColor: '#E53935', flexDirection: 'row',
        justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8
    },
    disabledButton: { opacity: 0.6 },
    submitButtonText: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 }
});