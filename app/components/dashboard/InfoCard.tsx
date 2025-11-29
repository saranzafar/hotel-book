import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function InfoCard({ icon, text }) {
    return (
        <View style={styles.box}>
            <Text style={styles.text}>{icon} {text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: "#E53935",
    },
    text: {
        fontSize: 15,
        color: "#333",
        lineHeight: 20,
    },
});
