import React from 'react';
import { StyleSheet, Text } from 'react-native';

export default function SectionHeader({ title }) {
    return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
        color: "#333",
    }
});
