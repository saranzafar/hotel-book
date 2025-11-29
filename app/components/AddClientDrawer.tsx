// app/components/AddClientDrawer.js
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { addClient } from '../../src/database/queries';

export default function AddClientDrawer({ visible, onClose, onClientAdded }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const validateInputs = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Client name is required');
            return false;
        }
        if (!phone.trim()) {
            Alert.alert('Error', 'Phone number is required');
            return false;
        }
        if (phone.length < 10) {
            Alert.alert('Error', 'Phone number must be at least 10 digits');
            return false;
        }
        return true;
    };

    const handleAddClient = async () => {
        if (!validateInputs()) return;

        try {
            setLoading(true);
            await addClient(name, phone, email, address, notes);
            Alert.alert('Success', 'Client added successfully!');
            resetForm();
            onClose();
            onClientAdded();
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                Alert.alert('Error', 'This phone number already exists');
            } else {
                Alert.alert('Error', error.message || 'Failed to add client');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setNotes('');
    };

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
                        <Text style={styles.headerTitle}>Add New Client</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Form Content */}
                    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Client Name *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person" size={18} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#ccc"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Phone Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call" size={18} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 10-digit phone number"
                                    placeholderTextColor="#ccc"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email (Optional)</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail" size={18} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter email address"
                                    placeholderTextColor="#ccc"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Address Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address (Optional)</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="location" size={18} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter address"
                                    placeholderTextColor="#ccc"
                                    value={address}
                                    onChangeText={setAddress}
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Notes Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Notes (Optional)</Text>
                            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                                <Ionicons name="document-text" size={18} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Add any notes"
                                    placeholderTextColor="#ccc"
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
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleAddClient}
                            disabled={loading}
                        >
                            <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.submitButtonText}>
                                {loading ? 'Adding...' : 'Add Client'}
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
    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 15,
        maxHeight: 400,
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
    textAreaWrapper: {
        alignItems: 'flex-start',
        paddingVertical: 8,
    },
    textArea: {
        paddingVertical: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        marginTop: 20,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e0e0e0',
    },
    cancelButtonText: {
        fontSize: 15,
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
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 6,
    },
    buttonIcon: {
        marginRight: 4,
    },
});