// app/components/AddClientDrawer.js
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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
import { getErrorMessage, showError, showSuccess } from '../../src/ui/toast.js';

export default function AddClientDrawer({ visible, onClose, onClientAdded }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleAddClient = async () => {
        if (!validateInputs()) return;

        try {
            setLoading(true);
            await addClient(name, phone, email, address, notes);
            showSuccess('Client added successfully');
            resetForm();
            onClose();
            onClientAdded();
        } catch (error) {
            const message = getErrorMessage(error, 'Failed to add client');
            if (message.includes('UNIQUE constraint failed')) {
                showError('This phone number already exists');
            } else {
                showError(message);
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
        <Modal visible={visible} animationType="fade" transparent={true} statusBarTranslucent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Darker, moodier backdrop */}
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onClose}
                    disabled={loading}
                />

                {/* Floating Bottom Sheet */}
                <View style={styles.floatingSheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="person-add" size={24} color="#E53935" />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>New Client</Text>
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
                                    placeholder="John Doe"
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
                                    placeholder="98765 43210"
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
                                    placeholder="john@example.com"
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
                                    placeholder="Room 101, Building Name"
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
                                    placeholder="Dietary preferences, specific requirements..."
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

                        <View style={{ height: 10 }} />
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleAddClient}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.submitButtonText}>
                                {loading ? 'Saving...' : 'Add Client'}
                            </Text>
                            {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
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
        borderRadius: 24,
        backgroundColor: '#FFEBEE', // Very light tint of your red
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
        backgroundColor: '#F5F5F7', // Apple's signature plush gray
        borderRadius: 20, // High border radius for pill-like feel
        paddingHorizontal: 20,
        minHeight: 60, // Very tall, comfortable touch target
        justifyContent: 'center',
    },
    input: {
        fontSize: 17, // Standard modern body text size
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
        paddingHorizontal: 24,
        marginTop: 16,
    },
    button: {
        height: 64, // Massive, premium button height
        borderRadius: 32, // Fully rounded pill shape
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    submitButton: {
        backgroundColor: '#E53935', // Your original brand color!
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