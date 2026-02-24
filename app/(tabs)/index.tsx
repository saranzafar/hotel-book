// app/(tabs)/index.js (Dashboard) — Fixed Version
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  getDashboardSnapshot,
  getRevenueThisMonth,
  getRevenueThisWeek,
  getRevenueToday,
  getRevenueTrendCustom,
} from '../../src/database/queries';
import { showError } from '../../src/ui/toast.js';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 47 : StatusBar.currentHeight || 0;

// Filter types - using regular JavaScript
const FILTER_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: '6months', label: '6 Months' },
];

// Get months count from filter type
const getMonthsFromFilter = (filter) => {
  switch (filter) {
    case 'today':
    case 'week':
      return 1;
    case 'month':
      return 1;
    case '6months':
      return 6;
    default:
      return 1;
  }
};

// ─── Formatters ────────────────────────────────────────────────────────────────
const pkr = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const shortPKR = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return `${amount.toFixed(0)}`;
};

// ─── Compact Stat Card ────────────────────────────────────────────────────────
const CompactStatCard = ({ title, value, icon, color = '#E53935', delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.compactStatCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.compactIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.compactContent}>
        <Text style={styles.compactTitle}>{title}</Text>
        <Text style={[styles.compactValue, { color }]}>{value}</Text>
      </View>
    </Animated.View>
  );
};

