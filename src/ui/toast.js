import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

const TOP_OFFSET = 58;
const THEME = {
    success: {
        title: 'Success',
        icon: 'checkmark-circle',
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
        accentColor: '#16A34A',
        titleColor: '#166534',
        textColor: '#2B4A35',
    },
    error: {
        title: 'Error',
        icon: 'alert-circle',
        backgroundColor: '#FFF5F5',
        borderColor: '#FFF5F5',
        accentColor: '#DC2626',
        titleColor: '#991B1B',
        textColor: '#5B2A2A',
    },
    info: {
        title: 'Notice',
        icon: 'information-circle',
        backgroundColor: '#FFFAF0',
        borderColor: '#FFFAF0',
        accentColor: '#D97706',
        titleColor: '#92400E',
        textColor: '#5D421E',
    },
};

const ToastCard = ({ text, type }) => {
    const theme = THEME[type] || THEME.info;
    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: theme.backgroundColor,
                    borderColor: theme.borderColor,
                },
            ]}
        >
            <View style={[styles.accent, { backgroundColor: theme.accentColor }]} />
            <View style={[styles.iconWrap, { backgroundColor: `${theme.accentColor}1A` }]}>
                <Ionicons name={theme.icon} size={16} color={theme.accentColor} />
            </View>
            <View style={styles.textBlock}>
                <Text style={[styles.title, { color: theme.titleColor }]}>{theme.title}</Text>
                <Text style={[styles.message, { color: theme.textColor }]} numberOfLines={2}>
                    {text}
                </Text>
            </View>
        </View>
    );
};

export const toastConfig = {
    success: ({ text1 }) => <ToastCard text={text1} type="success" />,
    error: ({ text1 }) => <ToastCard text={text1} type="error" />,
    info: ({ text1 }) => <ToastCard text={text1} type="info" />,
};

const commonToastOptions = {
    position: 'top',
    topOffset: TOP_OFFSET,
    visibilityTime: 2100,
    autoHide: true,
};

export const showSuccess = (message) => {
    Toast.show({
        type: 'success',
        text1: message,
        ...commonToastOptions,
    });
};

export const showError = (message) => {
    Toast.show({
        type: 'error',
        text1: message,
        ...commonToastOptions,
    });
};

export const showInfo = (message) => {
    Toast.show({
        type: 'info',
        text1: message,
        ...commonToastOptions,
    });
};

export const getErrorMessage = (error, fallback) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
};

const styles = StyleSheet.create({
    card: {
        width: '90%',
        minHeight: 58,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#0B1220',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 18,
        elevation: 6,
    },
    accent: {
        width: 4,
        alignSelf: 'stretch',
        borderRadius: 3,
        marginRight: 10,
    },
    iconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    textBlock: {
        flex: 1,
        gap: 1,
    },
    title: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    message: {
        fontSize: 12.5,
        fontWeight: '600',
        lineHeight: 17,
    },
});
