// app/(tabs)/index.js (Dashboard) — Premium Modern Design
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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
  getDashboardRevenueTrend,
  getDashboardSnapshot,
} from '../../src/database/queries';
import { showError } from '../../src/ui/toast.js';

const { width } = Dimensions.get('window');

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

// ─── Glass Morphism Card ─────────────────────────────────────────────────────
const GlassCard = ({ children, style, intensity = 20, noBorder = false }) => (
  <BlurView
    intensity={intensity}
    tint="light"
    style={[
      styles.glassCard,
      !noBorder && styles.glassCardBorder,
      style,
    ]}
  >
    {children}
  </BlurView>
);

// ─── Gradient Background ─────────────────────────────────────────────────────
const GradientBackground = () => (
  <>
    <LinearGradient
      colors={['rgba(229,57,53,0.08)', 'rgba(255,149,0,0.02)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.gradientBlob1} />
    <View style={styles.gradientBlob2} />
    <View style={styles.gradientBlob3} />
  </>
);

// ─── Animated Stat Tile ────────────────────────────────────────────────────────
const StatTile = ({ title, value, tone = 'neutral', caption, icon, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: 600, 
        delay, 
        useNativeDriver: true 
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toneConfig = {
    neutral: { gradient: ['#8E8E93', '#6C6C70'], bg: '#F2F2F7' },
    success: { gradient: ['#34C759', '#30B64A'], bg: '#E8F5E9' },
    warning: { gradient: ['#FF9500', '#F97316'], bg: '#FFF3E0' },
    danger: { gradient: ['#E53935', '#C62828'], bg: '#FFEBEE' },
  }[tone];

  return (
    <Animated.View
      style={[
        styles.statTile,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[toneConfig.gradient[0] + '08', toneConfig.gradient[1] + '02']}
        style={styles.statTileGradient}
      />
      <View style={[styles.statIconContainer, { backgroundColor: toneConfig.bg }]}>
        <Ionicons name={icon} size={18} color={toneConfig.gradient[0]} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {caption && (
          <View style={styles.statCaptionContainer}>
            <Ionicons name="information-circle-outline" size={12} color="#8E8E93" />
            <Text style={styles.statCaption}>{caption}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Revenue Chart ──────────────────────────────────────────────────────────
const RevenueChart = ({ data, peak, currentValue }) => {
  const safePeak = peak > 0 ? peak : 1;
  const animValues = useRef(data.map(() => new Animated.Value(0))).current;
  const chartWidth = width - 80;

  useEffect(() => {
    Animated.stagger(
      50,
      data.map((_, i) =>
        Animated.spring(animValues[i], {
          toValue: 1,
          friction: 6,
          tension: 40,
          delay: i * 50,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [data]);

  return (
    <GlassCard style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Revenue Overview</Text>
          <Text style={styles.chartSubtitle}>Last 6 months</Text>
        </View>
        <TouchableOpacity style={styles.chartMoreButton}>
          <Ionicons name="options-outline" size={20} color="#8E8E93" />
        </TouchableOpacity>
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
            const animatedHeight = animValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, targetHeight],
            });

            return (
              <View key={item.monthKey} style={styles.chartBarColumn}>
                <Animated.View
                  style={[
                    styles.chartBar,
                    {
                      height: animatedHeight,
                      backgroundColor: isCurrent ? '#E53935' : '#E5E5EA',
                    },
                  ]}
                >
                  {isCurrent && (
                    <LinearGradient
                      colors={['#E53935', '#C62828']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                  )}
                </Animated.View>
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
    </GlassCard>
  );
};

// ─── Insight Item ───────────────────────────────────────────────────────────────
const InsightItem = ({ icon, title, value, trend, trendValue, color = '#34C759' }) => (
  <View style={styles.insightItem}>
    <View style={[styles.insightIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.insightContent}>
      <Text style={styles.insightItemTitle}>{title}</Text>
      <Text style={styles.insightItemValue}>{value}</Text>
    </View>
    {trend && (
      <View style={[styles.trendBadge, { backgroundColor: trend === 'up' ? '#34C75915' : '#E5393515' }]}>
        <Ionicons 
          name={trend === 'up' ? 'arrow-up' : 'arrow-down'} 
          size={12} 
          color={trend === 'up' ? '#34C759' : '#E53935'} 
        />
        <Text style={[styles.trendValue, { color: trend === 'up' ? '#34C759' : '#E53935' }]}>
          {trendValue}%
        </Text>
      </View>
    )}
  </View>
);

// ─── Progress Ring ───────────────────────────────────────────────────────────
const ProgressRing = ({ progress, size = 80, strokeWidth = 6, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={styles.progressRingContainer}>
        {/* Background Circle */}
        <View
          style={[
            styles.progressRingBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
            },
          ]}
        />
        {/* Progress Circle */}
        <View style={styles.progressRingFill}>
          <View
            style={[
              styles.progressRingFillInner,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: color,
                transform: [{ rotateZ: '-90deg' }],
              },
            ]}
          />
        </View>
        {/* Center Content */}
        <View style={styles.progressRingCenter}>
          <Text style={styles.progressRingValue}>{progress}%</Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [trend, setTrend] = useState({
    series: [], peak: 0, currentMonth: 0, previousMonth: 0, changePercent: 0,
  });

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const loadDashboardData = useCallback(async () => {
    try {
      const [snapshotResult, trendResult] = await Promise.all([
        getDashboardSnapshot(),
        getDashboardRevenueTrend(6),
      ]);
      setSnapshot(snapshotResult);
      setTrend(trendResult);
    } catch {
      showError('Unable to load dashboard insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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

  if (loading && !snapshot) {
    return (
      <View style={styles.loadingContainer}>
        <GradientBackground />
        <ActivityIndicator size="large" color="#E53935" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (!snapshot) return null;

  const trendUp = trend.changePercent >= 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <GradientBackground />

      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View>
          <Text style={styles.headerGreeting}>Welcome back</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.headerAvatar}>
          <LinearGradient
            colors={['#E53935', '#C62828']}
            style={styles.headerAvatarGradient}
          >
            <Text style={styles.headerAvatarText}>JD</Text>
          </LinearGradient>
        </TouchableOpacity>
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
        <GlassCard style={styles.heroCard}>
          <LinearGradient
            colors={['#E53935', '#C62828']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroBadge}
          >
            <Text style={styles.heroBadgeText}>LIFETIME REVENUE</Text>
          </LinearGradient>

          <Text style={styles.heroAmount}>{pkr(snapshot.lifetimeRevenue)}</Text>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Ionicons name="people-outline" size={16} color="#8E8E93" />
              <Text style={styles.heroMetricValue}>{snapshot.totalClients}</Text>
              <Text style={styles.heroMetricLabel}>clients</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Ionicons name="layers-outline" size={16} color="#8E8E93" />
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
        </GlassCard>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <StatTile 
            delay={100} 
            icon="checkmark-circle-outline" 
            title="Active Plans" 
            value={snapshot.activeSubscriptions} 
            tone="success" 
            caption={`${snapshot.totalClients} total clients`} 
          />
          <StatTile 
            delay={150} 
            icon="time-outline" 
            title="Pending" 
            value={snapshot.pendingCount} 
            tone="warning" 
            caption={`${pkr(snapshot.pendingAmount)} unpaid`} 
          />
          <StatTile 
            delay={200} 
            icon="alert-circle-outline" 
            title="Expiring Soon" 
            value={snapshot.expiringSoonCount} 
            tone="danger" 
            caption="Next 7 days" 
          />
          <StatTile 
            delay={250} 
            icon="wallet-outline" 
            title="This Month" 
            value={pkr(snapshot.revenueThisMonth)} 
            tone="success" 
            caption="Collected revenue" 
          />
        </View>

        {/* Revenue Chart */}
        <RevenueChart data={trend.series} peak={trend.peak} />

        {/* Insights Section */}
        <View style={styles.insightsSection}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#E53935', '#C62828']}
              style={styles.sectionDot}
            />
            <Text style={styles.sectionTitle}>Key Insights</Text>
            <Text style={styles.sectionSubtitle}>Real-time analytics</Text>
          </View>

          <GlassCard style={styles.insightsCard}>
            <InsightItem
              icon="trending-up"
              title="Collection Rate"
              value={`${collectionRate}%`}
              trend={trendUp ? 'up' : 'down'}
              trendValue={Math.abs(trend.changePercent)}
              color={collectionRate >= 75 ? '#34C759' : collectionRate >= 50 ? '#FF9500' : '#E53935'}
            />

            <View style={styles.insightDivider} />

            {snapshot.expiringSoonCount > 0 && (
              <>
                <InsightItem
                  icon="warning"
                  title="Expiring Plans"
                  value={snapshot.expiringSoonCount.toString()}
                  color="#E53935"
                />
                <View style={styles.insightDivider} />
              </>
            )}

            {snapshot.pendingCount > 0 && (
              <InsightItem
                icon="cash"
                title="Outstanding Balance"
                value={pkr(snapshot.pendingAmount)}
                color="#FF9500"
              />
            )}

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Monthly Collection Goal</Text>
                <Text style={styles.progressPercentage}>{collectionRate}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View
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
          </GlassCard>
        </View>

        {/* Recent Activity Placeholder - can be expanded */}
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>View Detailed Analytics</Text>
          <Ionicons name="arrow-forward" size={18} color="#E53935" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Premium Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  
  // Gradient Background Elements
  gradientBlob1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(229,57,53,0.03)',
  },
  gradientBlob2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,149,0,0.03)',
  },
  gradientBlob3: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(52,199,89,0.02)',
  },

  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassCardBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  headerGreeting: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerAvatarGradient: {
    width: '100%',
    height: '100%',
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },

  // Hero Card
  heroCard: {
    padding: 20,
    marginBottom: 20,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
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
    color: '#1C1C1E',
    letterSpacing: -1,
    marginBottom: 20,
  },
  heroMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(142,142,147,0.08)',
    borderRadius: 20,
    padding: 12,
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
    backgroundColor: 'rgba(142,142,147,0.2)',
  },
  heroMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  heroMetricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statTile: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  statTileGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statCaptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statCaption: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Chart Card
  chartCard: {
    padding: 20,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  chartMoreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(142,142,147,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(142,142,147,0.1)',
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
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  chartBarLabelContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chartBarValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 2,
  },
  chartBarValueActive: {
    color: '#E53935',
  },
  chartBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  chartBarLabelActive: {
    color: '#1C1C1E',
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
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Insights Card
  insightsCard: {
    padding: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  insightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightItemTitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
  },
  insightItemValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  insightDivider: {
    height: 1,
    backgroundColor: 'rgba(142,142,147,0.1)',
    marginVertical: 4,
  },

  // Trend Badge
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
    color: '#8E8E93',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(142,142,147,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // View All Button
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,57,53,0.1)',
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E53935',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
});