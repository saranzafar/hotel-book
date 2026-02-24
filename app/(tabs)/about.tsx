// app/(tabs)/about.js
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { showError } from '../../src/ui/toast.js';

export default function AboutScreen() {
    const openLink = (url) => {
        Linking.openURL(url).catch(() => showError('Unable to open link'));
    };

    const handleCall = (phone) => {
        Linking.openURL(`tel:${phone}`).catch(() => showError('Unable to open dialer'));
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="light-content" />
            
            {/* Hero Section */}
            <View style={styles.heroSection}>
                <View style={styles.appIconContainer}>
                    <Ionicons name="restaurant" size={40} color="#E53935" />
                </View>
                <Text style={styles.appNameText}>Hotel Mess Manager</Text>
                <View style={styles.versionBadge}>
                    <Text style={styles.versionText}>VERSION 2.0 • 2026 EDITION</Text>
                </View>
            </View>

            <View style={styles.contentBody}>
                {/* Developer Card */}
                <View style={styles.devProfileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>SZ</Text>
                        </View>
                        <View>
                            <Text style={styles.devName}>Saran Zafar</Text>
                            <Text style={styles.devTitle}>Software Engineer</Text>
                        </View>
                    </View>
                    <Text style={styles.devBio}>
                        Building high-performance offline-first applications with premium UX and modern architecture.
                    </Text>
                    <TouchableOpacity 
                        style={styles.primaryContactBtn}
                        onPress={() => handleCall('03119777995')}
                    >
                        <Ionicons name="call" size={18} color="#FFF" />
                        <Text style={styles.primaryContactBtnText}>Get in Touch</Text>
                    </TouchableOpacity>
                </View>

                {/* Connect Section */}
                <Text style={styles.sectionHeading}>CONNECT & SUPPORT</Text>
                
                <TouchableOpacity style={styles.actionTile} onPress={() => openLink('https://github.com/saranzafar')}>
                    <View style={[styles.tileIcon, { backgroundColor: '#F2F2F7' }]}>
                        <Ionicons name="logo-github" size={22} color="#1C1C1E" />
                    </View>
                    <View style={styles.tileContent}>
                        <Text style={styles.tileTitle}>GitHub Repository</Text>
                        <Text style={styles.tileSubTitle}>Explore the source code</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionTile} onPress={() => openLink('http://saranzafar.com/')}>
                    <View style={[styles.tileIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="globe-outline" size={22} color="#2196F3" />
                    </View>
                    <View style={styles.tileContent}>
                        <Text style={styles.tileTitle}>Official Portfolio</Text>
                        <Text style={styles.tileSubTitle}>See more of my work</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionTile} onPress={() => handleCall('03119777995')}>
                    <View style={[styles.tileIcon, { backgroundColor: '#FFF9C4' }]}>
                        <Ionicons name="cafe" size={22} color="#FBC02D" />
                    </View>
                    <View style={styles.tileContent}>
                        <Text style={styles.tileTitle}>Support via EasyPaisa</Text>
                        <Text style={styles.tileSubTitle}>Buy me a coffee!</Text>
                    </View>
                    <Text style={styles.tileBadge}>03119777995</Text>
                </TouchableOpacity>

                {/* Privacy Badge */}
                <View style={styles.privacyBox}>
                    <View style={styles.privacyIcon}>
                        <Ionicons name="shield-checkmark" size={20} color="#34C759" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.privacyTitle}>Local-First Architecture</Text>
                        <Text style={styles.privacyDesc}>
                            Your data never leaves your device. No cloud, no tracking, 100% private.
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.copyrightText}>
                        © {new Date().getFullYear()} SARAN ZAFAR DESIGNS
                    </Text>
                    <Text style={styles.footerTagline}>MADE WITH ❤️ FOR HOTELS</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    heroSection: {
        backgroundColor: '#E53935',
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 60,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    appIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#E53935',
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    appNameText: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    versionBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 12,
    },
    versionText: { fontSize: 10, fontWeight: '800', color: '#AEAEB2', letterSpacing: 1 },
    
    contentBody: { paddingHorizontal: 20, marginTop: -40 },
    
    devProfileCard: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 32,
    },
    profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    avatarPlaceholder: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFEBEE',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 20, fontWeight: '900', color: '#E53935' },
    devName: { fontSize: 22, fontWeight: '900', color: '#1C1C1E' },
    devTitle: { fontSize: 14, fontWeight: '700', color: '#E53935' },
    devBio: { fontSize: 15, color: '#8E8E93', lineHeight: 22, marginBottom: 20, fontWeight: '500' },
    primaryContactBtn: {
        backgroundColor: '#1C1C1E', height: 54, borderRadius: 27,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    },
    primaryContactBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

    sectionHeading: { fontSize: 12, fontWeight: '900', color: '#8E8E93', letterSpacing: 1.5, marginBottom: 16, marginLeft: 8 },
    
    actionTile: {
        backgroundColor: '#FFF', borderRadius: 24, padding: 16, flexDirection: 'row',
        alignItems: 'center', marginBottom: 12,
    },
    tileIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    tileContent: { flex: 1, marginLeft: 16 },
    tileTitle: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
    tileSubTitle: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
    tileBadge: { fontSize: 11, fontWeight: '800', color: '#E53935', backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    privacyBox: {
        flexDirection: 'row', gap: 16, backgroundColor: '#E8F5E9', padding: 20,
        borderRadius: 24, marginTop: 20, alignItems: 'center',
    },
    privacyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    privacyTitle: { fontSize: 15, fontWeight: '800', color: '#1B5E20', marginBottom: 2 },
    privacyDesc: { fontSize: 12, color: '#2E7D32', fontWeight: '500', lineHeight: 18 },

    footer: { paddingVertical: 40, alignItems: 'center' },
    copyrightText: { fontSize: 11, fontWeight: '800', color: '#AEAEB2', letterSpacing: 1 },
    footerTagline: { fontSize: 10, fontWeight: '700', color: '#D1D1D6', marginTop: 8 },
});