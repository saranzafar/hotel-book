import { Dimensions } from 'react-native';
import Toast from 'react-native-toast-message';

const centerOffset = Math.round(Dimensions.get('window').height * 0.45);
const commonToastOptions = {
    position: 'top',
    topOffset: centerOffset,
    visibilityTime: 1800,
    autoHide: true,
    style: { borderLeftWidth: 0, borderRadius: 10, minHeight: 44, width: '86%' },
    contentContainerStyle: { paddingHorizontal: 14 },
    text1Style: { fontSize: 13, fontWeight: '600' },
};
export const toastConfig = {};

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
