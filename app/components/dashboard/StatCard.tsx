import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function StatCard({ label, value, color = "#E53935" }) {
    return (
        <View style={[styles.card, { backgroundColor: color }]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: 20,
        borderRadius: 14,
    },
    label: {
        fontSize: 14,
        color: "#fff",
        opacity: 0.8,
    },
    value: {
        fontSize: 32,
        fontWeight: "700",
        color: "#fff",
        marginTop: 5,
    },
});
