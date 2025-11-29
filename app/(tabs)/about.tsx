// app/(tabs)/about.js
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AboutScreen() {
    const openLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
    };

    const handleCall = (phone) => {
        Linking.openURL(`tel:${phone}`).catch(err => console.error("Failed to open dialer:", err));
    };

    return (
        <ScrollView style={styles.container}>
            {/* App Header */}
            <View style={styles.header}>
                <View style={styles.appIcon}>
                    <Ionicons name="restaurant" size={50} color="#fff" />
                </View>
                <Text style={styles.appName}>Hotel Mess Manager</Text>
                <Text style={styles.version}>v1.0.0</Text>
            </View>

            {/* Developer Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Developer</Text>
                <View style={styles.devCard}>
                    <Text style={styles.devName}>Saran Zafar</Text>
                    <Text style={styles.devRole}>Software Engineer & Full Stack Developer.</Text>

                    <View style={styles.contactInfo}>
                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => handleCall('03119777995')}
                        >
                            <Ionicons name="call" size={16} color="#E53935" />
                            <Text style={styles.contactText}>03119777995</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Quick Links */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connect With Me</Text>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => openLink('https://github.com/saranzafar')}
                >
                    <View style={styles.linkIcon}>
                        <Ionicons name="logo-github" size={24} color="#333" />
                    </View>
                    <View style={styles.linkContent}>
                        <Text style={styles.linkTitle}>GitHub</Text>
                        <Text style={styles.linkSubtitle}>View my projects and contributions</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => openLink('http://saranzafar.com/')}
                >
                    <View style={styles.linkIcon}>
                        <Ionicons name="briefcase" size={24} color="#E53935" />
                    </View>
                    <View style={styles.linkContent}>
                        <Text style={styles.linkTitle}>Portfolio</Text>
                        <Text style={styles.linkSubtitle}>Explore my work and experience</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => handleCall('03119777995')}
                >
                    <View style={styles.linkIcon}>
                        <Ionicons name="cafe" size={24} color="#FFDD00" />
                    </View>
                    <View style={styles.linkContent}>
                        <Text style={styles.linkTitle}>Support via EasyPaisa</Text>
                        <Text style={styles.linkSubtitle}>03119777995</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
            </View>

            {/* About App */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About This App</Text>
                <Text style={styles.description}>
                    A professional meal subscription management system designed for hotels and hostels.
                    Track clients, manage subscriptions, and monitor payments efficiently.
                </Text>
            </View>

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
                <Ionicons name="shield-checkmark" size={20} color="#E53935" />
                <Text style={styles.privacyText}>
                    All data stored locally. Complete privacy guaranteed.
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    © {new Date().getFullYear()} Saran Zafar. All rights reserved.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#E53935',
        paddingVertical: 40,
        alignItems: 'center',
        paddingTop: 50,
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    version: {
        fontSize: 12,
        color: '#e0e0e0',
        marginTop: 5,
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    devCard: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
    },
    devName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    devRole: {
        fontSize: 14,
        color: '#E53935',
        marginTop: 4,
        marginBottom: 12,
    },
    contactInfo: {
        marginTop: 8,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    contactText: {
        fontSize: 14,
        color: '#666',
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    linkIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    linkContent: {
        flex: 1,
    },
    linkTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    linkSubtitle: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    techList: {
        gap: 10,
    },
    techItem: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#E53935',
    },
    techName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        marginHorizontal: 15,
        marginTop: 15,
        padding: 16,
        borderRadius: 10,
        gap: 10,
    },
    privacyText: {
        fontSize: 13,
        color: '#2E7D32',
        flex: 1,
    },
    footer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
});