import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonAgenda } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckinCard } from '@/components/checkin/CheckinCard';
import { EmotionalRegisterCard } from '@/components/checkin/EmotionalRegisterCard';
import { EmotionChips } from '@/components/search/EmotionChips';
import { DatePickerField } from '@/components/search/DatePickerField';
import {
  getAllCheckins,
  getAllEmotionalRegisters,
  getAllGratitude,
} from '@/lib/firestore';
import {
  CheckinEntry,
  EmotionalRegisterEntry,
  GratitudeEntry,
  EmotionId,
} from '@/types/checkin';
import { strings } from '@/constants/strings';
import {
  colors,
  typography,
  fonts,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';
import { formatDate } from '@/utils/date';

// ─── Types ──────────────────────────────────────────

type Segment = 'all' | 'checkin' | 'register' | 'gratitude';

type AgendaItem =
  | { type: 'checkin'; data: CheckinEntry }
  | { type: 'register'; data: EmotionalRegisterEntry }
  | { type: 'gratitude'; data: GratitudeEntry };

interface DateGroup {
  title: string;
  dateKey: string;
  data: AgendaItem[];
}

// ─── Helpers ────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  const [y, m, d] = dateStr.split('-');
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function formatTime(seconds: number): string {
  const dt = new Date(seconds * 1000);
  const hh = dt.getHours().toString().padStart(2, '0');
  const mm = dt.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

// ─── GratitudeJournalCard ───────────────────────────

function GratitudeJournalCard({
  entry,
  onPress,
}: {
  entry: GratitudeEntry;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={gStyles.card}
      >
        <View style={gStyles.accent} />
        <View style={gStyles.content}>
          <View style={gStyles.header}>
            <Text style={gStyles.emoji}>🙏</Text>
            <Text style={gStyles.title}>{strings.agenda.gratitudeLabel}</Text>
            <Text style={gStyles.time}>{formatTime(entry.createdAt.seconds)}</Text>
          </View>
          {entry.items.map((item, i) => (
            <Text key={i} style={gStyles.item}>
              {i + 1}. {item}
            </Text>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const gStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent[100],
    overflow: 'hidden',
  },
  accent: { width: 3, backgroundColor: colors.accent[400] },
  content: { flex: 1, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  emoji: { fontSize: 18 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.accent[500], flex: 1 },
  time: { ...typography.caption, color: colors.neutral[400] },
  item: { ...typography.body, color: colors.neutral[600], lineHeight: 22, marginBottom: 2 },
});

// ─── BookCover ──────────────────────────────────────

function BookCover() {
  return (
    <View style={coverStyles.bg}>
      {/* Spine */}
      <View style={coverStyles.spine} />
      {/* Decorative border */}
      <View style={coverStyles.borderOuter}>
        <View style={coverStyles.borderInner}>
          <Text style={coverStyles.emoji}>📓</Text>
          <Text style={coverStyles.title}>Mi Diario</Text>
          <View style={coverStyles.divider} />
          <Text style={coverStyles.subtitle}>Bloom</Text>
        </View>
      </View>
    </View>
  );
}

const coverStyles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: colors.primary[600],
    overflow: 'hidden',
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: colors.primary[700],
  },
  borderOuter: {
    flex: 1,
    margin: 28,
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  borderInner: {
    alignItems: 'center',
    gap: 12,
  },
  emoji: { fontSize: 48 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 40,
    color: colors.neutral[50],
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: colors.accent[400],
    borderRadius: 1,
  },
  subtitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.accent[200],
    letterSpacing: 2,
  },
});

// ─── Main Screen ────────────────────────────────────

export default function AgendaScreen() {
  const { width: sw, height: sh } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // ── Origin from mini book measurement ──
  const params = useLocalSearchParams<{ ox?: string; oy?: string; ow?: string; oh?: string }>();
  const originW = Number(params.ow) || 64;
  const originH = Number(params.oh) || 82;
  const originX = Number(params.ox) || (sw - 20 - originW);
  const originY = Number(params.oy) || (sh - 226);
  const originCX = originX + originW / 2;
  const originCY = originY + originH / 2;

  // ── Animation ──
  const progress = useSharedValue(0);
  const closingRef = useRef(false);

  // Data state
  const [allItems, setAllItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<Segment>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionId[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Open animation on mount
  useEffect(() => {
    const t = setTimeout(() => {
      progress.value = withSpring(1, { damping: 18, stiffness: 85, mass: 0.8 });
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // Close animation
  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value = withTiming(
      0,
      { duration: 600, easing: Easing.bezier(0.4, 0, 0.2, 1) },
      (finished) => {
        if (finished) runOnJS(router.back)();
      }
    );
  }, []);

  // Android back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [handleClose]);

  // ── Animated styles ──

  // Offsets: mini book center → screen center
  const dx = originCX - sw / 2;
  const dy = originCY - sh / 2;
  // Scale factors to shrink full-screen to exact mini book size
  const minSX = originW / sw;
  const minSY = originH / sh;
  const halfW = sw / 2;

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
  }));

  // Book: fades out at the very end so mini book underneath takes over seamlessly
  const bookStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value, [0, 0.45], [dx, 0], Extrapolation.CLAMP
        ),
      },
      {
        translateY: interpolate(
          progress.value, [0, 0.45], [dy, 0], Extrapolation.CLAMP
        ),
      },
      {
        scaleX: interpolate(
          progress.value, [0, 0.55, 1], [minSX, 0.92, 1], Extrapolation.CLAMP
        ),
      },
      {
        scaleY: interpolate(
          progress.value, [0, 0.55, 1], [minSY, 0.92, 1], Extrapolation.CLAMP
        ),
      },
    ],
    borderRadius: interpolate(
      progress.value, [0, 0.3, 1], [6, 14, 12], Extrapolation.CLAMP
    ),
    opacity: interpolate(
      progress.value, [0, 0.06], [0, 1], Extrapolation.CLAMP
    ),
  }));

  // Cover flips open from left edge (rotateY with transform-origin trick)
  const coverAnimStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      progress.value, [0.2, 0.75], [0, -115], Extrapolation.CLAMP
    );
    return {
      transform: [
        { perspective: 1200 },
        { translateX: -halfW },
        { rotateY: `${rotation}deg` },
        { translateX: halfW },
      ],
      opacity: interpolate(
        progress.value, [0.2, 0.5, 0.75], [1, 0.7, 0], Extrapolation.CLAMP
      ),
    };
  });

  // Content fades in after cover opens
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value, [0.7, 1], [0, 1], Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          progress.value, [0.7, 1], [12, 0], Extrapolation.CLAMP
        ),
      },
    ],
  }));

  // ── Data loading ──

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [checkins, registers, gratitudes] = await Promise.all([
        getAllCheckins(user.uid),
        getAllEmotionalRegisters(user.uid),
        getAllGratitude(user.uid),
      ]);
      const combined: AgendaItem[] = [
        ...checkins.map((c) => ({ type: 'checkin' as const, data: c })),
        ...registers.map((r) => ({ type: 'register' as const, data: r })),
        ...gratitudes.map((g) => ({ type: 'gratitude' as const, data: g })),
      ];
      combined.sort((a, b) => b.data.createdAt.seconds - a.data.createdAt.seconds);
      setAllItems(combined);
    } catch (error) {
      console.error('Error loading agenda:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  // ── Filtering ──

  const hasActiveFilters =
    searchText.trim() !== '' ||
    selectedEmotions.length > 0 ||
    dateFrom !== null ||
    dateTo !== null;

  const filteredItems = useMemo(() => {
    let items = allItems;

    if (segment === 'checkin') items = items.filter((i) => i.type === 'checkin');
    else if (segment === 'register') items = items.filter((i) => i.type === 'register');
    else if (segment === 'gratitude') items = items.filter((i) => i.type === 'gratitude');

    if (!hasActiveFilters) return items;

    return items.filter((item) => {
      if (selectedEmotions.length > 0) {
        if (item.type === 'gratitude') return false;
        const emotion = item.data.emotion;
        if (!emotion || !selectedEmotions.includes(emotion as EmotionId)) return false;
      }

      if (dateFrom && item.data.date < formatDate(dateFrom)) return false;
      if (dateTo && item.data.date > formatDate(dateTo)) return false;

      const q = searchText.trim().toLowerCase();
      if (q) {
        if (item.type === 'checkin') {
          const c = item.data;
          const s = [c.notes, ...c.events.map((e) => `${e.title} ${e.description}`)].join(' ').toLowerCase();
          if (!s.includes(q)) return false;
        } else if (item.type === 'register') {
          const r = item.data;
          const s = [r.trigger, r.vulnerability, r.interpretations, r.internalSensations, r.externalLanguage, r.impulses, r.behavior, r.consequences, r.emotionFunction, r.emotionCustom].join(' ').toLowerCase();
          if (!s.includes(q)) return false;
        } else {
          const g = item.data as GratitudeEntry;
          if (!g.items.join(' ').toLowerCase().includes(q)) return false;
        }
      }
      return true;
    });
  }, [allItems, searchText, selectedEmotions, dateFrom, dateTo, segment, hasActiveFilters]);

  // Group by date
  const sections: DateGroup[] = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const item of filteredItems) {
      const key = item.data.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    const result: DateGroup[] = [];
    for (const [dateKey, data] of map) {
      result.push({ title: formatDateLabel(dateKey), dateKey, data });
    }
    return result;
  }, [filteredItems]);

  const totalCount = filteredItems.length;

  // ── Handlers ──

  const handleClearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchText('');
    setSelectedEmotions([]);
    setDateFrom(null);
    setDateTo(null);
  };

  const handleToggleEmotion = (id: EmotionId) => {
    setSelectedEmotions((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleSegmentChange = (s: Segment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSegment(s);
  };

  // Card index for staggered animation
  let globalIdx = 0;

  // ── Render ──

  return (
    <View style={styles.overlay}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Book */}
      <Animated.View style={[styles.book, bookStyle, { width: sw, height: sh }]}>

        {/* Page (cream background — content area) */}
        <View style={[styles.page, { paddingTop: insets.top }]}>
          {/* Page edges (right side) */}
          <View style={styles.pageEdges}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.pageEdgeLine,
                  { right: i * 1.5, opacity: 0.04 + i * 0.015 },
                ]}
              />
            ))}
          </View>

          {/* Spine */}
          <View style={styles.pageSpine} />

          {/* Content */}
          <Animated.View style={[styles.contentWrap, contentStyle]}>
            {loading && allItems.length === 0 ? (
              <SkeletonAgenda />
            ) : (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={handleClose}
                    hitSlop={12}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={24} color={colors.neutral[500]} />
                  </TouchableOpacity>
                  <Text style={styles.title}>{strings.agenda.title}</Text>
                  <Text style={styles.subtitle}>{strings.agenda.subtitle}</Text>
                </View>

                {/* Search bar */}
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color={colors.neutral[400]} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={strings.agenda.searchPlaceholder}
                    placeholderTextColor={colors.neutral[400]}
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color={colors.neutral[400]} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowFilters(!showFilters);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showFilters ? 'options' : 'options-outline'}
                      size={20}
                      color={
                        showFilters || hasActiveFilters
                          ? colors.primary[400]
                          : colors.neutral[400]
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Segments */}
                <View style={styles.segments}>
                  {([
                    { key: 'all' as Segment, label: strings.search.segmentAll },
                    { key: 'checkin' as Segment, label: strings.search.segmentCheckin },
                    { key: 'register' as Segment, label: strings.search.segmentRegister },
                    { key: 'gratitude' as Segment, label: strings.agenda.segmentGratitude },
                  ]).map((s) => (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.segment, segment === s.key && styles.segmentActive]}
                      onPress={() => handleSegmentChange(s.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          segment === s.key && styles.segmentTextActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Collapsible filters */}
                {showFilters && (
                  <View>
                    <Text style={styles.filterLabel}>{strings.search.emotionsLabel}</Text>
                    <EmotionChips
                      selectedEmotions={selectedEmotions}
                      onToggle={handleToggleEmotion}
                    />
                    <View style={styles.dateRow}>
                      <DatePickerField
                        label={strings.search.dateFrom}
                        value={dateFrom}
                        onChange={setDateFrom}
                        maximumDate={dateTo || new Date()}
                      />
                      <DatePickerField
                        label={strings.search.dateTo}
                        value={dateTo}
                        onChange={setDateTo}
                        maximumDate={new Date()}
                      />
                    </View>
                    {hasActiveFilters && (
                      <TouchableOpacity onPress={handleClearFilters} style={styles.clearBtn}>
                        <Text style={styles.clearText}>{strings.search.clearFilters}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Counter */}
                {!loading && (
                  <View style={styles.counterRow}>
                    <Text style={styles.counterText}>
                      {totalCount}{' '}
                      {totalCount === 1
                        ? strings.agenda.oneEntry
                        : strings.agenda.totalEntries}
                    </Text>
                  </View>
                )}

                {/* Results */}
                {!loading && filteredItems.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <EmptyState
                      emoji="📖"
                      message={
                        hasActiveFilters
                          ? `${strings.search.noResults}\n${strings.search.noResultsHint}`
                          : strings.agenda.emptyState
                      }
                    />
                  </View>
                ) : (
                  <SectionList
                    sections={sections}
                    keyExtractor={(item) => `${item.type}-${item.data.id}`}
                    renderSectionHeader={({ section }) => (
                      <View style={styles.dateBadgeRow}>
                        <View style={styles.dateLine} />
                        <View style={styles.dateBadge}>
                          <Text style={styles.dateBadgeText}>{section.title}</Text>
                        </View>
                        <View style={styles.dateLine} />
                      </View>
                    )}
                    renderItem={({ item }) => {
                      const idx = globalIdx++;
                      return (
                        <View style={styles.cardWrap}>
                          {item.type === 'checkin' ? (
                            <CheckinCard
                              checkin={item.data}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/checkin/${item.data.id}`);
                              }}
                            />
                          ) : item.type === 'register' ? (
                            <EmotionalRegisterCard
                              register={item.data}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/registro-emocional/${item.data.id}`);
                              }}
                            />
                          ) : (
                            <GratitudeJournalCard
                              entry={item.data as GratitudeEntry}
                              onPress={() =>
                                router.push({
                                  pathname: '/gratitud/nuevo',
                                  params: { date: item.data.date },
                                })
                              }
                            />
                          )}
                        </View>
                      );
                    }}
                    contentContainerStyle={[
                      styles.list,
                      { paddingBottom: insets.bottom + 24 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                  />
                )}
              </>
            )}
          </Animated.View>
        </View>

        {/* Cover (flips open from left edge) */}
        <Animated.View
          style={[StyleSheet.absoluteFill, coverAnimStyle]}
          pointerEvents="none"
        >
          <BookCover />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 25, 23, 0.45)',
  },
  book: {
    overflow: 'hidden',
    ...shadows.lg,
  },
  // Page (cream bg)
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageEdges: {
    position: 'absolute',
    right: 0,
    top: 24,
    bottom: 24,
    width: 10,
    zIndex: 1,
  },
  pageEdgeLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.neutral[700],
  },
  pageSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary[100],
    zIndex: 1,
  },
  contentWrap: {
    flex: 1,
  },
  // Header
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  closeBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.displayLarge,
    color: colors.neutral[800],
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    marginTop: 2,
  },
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.neutral[800],
    padding: 0,
  },
  // Segments
  segments: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: 3,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  segmentText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  segmentTextActive: {
    color: colors.neutral[700],
    fontFamily: fonts.sansBold,
  },
  // Filters
  filterLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.neutral[700],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  clearBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  clearText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.primary[400],
  },
  // Counter
  counterRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  counterText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.neutral[500],
  },
  // Date separator
  dateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dateBadge: {
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dateBadgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.neutral[500],
  },
  // List
  cardWrap: {},
  list: {
    paddingHorizontal: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
