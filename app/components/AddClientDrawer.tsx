// app/components/AddClientDrawer.js — Keyboard Perfectly Aligned (No KAV in Modal)
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Keyboard,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { addClient } from '../../src/database/queries';
import { getErrorMessage, showError, showSuccess } from '../../src/ui/toast.js';

const { height } = Dimensions.get('window');

// ─── Approximate fixed chrome heights ────────────────────────────────────────
const HANDLE_HEIGHT = 28;
const HEADER_HEIGHT = 80;
const FOOTER_HEIGHT = 96;
const FORM_PADDING_V = 24;
const SCROLL_BUFFER = 24;

// ─── InputField — defined OUTSIDE parent so React never remounts it ───────────
const InputField = React.memo(({
    label, value, onChangeText, placeholder, icon,
    required = false, keyboardType = 'default', multiline = false,
    autoCapitalize = 'sentences', maxLength, fieldName,
    isFocused, onFocus, onBlur, inputRef, editable,
    returnKeyType, onSubmitEditing,
}) => (
    <View style={styles.inputGroup}>
        <View style={styles.labelContainer}>
            <Ionicons name={icon} size={16} color={isFocused ? '#E53935' : '#8E8E93'} />
            <Text style={[styles.label, isFocused && styles.labelFocused]}>
                {label}
                {required && <Text style={styles.required}> *</Text>}
            </Text>
        </View>
        <View style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
            multiline && styles.inputWrapperMultiline,
        ]}>
            <TextInput
                ref={inputRef}
                style={[styles.input, multiline && styles.textArea]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#AEAEB2"
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
                textAlignVertical={multiline ? 'top' : 'center'}
                editable={editable}
                autoCapitalize={autoCapitalize}
                maxLength={maxLength}
                onFocus={() => onFocus(fieldName)}
                onBlur={onBlur}
                returnKeyType={returnKeyType}
                onSubmitEditing={onSubmitEditing}
                blurOnSubmit={!multiline}
                scrollEnabled={multiline}
            />
            {isFocused && (
                <LinearGradient
                    colors={['#E53935', '#C62828']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.inputActiveIndicator}
                />
            )}
        </View>
    </View>
));

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function AddClientDrawer({ visible, onClose, onClientAdded }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);
    const [kbHeight, setKbHeight] = useState(0);

    const kbHeightAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;
    const animTimerRef = useRef(null);
    const scrollViewRef = useRef(null);
    const inputGroupRefs = useRef({});
    const inputRefs = useRef({ name: null, phone: null, email: null, address: null, notes: null });
    const kbHeightRef = useRef(0);

    // ── Keyboard listeners ──────────────────────────────────────────────────
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const dur = Platform.OS === 'ios' ? 250 : 160;

        const onShow = (e) => {
            const kb = e.endCoordinates.height;
            kbHeightRef.current = kb;
            setKbHeight(kb);
            Animated.timing(kbHeightAnim, {
                toValue: kb, duration: dur, useNativeDriver: false,
            }).start();
        };

        const onHide = () => {
            kbHeightRef.current = 0;
            setKbHeight(0);
            Animated.timing(kbHeightAnim, {
                toValue: 0, duration: dur, useNativeDriver: false,
            }).start();
        };

        const showSub = Keyboard.addListener(showEvent, onShow);
        const hideSub = Keyboard.addListener(hideEvent, onHide);
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    // Scroll focused field into view when keyboard appears
    useEffect(() => {
        if (kbHeight > 0 && focusedInput) {
            scrollFieldIntoView(focusedInput, kbHeight);
        }
    }, [kbHeight, focusedInput]);

    const scrollFieldIntoView = useCallback((fieldName, currentKbHeight) => {
        const groupRef = inputGroupRefs.current[fieldName];
        if (!groupRef || !scrollViewRef.current) return;

        const delay = Platform.OS === 'ios' ? 60 : 150;
        setTimeout(() => {
            groupRef.measureLayout(

                scrollViewRef.current.getScrollableNode?.() ?? scrollViewRef.current,
                (_x, y) => {
                    scrollViewRef.current?.scrollTo({
                        y: Math.max(0, y - SCROLL_BUFFER),
                        animated: true,
                    });
                },
                () => {
                    // Fallback if measureLayout fails
                    scrollViewRef.current?.scrollTo({ y: 80, animated: true });
                }
            );
        }, delay);
    }, []);

    // ── Sheet open/close animations ─────────────────────────────────────────
    useEffect(() => {
        if (visible) {
            slideAnim.setValue(height);
            fadeAnim.setValue(0);
            formOpacity.setValue(0);

            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0, damping: 22, stiffness: 200, mass: 0.8, useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
            ]).start();

            animTimerRef.current = setTimeout(() => {
                Animated.timing(formOpacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
            }, 160);
        } else {
            if (animTimerRef.current) clearTimeout(animTimerRef.current);
            resetForm();
        }
        return () => { if (animTimerRef.current) clearTimeout(animTimerRef.current); };
    }, [visible]);

    // ── Helpers ─────────────────────────────────────────────────────────────
    const resetForm = useCallback(() => {
        setName(''); setPhone(''); setEmail(''); setAddress(''); setNotes('');
        setFocusedInput(null); setLoading(false); setKbHeight(0);
        kbHeightAnim.setValue(0); kbHeightRef.current = 0;
    }, []);

    const animateClose = useCallback((callback) => {
        Keyboard.dismiss();
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: height, duration: 260, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => { resetForm(); callback?.(); });
    }, [resetForm]);

    const handleClose = useCallback(() => animateClose(onClose), [animateClose, onClose]);

    const formatPhone = useCallback((text) => {
        const c = text.replace(/\D/g, '');
        if (c.length <= 4) return c;
        if (c.length <= 11) return `${c.slice(0, 4)}-${c.slice(4)}`;
        return `${c.slice(0, 4)}-${c.slice(4, 11)}`;
    }, []);

    const handlePhoneChange = useCallback((t) => setPhone(formatPhone(t)), [formatPhone]);

    const validateInputs = useCallback(() => {
        if (!name.trim()) { showError('Client name is required'); return false; }
        if (!phone.trim()) { showError('Phone number is required'); return false; }
        if (phone.replace(/\D/g, '').length < 10) { showError('Phone must be at least 10 digits'); return false; }
        return true;
    }, [name, phone]);

    const handleAddClient = useCallback(async () => {
        if (!validateInputs()) return;
        try {
            setLoading(true);
            Keyboard.dismiss();
            await addClient(name.trim(), phone.replace(/\D/g, ''), email.trim(), address.trim(), notes.trim());
            showSuccess('Client added successfully');
            animateClose(() => { onClose(); onClientAdded(); });
        } catch (error) {
            const msg = getErrorMessage(error, 'Failed to add client');
            showError(msg.includes('UNIQUE constraint failed') ? 'Phone number already exists' : msg);
            setLoading(false);
        }
    }, [name, phone, email, address, notes, validateInputs, animateClose, onClose, onClientAdded]);

    const handleFocus = useCallback((fieldName) => {
        setFocusedInput(fieldName);
        // If keyboard is already up, scroll immediately
        if (kbHeightRef.current > 0) {
            scrollFieldIntoView(fieldName, kbHeightRef.current);
        }
    }, [scrollFieldIntoView]);

    const handleBlur = useCallback(() => setFocusedInput(null), []);

    const focusNext = useCallback((fieldName) => {
        const order = ['name', 'phone', 'email', 'address', 'notes'];
        const next = order[order.indexOf(fieldName) + 1];
        if (next) inputRefs.current[next]?.focus();
        else Keyboard.dismiss();
    }, []);

    // ── Scroll area shrinks to stay above keyboard ───────────────────────────
    // This is the key fix: instead of pushing the whole sheet up (which moves
    // the header offscreen), we only shrink the middle scroll area.
    const baseScrollH =
        height * 0.92 - HANDLE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - FORM_PADDING_V;

    const scrollMaxHeight = kbHeightAnim.interpolate({
        inputRange: [0, height],
        outputRange: [baseScrollH, Math.max(baseScrollH - height, 80)],
        extrapolate: 'clamp',
    });

    if (!visible) return null;

    // Convenience factory so JSX stays clean
    const fp = (fieldName, extra = {}) => ({
        fieldName,
        isFocused: focusedInput === fieldName,
        onFocus: handleFocus,
        onBlur: handleBlur,
        inputRef: (r) => (inputRefs.current[fieldName] = r),
        editable: !loading,
        onSubmitEditing: () => focusNext(fieldName),
        ...extra,
    });

    return (
        <Modal
            visible={visible}
            transparent
            statusBarTranslucent
            animationType="none"
            onRequestClose={handleClose}
        >
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
            </Animated.View>

            {/* Tap outside to close */}
            <TouchableWithoutFeedback onPress={handleClose}>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            {/* Sheet — positioned absolutely at bottom, never moved by KAV */}
            <Animated.View
                style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
            >
                {/* Handle */}
                <View style={styles.sheetHandle}>
                    <View style={styles.handleBar} />
                </View>

                {/* Header — always visible, never pushed off screen */}
                <LinearGradient colors={['#FFFFFF', '#F8F9FC']} style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.iconContainer}>
                            <LinearGradient colors={['#E53935', '#C62828']} style={styles.iconGradient}>
                                <Ionicons name="person-add" size={24} color="#FFFFFF" />
                            </LinearGradient>
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>New Client</Text>
                            <Text style={styles.headerSubtitle}>Add client details</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={handleClose}
                        disabled={loading}
                        style={styles.closeButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons name="close" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Form scroll area — shrinks as keyboard rises */}
                <Animated.ScrollView
                    ref={scrollViewRef}
                    style={[styles.formContainer, { maxHeight: scrollMaxHeight }]}
                    contentContainerStyle={styles.formContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    scrollEventThrottle={16}
                >
                    <Animated.View style={{ opacity: formOpacity }}>

                        <View ref={(r) => { inputGroupRefs.current.name = r; }} collapsable={false}>
                            <InputField
                                label="Full Name" value={name} onChangeText={setName}
                                placeholder="John Doe" icon="person-outline" required
                                autoCapitalize="words" returnKeyType="next"
                                {...fp('name')}
                            />
                        </View>

                        <View ref={(r) => { inputGroupRefs.current.phone = r; }} collapsable={false}>
                            <InputField
                                label="Phone Number" value={phone} onChangeText={handlePhoneChange}
                                placeholder="0300-1234567" icon="call-outline" required
                                keyboardType="phone-pad" maxLength={12} returnKeyType="next"
                                {...fp('phone')}
                            />
                        </View>

                        <View ref={(r) => { inputGroupRefs.current.email = r; }} collapsable={false}>
                            <InputField
                                label="Email Address" value={email} onChangeText={setEmail}
                                placeholder="john@example.com" icon="mail-outline"
                                keyboardType="email-address" autoCapitalize="none" returnKeyType="next"
                                {...fp('email')}
                            />
                        </View>

                        <View ref={(r) => { inputGroupRefs.current.address = r; }} collapsable={false}>
                            <InputField
                                label="Address" value={address} onChangeText={setAddress}
                                placeholder="Street address, city" icon="home-outline" returnKeyType="next"
                                {...fp('address')}
                            />
                        </View>

                        <View ref={(r) => { inputGroupRefs.current.notes = r; }} collapsable={false}>
                            <InputField
                                label="Notes" value={notes} onChangeText={setNotes}
                                placeholder="Additional information..." icon="document-text-outline"
                                multiline returnKeyType="done"
                                {...fp('notes', { onSubmitEditing: () => Keyboard.dismiss() })}
                            />
                        </View>

                        <View style={styles.helperContainer}>
                            <Ionicons name="information-circle-outline" size={16} color="#8E8E93" />
                            <Text style={styles.helperText}>
                                Fields marked with <Text style={styles.required}>*</Text> are required
                            </Text>
                        </View>

                    </Animated.View>
                </Animated.ScrollView>

                {/* Footer — always anchored at bottom of sheet, above keyboard */}
                <Animated.View style={[styles.footer, { opacity: formOpacity }]}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleClose}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleAddClient}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={loading ? ['#AEAEB2', '#8E8E93'] : ['#E53935', '#C62828']}
                            style={styles.submitGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text style={styles.submitButtonText}>Add Client</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: height * 0.92,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 20,
    },
    sheetHandle: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D1D6',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(142,142,147,0.1)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    iconGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '500',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(142,142,147,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        paddingHorizontal: 24,
    },
    formContent: {
        paddingTop: 16,
        paddingBottom: 12,
    },
    inputGroup: {
        marginBottom: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        marginLeft: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    labelFocused: {
        color: '#E53935',
    },
    required: {
        color: '#E53935',
        fontWeight: '800',
    },
    inputWrapper: {
        backgroundColor: '#F8F9FC',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(142,142,147,0.1)',
        minHeight: 56,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    inputWrapperFocused: {
        borderColor: '#E53935',
        backgroundColor: '#FFFFFF',
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    inputWrapperMultiline: {
        minHeight: 100,
        paddingVertical: 12,
    },
    input: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    inputActiveIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
    },
    helperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    helperText: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(142,142,147,0.1)',
        backgroundColor: '#FFFFFF',
    },
    button: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    cancelButton: {
        backgroundColor: '#F8F9FC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(142,142,147,0.1)',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8E8E93',
    },
    submitButton: {
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    submitButtonDisabled: {
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
    },
    submitGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});