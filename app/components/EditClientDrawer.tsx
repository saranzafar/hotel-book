// app/components/EditClientDrawer.js
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { deleteClient, updateClient } from '../../src/database/queries';
import { getErrorMessage, showError, showSuccess } from '../../src/ui/toast.js';

export default function EditClientDrawer({ visible, onClose, client, onClientUpdated }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (client) {
            setName(client.name || '');
            setPhone(client.phone || '');
            setEmail(client.email || '');
            setAddress(client.address || '');
            setNotes(client.notes || '');
        }
    }, [client, visible]);

    const validateInputs = () => {
        if (!name.trim()) {
            showError('Client name is required');
            return false;
        }
        if (!phone.trim()) {
            showError('Phone number is required');
            return false;
        }
        if (phone.length < 10) {
            showError('Phone number must be at least 10 digits');
            return false;
        }
        return true;
    };

    const handleUpdateClient = async () => {
        if (!validateInputs()) return;

        try {
            setLoading(true);
            await updateClient(client.id, name, phone, email, address, notes);
            showSuccess('Client updated successfully');
            onClose();
            onClientUpdated();
        } catch (error) {
            showError(getErrorMessage(error, 'Failed to update client'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = () => {
        Alert.alert(
            'Delete Member',
            'Are you sure you want to remove this member? This action is permanent.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Member',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await deleteClient(client.id);
                            showSuccess('Member removed');
                            onClose();
                            onClientUpdated();
                        } catch (error) {
                            showError(getErrorMessage(error, 'Failed to delete'));
                        } finally {
                            setLoading(false);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    if (!client) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent={true} statusBarTranslucent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Backdrop */}
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onClose}
                    disabled={loading}
                />

                {/* Floating Sheet */}
                <View style={styles.floatingSheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="create" size={24} color="#E53935" />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Edit Member</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    {/* Form Content */}
                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>FULL NAME <Text style={styles.required}>*</Text></Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. John Doe"
                                    placeholderTextColor="#A1A1AA"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>PHONE NUMBER <Text style={styles.required}>*</Text></Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 9876543210"
                                    placeholderTextColor="#A1A1AA"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>EMAIL ADDRESS</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. john@example.com"
                                    placeholderTextColor="#A1A1AA"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>ADDRESS</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Room number, Street, City"
                                    placeholderTextColor="#A1A1AA"
                                    value={address}
                                    onChangeText={setAddress}
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>NOTES</Text>
                            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Special instructions..."
                                    placeholderTextColor="#A1A1AA"
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline={true}
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    editable={!loading}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.deleteCircle}
                            onPress={handleDeleteClient}
                            disabled={loading}
                        >
                            <Ionicons name="trash-outline" size={24} color="#E53935" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleUpdateClient}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.submitButtonText}>
                                {loading ? 'Saving...' : 'Update Member'}
                            </Text>
                            {!loading && <Ionicons name="checkmark" size={22} color="#fff" />}
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    floatingSheet: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        marginHorizontal: 16,
        marginBottom: Platform.OS === 'ios' ? 36 : 24,
        paddingTop: 24,
        paddingBottom: 24,
        maxHeight: '88%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 20,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1C1C1E',
        letterSpacing: -0.5,
    },
    closeButton: {
        backgroundColor: '#F2F2F7',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        paddingHorizontal: 24,
        maxHeight: 450,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: '#8E8E93',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 1.2,
    },
    required: {
        color: '#E53935',
    },
    inputWrapper: {
        backgroundColor: '#F5F5F7',
        borderRadius: 20,
        paddingHorizontal: 20,
        minHeight: 60,
        justifyContent: 'center',
    },
    input: {
        fontSize: 17,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    textAreaWrapper: {
        paddingTop: 16,
        paddingBottom: 16,
        alignItems: 'flex-start',
    },
    textArea: {
        minHeight: 80,
        paddingTop: 0,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 16,
        gap: 12,
    },
    deleteCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        flex: 1,
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    submitButton: {
        backgroundColor: '#E53935',
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});