// ─── Revenue Chart ──────────────────────────────────────────────────────────
const RevenueChart = ({ data, peak, subtitle }) => {
  const safePeak = peak > 0 ? peak : 1;
  const animValues = useRef([]);
  
  // Update animValues when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      animValues.current = data.map(() => new Animated.Value(0));
    } else {
      animValues.current = [];
    }
  }, [data]);

  useEffect(() => {
    if (data && data.length > 0 && animValues.current.length > 0) {
      Animated.stagger(
        80,
        data.map((_, i) =>
          Animated.timing(animValues.current[i], {
            toValue: 1,
            duration: 600,
            delay: i * 80,
            useNativeDriver: false,
          })
        )
      ).start();
    }
  }, [data]);

  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Revenue Trend</Text>
            <Text style={styles.chartSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={[styles.chartContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#64748B', fontSize: 14 }}>No revenue data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Revenue Trend</Text>
          <Text style={styles.chartSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* Grid lines */}
        <View style={styles.chartGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.chartGridLine} />
          ))}
        </View>

        {/* Bars */}
        <View style={styles.chartBars}>
          {data.map((item, index) => {
            const isCurrent = index === data.length - 1;
            const targetHeight = Math.max(4, (item.total / safePeak) * 140);
            const animatedHeight = animValues.current[index]?.interpolate({
              inputRange: [0, 1],
              outputRange: [0, targetHeight],
            }) || 0;

            return (
              <View key={item.monthKey} style={styles.chartBarColumn}>
                <Animated.View
                  style={[
                    styles.chartBar,
                    {
                      height: animatedHeight || 4,
                      backgroundColor: isCurrent ? '#E53935' : '#E2E8F0',
                    },
                  ]}
                />
                <View style={styles.chartBarLabelContainer}>
                  <Text style={[styles.chartBarValue, isCurrent && styles.chartBarValueActive]}>
                    {item.total > 0 ? shortPKR(item.total) : '—'}
                  </Text>
                  <Text style={[styles.chartBarLabel, isCurrent && styles.chartBarLabelActive]}>
                    {item.monthLabel}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('month');
  const [filteredRevenue, setFilteredRevenue] = useState(0);
  const [snapshot, setSnapshot] = useState(null);
  const [trend, setTrend] = useState({
    series: [],
    peak: 0,
    currentPeriod: 0,
    previousPeriod: 0,
    changePercent: 0,
    totalRevenue: 0
  });

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -70],
    extrapolate: 'clamp',
  });

  // Get label for current filter
  const getFilterLabel = (filter) => {
    const option = FILTER_OPTIONS.find(f => f.key === filter);
    return option ? option.label : 'Month';
  };

  // Fetch filtered revenue based on selected filter
  const fetchFilteredRevenue = async (filter) => {
    try {
      let revenue = 0;
      let trendData = {
        series: [],
        peak: 0,
        currentPeriod: 0,
        previousPeriod: 0,
        changePercent: 0,
        totalRevenue: 0
      };

      switch (filter) {
        case 'today':
          revenue = await getRevenueToday();
          trendData = {
            series: [{ monthKey: 'today', monthLabel: 'Today', total: revenue }],
            peak: revenue,
            currentPeriod: revenue,
            previousPeriod: 0,
            changePercent: 0,
            totalRevenue: revenue
          };
          break;
        case 'week':
          revenue = await getRevenueThisWeek();
          trendData = {
            series: [{ monthKey: 'week', monthLabel: 'This Week', total: revenue }],
            peak: revenue,
            currentPeriod: revenue,
            previousPeriod: 0,
            changePercent: 0,
            totalRevenue: revenue
          };
          break;
        case 'month':
          revenue = await getRevenueThisMonth();
          trendData = {
            series: [{ monthKey: 'month', monthLabel: 'This Month', total: revenue }],
            peak: revenue,
            currentPeriod: revenue,
            previousPeriod: 0,
            changePercent: 0,
            totalRevenue: revenue
          };
          break;
        case '3months':
        case '6months':
          const trendResult = await getRevenueTrendCustom(getMonthsFromFilter(filter));
          revenue = trendResult.totalRevenue;
          trendData = {
            series: trendResult.series,
            peak: trendResult.peak,
            currentPeriod: trendResult.currentPeriod,
            previousPeriod: trendResult.previousPeriod,
            changePercent: trendResult.changePercent,
            totalRevenue: trendResult.totalRevenue,
          };
          break;
        default:
          revenue = await getRevenueThisMonth();
          trendData = {
            series: [{ monthKey: 'month', monthLabel: 'This Month', total: revenue }],
            peak: revenue,
            currentPeriod: revenue,
            previousPeriod: 0,
            changePercent: 0,
            totalRevenue: revenue
          };
      }
      setFilteredRevenue(revenue);
      setTrend(trendData);
    } catch (error) {
      console.error('Error fetching filtered revenue:', error);
      setFilteredRevenue(0);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const [snapshotResult] = await Promise.all([
        getDashboardSnapshot(),
      ]);
      setSnapshot(snapshotResult);
      await fetchFilteredRevenue(selectedFilter);
    } catch (error) {
      showError('Unable to load dashboard insights');
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleFilterChange = async (filter) => {
    setSelectedFilter(filter);
  };

  // Get chart subtitle based on filter
  const getChartSubtitle = () => {
    switch (selectedFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case '3months':
        return 'Last 3 Months';
      case '6months':
        return 'Last 6 Months';
      default:
        return 'This Month';
    }
  };

  // ─── Filter Button Component ─────────────────────────────────────────────
  const FilterButton = ({ filterKey, label }) => {
    const isSelected = selectedFilter === filterKey;
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          isSelected && styles.filterButtonSelected,
        ]}
        onPress={() => handleFilterChange(filterKey)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterButtonText,
            isSelected && styles.filterButtonTextSelected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const healthScore = useMemo(() => {
    if (!snapshot) return 0;
    const total = snapshot.activeSubscriptions || 1;
    const pendingRatio = snapshot.pendingCount / total;
    const expiringRatio = snapshot.expiringSoonCount / total;
    return Math.max(0, 100 - Math.round((pendingRatio * 45 + expiringRatio * 25) * 100));
  }, [snapshot]);

  const collectionRate = useMemo(() => {
    if (!snapshot) return 0;
    const denom = snapshot.activeTotalAmount || 0;
    if (denom <= 0) return 0;
    return Math.min(100, Number(((snapshot.activePaidAmount / denom) * 100).toFixed(1)));
  }, [snapshot]);

  const healthColor =
    healthScore >= 75 ? '#34C759' : healthScore >= 50 ? '#FF9500' : '#E53935';
  const trendUp = trend.changePercent >= 0;

  if (loading && !snapshot) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!snapshot) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Fixed top safety stripe */}
      <View style={[styles.topSafetyStripe, { height: STATUS_BAR_HEIGHT }]} />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          { transform: [{ translateY: headerTranslateY }] }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.headerGreeting}>Welcome back</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.headerAvatar}>
              <LinearGradient
                colors={['#E53935', '#C62828']}
                style={styles.headerAvatarGradient}
              >
                <Text style={styles.headerAvatarText}>HB</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E53935"
            colors={['#E53935']}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>REVENUE</Text>
          </View>

          <Text style={styles.heroAmount}>{pkr(filteredRevenue)}</Text>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            {FILTER_OPTIONS.map((option) => (
              <FilterButton key={option.key} filterKey={option.key} label={option.label} />
            ))}
          </View>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Ionicons name="people-outline" size={16} color="#64748B" />
              <Text style={styles.heroMetricValue}>{snapshot.totalClients}</Text>
              <Text style={styles.heroMetricLabel}>clients</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Ionicons name="layers-outline" size={16} color="#64748B" />
              <Text style={styles.heroMetricValue}>{snapshot.activeSubscriptions}</Text>
              <Text style={styles.heroMetricLabel}>active</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
              <Text style={[styles.heroMetricValue, { color: healthColor }]}>
                {healthScore}
              </Text>
              <Text style={styles.heroMetricLabel}>health</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Grid - Compact Cards */}
        <View style={styles.compactStatsGrid}>
          <CompactStatCard
            delay={100}
            icon="checkmark-circle-outline"
            title="Active Plans"
            value={snapshot.activeSubscriptions}
            color="#34C759"
          />
          <CompactStatCard
            delay={150}
            icon="time-outline"
            title="Pending"
            value={snapshot.pendingCount}
            color="#FF9500"
          />
          <CompactStatCard
            delay={200}
            icon="alert-circle-outline"
            title="Expiring"
            value={snapshot.expiringSoonCount}
            color="#E53935"
          />
          <CompactStatCard
            delay={250}
            icon="wallet-outline"
            title={getFilterLabel(selectedFilter)}
            value={shortPKR(filteredRevenue)}
            color="#34C759"
          />
        </View>

        {/* Revenue Chart */}
        <RevenueChart data={trend.series} peak={trend.peak} subtitle={getChartSubtitle()} />

        {/* Insights Section */}
        <View style={styles.insightsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Key Insights</Text>
          </View>

          <View style={styles.insightsCard}>
            {/* Collection Rate */}
            <View style={styles.insightItem}>
              <View style={[styles.insightIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="trending-up" size={20} color="#34C759" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightItemTitle}>Collection Rate</Text>
                <Text style={styles.insightItemValue}>{collectionRate}%</Text>
              </View>
              <View style={[styles.trendBadge, { backgroundColor: trendUp ? '#E8F5E9' : '#FFEBEE' }]}>
                <Ionicons
                  name={trendUp ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={trendUp ? '#34C759' : '#E53935'}
                />
                <Text style={[styles.trendValue, { color: trendUp ? '#34C759' : '#E53935' }]}>
                  {Math.abs(trend.changePercent)}%
                </Text>
              </View>
            </View>

            <View style={styles.insightDivider} />

            {/* Expiring Plans */}
            {snapshot.expiringSoonCount > 0 && (
              <>
                <View style={styles.insightItem}>
                  <View style={[styles.insightIconContainer, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="warning" size={20} color="#E53935" />
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightItemTitle}>Expiring Plans</Text>
                    <Text style={styles.insightItemValue}>{snapshot.expiringSoonCount}</Text>
                  </View>
                </View>
                <View style={styles.insightDivider} />
              </>
            )}

            {/* Outstanding Balance */}
            {snapshot.pendingCount > 0 && (
              <View style={styles.insightItem}>
                <View style={[styles.insightIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="cash" size={20} color="#FF9500" />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightItemTitle}>Outstanding Balance</Text>
                  <Text style={styles.insightItemValue}>{pkr(snapshot.pendingAmount)}</Text>
                </View>
              </View>
            )}

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Monthly Collection Goal</Text>
                <Text style={styles.progressPercentage}>{collectionRate}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${collectionRate}%`,
                      backgroundColor: collectionRate >= 75 ? '#34C759' : collectionRate >= 50 ? '#FF9500' : '#E53935',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },

  // Fixed top stripe
  topSafetyStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8F9FB',
    zIndex: 100,
  },

  // Header
  header: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: STATUS_BAR_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  headerGreeting: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  headerAvatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Scroll Content
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 140 : 120,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E53935',
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -1,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonSelected: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  heroMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FC',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F5',
  },
  heroMetric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  heroMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  heroMetricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Compact Stats Grid
  compactStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  compactStatCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  compactValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  chartContainer: {
    height: 200,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    justifyContent: 'space-between',
  },
  chartGridLine: {
    height: 1,
    backgroundColor: '#F0F0F5',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 200,
  },
  chartBarColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBarLabelContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chartBarValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  chartBarValueActive: {
    color: '#E53935',
  },
  chartBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chartBarLabelActive: {
    color: '#1E293B',
  },

  // Insights Section
  insightsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E53935',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },

  // Insights Card
  insightsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  insightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightItemTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  insightItemValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  insightDivider: {
    height: 1,
    backgroundColor: '#F0F0F5',
    marginVertical: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  trendValue: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Progress Bar
  progressContainer: {
    marginTop: 16,
    paddingTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F0F0F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});