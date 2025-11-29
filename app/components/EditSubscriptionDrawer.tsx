// app/components/EditSubscriptionDrawer.js
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { deleteSubscription, updateSubscription } from '../../src/database/queries';

export default function EditSubscriptionDrawer({ visible, onClose, subscription, onSubscriptionUpdated }) {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [totalAmount, setTotalAmount] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (subscription) {
            setStartDate(new Date(subscription.startDate));
            setEndDate(new Date(subscription.endDate));
            setTotalAmount(subscription.totalAmount.toString());
            setAmountPaid(subscription.amountPaid.toString());
            setIsActive(subscription.isActive === 1);
        }
    }, [subscription, visible]);

    const calculateTotalDays = () => {
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const handleStartDateChange = (event, selectedDate) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const handleEndDateChange = (event, selectedDate) => {
        setShowEndDatePicker(false);
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const validateInputs = () => {
        if (!totalAmount.trim()) {
            Alert.alert('Error', 'Total amount is required');
            return false;
        }
        if (isNaN(totalAmount) || parseFloat(totalAmount) <= 0) {
            Alert.alert('Error', 'Total amount must be a valid positive number');
            return false;
        }
        if (amountPaid && isNaN(amountPaid)) {
            Alert.alert('Error', 'Amount paid must be a valid number');
            return false;
        }
        if (endDate <= startDate) {
            Alert.alert('Error', 'End date must be after start date');
            return false;
        }
        return true;
    };

    const handleUpdateSubscription = async () => {
        if (!validateInputs()) return;

        try {
            setLoading(true);
            const totalDays = calculateTotalDays();
            const paid = parseFloat(amountPaid) || 0;
            const total = parseFloat(totalAmount);

            await updateSubscription(
                subscription.id,
                formatDate(startDate),
                formatDate(endDate),
                totalDays,
                total,
                paid,
                isActive ? 1 : 0,
                'custom',
                ''
            );

            Alert.alert('Success', 'Subscription updated successfully!');
            onClose();
            onSubscriptionUpdated();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update subscription');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubscription = () => {
        Alert.alert(
            'Delete Subscription',
            'Are you sure you want to delete this subscription? This action cannot be undone.',
            [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await deleteSubscription(subscription.id);
                            Alert.alert('Success', 'Subscription deleted successfully!');
                            onClose();
                            onSubscriptionUpdated();
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Failed to delete subscription');
                        } finally {
                            setLoading(false);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    if (!subscription) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.overlay} />

                <View style={styles.drawerContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Edit Subscription</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Client Info (Display Only) */}
                    <View style={styles.clientInfoBox}>
                        <Ionicons name="person-circle" size={24} color="#E53935" />
                        <View style={styles.clientInfoText}>
                            <Text style={styles.clientName}>{subscription.clientName}</Text>
                            <Text style={styles.clientPhone}>{subscription.phone}</Text>
                        </View>
                    </View>

                    {/* Form Content */}
                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        {/* Start Date */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Start Date *</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowStartDatePicker(true)}
                                disabled={loading}
                            >
                                <Ionicons name="calendar" size={18} color="#E53935" style={styles.dateIcon} />
                                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                            </TouchableOpacity>
                            {showStartDatePicker && (
                                <DateTimePicker
                                    value={startDate}
                                    mode="date"
                                    display="default"
                                    onChange={handleStartDateChange}
                                />
                            )}
                        </View>

                        {/* End Date */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>End Date *</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowEndDatePicker(true)}
                                disabled={loading}
                            >
                                <Ionicons name="calendar" size={18} color="#E53935" style={styles.dateIcon} />
                                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                            </TouchableOpacity>
                            {showEndDatePicker && (
                                <DateTimePicker
                                    value={endDate}
                                    mode="date"
                                    display="default"
                                    onChange={handleEndDateChange}
                                />
                            )}
                        </View>

                        {/* Total Days Display */}
                        {endDate > startDate && (
                            <View style={styles.daysDisplay}>
                                <Ionicons name="timer" size={18} color="#E53935" />
                                <Text style={styles.daysText}>Total Days: {calculateTotalDays()}</Text>
                            </View>
                        )}

                        {/* Total Amount */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Total Amount (₹) *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="cash" size={18} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter total amount"
                                    placeholderTextColor="#ccc"
                                    value={totalAmount}
                                    onChangeText={setTotalAmount}
                                    keyboardType="decimal-pad"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Amount Paid */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Amount Paid (₹) *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="checkmark-circle" size={18} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter amount paid"
                                    placeholderTextColor="#ccc"
                                    value={amountPaid}
                                    onChangeText={setAmountPaid}
                                    keyboardType="decimal-pad"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Remaining Amount Display */}
                        {totalAmount && (
                            <View style={styles.remainingDisplay}>
                                <Text style={styles.remainingLabel}>Remaining Amount:</Text>
                                <Text style={styles.remainingValue}>
                                    ₹{(parseFloat(totalAmount) - (amountPaid ? parseFloat(amountPaid) : 0)).toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Active Toggle */}
                        <View style={styles.toggleGroup}>
                            <View style={styles.toggleLabel}>
                                <Ionicons name="power" size={18} color={isActive ? '#E53935' : '#E74C3C'} />
                                <Text style={styles.toggleText}>Active Status</Text>
                            </View>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                disabled={loading}
                                trackColor={{ false: '#e0e0e0', true: '#81C784' }}
                                thumbColor={isActive ? '#E53935' : '#bbb'}
                            />
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.deleteButton]}
                            onPress={handleDeleteSubscription}
                            disabled={loading}
                        >
                            <Ionicons name="trash" size={18} color="#fff" />
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleUpdateSubscription}
                            disabled={loading}
                        >
                            <Ionicons name="checkmark" size={18} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.submitButtonText}>
                                {loading ? 'Saving...' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawerContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    clientInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#f9f9f9',
    },
    clientInfoText: {
        marginLeft: 12,
    },
    clientName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    clientPhone: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 15,
        maxHeight: 350,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#333',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dateIcon: {
        marginRight: 8,
    },
    dateText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    daysDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    daysText: {
        fontSize: 14,
        color: '#E53935',
        fontWeight: '600',
        marginLeft: 8,
    },
    remainingDisplay: {
        backgroundColor: '#E8F5E9',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    remainingLabel: {
        fontSize: 13,
        color: '#E53935',
        fontWeight: '600',
    },
    remainingValue: {
        fontSize: 16,
        color: '#E53935',
        fontWeight: 'bold',
    },
    toggleGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 16,
    },
    toggleLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        marginTop: 20,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#E74C3C',
    },
    deleteButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 6,
    },
    cancelButton: {
        backgroundColor: '#e0e0e0',
    },
    cancelButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#E53935',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 6,
    },
    buttonIcon: {
        marginRight: 4,
    },
});