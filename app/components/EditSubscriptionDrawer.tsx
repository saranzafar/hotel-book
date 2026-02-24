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
import { showError, showSuccess } from '../../src/ui/toast.js';

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
            setStartDate(parseSqlDate(subscription.startDate));
            setEndDate(parseSqlDate(subscription.endDate));
            setTotalAmount(subscription.totalAmount.toString());
            setAmountPaid(subscription.amountPaid.toString());
            setIsActive(subscription.isActive === 1);
        }
    }, [subscription, visible]);

    const parseSqlDate = (dateValue) => {
        if (!dateValue) return new Date();
        const [year, month, day] = String(dateValue).split('-').map(Number);
        return new Date(year, month - 1, day);
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

    const handleUpdateSubscription = async () => {
        try {
            setLoading(true);
            await updateSubscription(
                subscription.id,
                formatDbDate(startDate),
                formatDbDate(endDate),
                calculateTotalDays(),
                parseFloat(totalAmount),
                parseFloat(amountPaid) || 0,
                isActive ? 1 : 0,
                'custom',
                ''
            );
            showSuccess('Plan updated');
            onClose();
            onSubscriptionUpdated();
        } catch (error) {
            showError('Failed to update');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubscription = () => {
        Alert.alert('Delete Plan', 'Are you sure you want to remove this subscription?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setLoading(true);
                        await deleteSubscription(subscription.id);
                        showSuccess('Subscription deleted');
                        onClose();
                        onSubscriptionUpdated();
                    } catch (error) { showError('Failed to delete'); }
                    finally { setLoading(false); }
                }
            }
        ]);
    };

    if (!subscription) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} disabled={loading} />

                <View style={styles.floatingSheet}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="create" size={24} color="#E53935" />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Edit Plan</Text>
                            <Text style={styles.subHeaderText}>{subscription.clientName}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
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

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>TOTAL AMOUNT</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
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
                                        keyboardType="decimal-pad"
                                        value={amountPaid}
                                        onChangeText={setAmountPaid}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Days</Text>
                                <Text style={styles.summaryValue}>{calculateTotalDays()}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Balance Due</Text>
                                <Text style={[styles.summaryValue, { color: '#E53935' }]}>
                                    ₹{((parseFloat(totalAmount) || 0) - (parseFloat(amountPaid) || 0)).toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.statusRow}>
                            <View style={styles.statusLabelGroup}>
                                <View style={[styles.dot, { backgroundColor: isActive ? '#34C759' : '#8E8E93' }]} />
                                <Text style={styles.statusText}>Active Subscription</Text>
                            </View>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                trackColor={{ false: '#D1D1D6', true: '#FFEBEE' }}
                                thumbColor={isActive ? '#E53935' : '#F2F2F7'}
                            />
                        </View>
                        <View style={{ height: 20 }} />
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.deleteCircle} onPress={handleDeleteSubscription}>
                            <Ionicons name="trash-outline" size={24} color="#E53935" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitButton} onPress={handleUpdateSubscription}>
                            <Text style={styles.submitButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
                        </TouchableOpacity>
                    </View>

                    {showStartDatePicker && <DateTimePicker value={startDate} mode="date" onChange={(e, d) => { setShowStartDatePicker(false); if (d) setStartDate(d); }} />}
                    {showEndDatePicker && <DateTimePicker value={endDate} mode="date" onChange={(e, d) => { setShowEndDatePicker(false); if (d) setEndDate(d); }} />}
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
        paddingTop: 24, paddingBottom: 24, maxHeight: '85%', elevation: 15,
    },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
    iconContainer: { width: 48, height: 48, borderRadius: 20, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    headerTextContainer: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1C1C1E' },
    subHeaderText: { fontSize: 14, color: '#8E8E93', fontWeight: '600' },
    closeButton: { backgroundColor: '#F2F2F7', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    formContainer: { paddingHorizontal: 24 },
    label: { fontSize: 11, fontWeight: '800', color: '#8E8E93', marginBottom: 8, marginLeft: 4, letterSpacing: 1 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    col: { flex: 1 },
    inputWrapper: { backgroundColor: '#F5F5F7', borderRadius: 20, paddingHorizontal: 20, minHeight: 60, justifyContent: 'center' },
    pickerValue: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
    input: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
    summaryCard: { backgroundColor: '#F5F5F7', borderRadius: 24, padding: 20, borderLeftWidth: 5, borderLeftColor: '#E53935', marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    summaryLabel: { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
    summaryValue: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
    statusLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
    buttonContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginTop: 10 },
    deleteCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
    submitButton: {
        flex: 1, height: 64, borderRadius: 32, backgroundColor: '#E53935',
        justifyContent: 'center', alignItems: 'center', shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8
    },
    submitButtonText: { fontSize: 18, fontWeight: '800', color: '#FFF' }
});