// app/(tabs)/about.js — Clean Modern Design
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#E53935" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <LinearGradient
                    colors={['#E53935', '#C62828']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroSection}
                >
                    <View style={styles.appIconContainer}>
                        <Ionicons name="restaurant" size={40} color="#E53935" />
                    </View>
                    <Text style={styles.appNameText}>Hotel Mess Manager</Text>
                    <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>VERSION 2.0 • 2026</Text>
                    </View>
                </LinearGradient>

                <View style={styles.contentBody}>
                    {/* Developer Card */}
                    <View style={styles.devProfileCard}>
                        <View style={styles.profileHeader}>
                            <LinearGradient
                                colors={['#E53935', '#C62828']}
                                style={styles.avatarGradient}
                            >
                                <Text style={styles.avatarText}>SZ</Text>
                            </LinearGradient>
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
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#1E293B', '#0F172A']}
                                style={styles.primaryContactGradient}
                            >
                                <Ionicons name="call-outline" size={18} color="#FFF" />
                                <Text style={styles.primaryContactBtnText}>Get in Touch</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Connect Section */}
                    <Text style={styles.sectionHeading}>CONNECT & SUPPORT</Text>

                    <TouchableOpacity
                        style={styles.actionTile}
                        onPress={() => openLink('https://github.com/saranzafar')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.tileIcon, { backgroundColor: '#F1F5F9' }]}>
                            <Ionicons name="logo-github" size={22} color="#1E293B" />
                        </View>
                        <View style={styles.tileContent}>
                            <Text style={styles.tileTitle}>GitHub Repository</Text>
                            <Text style={styles.tileSubTitle}>Explore the source code</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionTile}
                        onPress={() => openLink('http://saranzafar.com/')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.tileIcon, { backgroundColor: '#E8F0FE' }]}>
                            <Ionicons name="globe-outline" size={22} color="#2563EB" />
                        </View>
                        <View style={styles.tileContent}>
                            <Text style={styles.tileTitle}>Official Portfolio</Text>
                            <Text style={styles.tileSubTitle}>See more of my work</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionTile}
                        onPress={() => handleCall('03119777995')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.tileIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="cafe-outline" size={22} color="#D97706" />
                        </View>
                        <View style={styles.tileContent}>
                            <Text style={styles.tileTitle}>Support via EasyPaisa</Text>
                            <Text style={styles.tileSubTitle}>Buy me a coffee!</Text>
                        </View>
                        <View style={styles.tileBadge}>
                            <Text style={styles.tileBadgeText}>0311 9777995</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Privacy Card */}
                    <View style={styles.privacyCard}>
                        <View style={styles.privacyHeader}>
                            <View style={styles.privacyIcon}>
                                <Ionicons name="shield-checkmark" size={24} color="#34C759" />
                            </View>
                            <View style={styles.privacyContent}>
                                <Text style={styles.privacyTitle}>Local-First Architecture</Text>
                                <Text style={styles.privacyDesc}>
                                    Your data never leaves your device. No cloud, no tracking, 100% private.
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.copyrightText}>
                            © {new Date().getFullYear()} Saran Zafar Designs
                        </Text>
                        <View style={styles.footerHeart}>
                            <Ionicons name="heart" size={12} color="#E53935" />
                            <Text style={styles.footerTagline}>Made for hotels</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB'
    },

    // Hero Section
    heroSection: {
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 60,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    appIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    appNameText: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    versionBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    versionText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5
    },

    // Content Body
    contentBody: {
        paddingHorizontal: 20,
        marginTop: -30
    },

    // Developer Card
    devProfileCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F0F0F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16
    },
    avatarGradient: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E53935',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF'
    },
    devName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    devTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E53935'
    },
    devBio: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        marginBottom: 20,
        fontWeight: '500'
    },
    primaryContactBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    primaryContactGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    primaryContactBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700'
    },

    // Section Heading
    sectionHeading: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.8,
        marginBottom: 12,
        marginLeft: 4,
    },

    // Action Tiles
    actionTile: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    tileIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tileContent: {
        flex: 1,
        marginLeft: 14
    },
    tileTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    tileSubTitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500'
    },
    tileBadge: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tileBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#E53935'
    },

    // Privacy Card
    privacyCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 16,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    privacyHeader: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    privacyIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    privacyContent: {
        flex: 1,
    },
    privacyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 2,
    },
    privacyDesc: {
        fontSize: 12,
        color: '#2E7D32',
        fontWeight: '500',
        lineHeight: 18,
    },

    // Footer
    footer: {
        paddingVertical: 32,
        alignItems: 'center'
    },
    copyrightText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    footerHeart: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerTagline: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
    },
});