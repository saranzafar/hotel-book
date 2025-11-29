import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import InfoCard from '@/app/components/dashboard/InfoCard';
import SectionHeader from '@/app/components/dashboard/SectionHeader';
import StatCard from '@/app/components/dashboard/StatCard';

import {
  getExpiringSoon,
  getOverduePayments,
  getTotalActiveSubscriptions,
  getTotalClientsCount,
  getTotalRevenue,
} from '@/src/database/queries';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    totalRevenue: 0,
    overdueCount: 0,
    expiringCount: 0,
    totalClients: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [active, revenue, overdue, expiring, clients] = await Promise.all([
        getTotalActiveSubscriptions(),
        getTotalRevenue(),
        getOverduePayments(),
        getExpiringSoon(),
        getTotalClientsCount(),
      ]);

      setStats({
        activeSubscriptions: active,
        totalRevenue: revenue,
        overdueCount: overdue.length,
        expiringCount: expiring.length,
        totalClients: clients,
      });
    } catch (error) {
      console.error('Dashboard Load Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={{ marginTop: 10 }}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E53935" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Your business overview</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGridRow}>
        <StatCard
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          color="#E53935"
        />
        <StatCard
          label="Total Clients"
          value={stats.totalClients}
          color="#6C5CE7"
        />
      </View>

      <View style={styles.statsGridRow}>
        <StatCard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toFixed(0)}`}
          color="#E53935"
        />
        <StatCard
          label="Overdue Payments"
          value={stats.overdueCount}
          color="#E74C3C"
        />
      </View>

      <View style={styles.statsGridRow}>
        <StatCard
          label="Expiring Soon"
          value={stats.expiringCount}
          color="#F39C12"
        />

        {/* Add a placeholder or future card */}
        <StatCard
          label="Coming Soon"
          value="—"
          color="#95A5A6"
        />
      </View>

      {/* Quick Info */}
      <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
        <SectionHeader title="Quick Info" />

        <InfoCard
          icon="📊"
          text={`You have ${stats.activeSubscriptions} active subscriptions.`}
        />
        <InfoCard
          icon="⚠️"
          text={`${stats.overdueCount} subscriptions have pending payments.`}
        />
        <InfoCard
          icon="⏰"
          text={`${stats.expiringCount} subscriptions expire within 7 days.`}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  header: {
    backgroundColor: '#E53935',
    paddingHorizontal: 20,
    paddingVertical: 26,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e5efff',
    marginTop: 4,
  },

  statsGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
});
