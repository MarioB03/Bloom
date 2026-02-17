import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRegistros } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { CheckinCard } from '@/components/checkin/CheckinCard';
import { EmotionalRegisterCard } from '@/components/checkin/EmotionalRegisterCard';
import { EmotionChips } from '@/components/search/EmotionChips';
import { DatePickerField } from '@/components/search/DatePickerField';
import { getAllCheckins, getAllEmotionalRegisters } from '@/lib/firestore';
import { CheckinEntry, EmotionalRegisterEntry, EmotionId } from '@/types/checkin';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, borderRadius, spacing, shadows } from '@/constants/theme';
import { formatDate } from '@/utils/date';

type Segment = 'all' | 'checkin' | 'register';

type SearchResult =
  | { type: 'checkin'; data: CheckinEntry }
  | { type: 'register'; data: EmotionalRegisterEntry };

export default function RegistrosHubScreen() {
  const { user } = useAuth();
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Segment
  const [segment, setSegment] = useState<Segment>('all');

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionId[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [checkins, registers] = await Promise.all([
        getAllCheckins(user.uid),
        getAllEmotionalRegisters(user.uid),
      ]);
      const combined: SearchResult[] = [
        ...checkins.map((c) => ({ type: 'checkin' as const, data: c })),
        ...registers.map((r) => ({ type: 'register' as const, data: r })),
      ];
      combined.sort((a, b) => b.data.createdAt.seconds - a.data.createdAt.seconds);
      setAllResults(combined);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const hasActiveFilters = searchText.trim() !== '' || selectedEmotions.length > 0 || dateFrom !== null || dateTo !== null;

  const filteredResults = useMemo(() => {
    let results = allResults;

    // Segment filter
    if (segment === 'checkin') {
      results = results.filter((r) => r.type === 'checkin');
    } else if (segment === 'register') {
      results = results.filter((r) => r.type === 'register');
    }

    if (!hasActiveFilters) return results;

    return results.filter((item) => {
      // Emotion filter
      if (selectedEmotions.length > 0) {
        const itemEmotion = item.data.emotion;
        if (!itemEmotion || !selectedEmotions.includes(itemEmotion as EmotionId)) {
          return false;
        }
      }

      // Date filter
      if (dateFrom) {
        const fromStr = formatDate(dateFrom);
        if (item.data.date < fromStr) return false;
      }
      if (dateTo) {
        const toStr = formatDate(dateTo);
        if (item.data.date > toStr) return false;
      }

      // Text filter
      const query = searchText.trim().toLowerCase();
      if (query) {
        if (item.type === 'checkin') {
          const c = item.data;
          const searchable = [
            c.notes,
            ...c.events.map((e) => `${e.title} ${e.description}`),
          ]
            .join(' ')
            .toLowerCase();
          if (!searchable.includes(query)) return false;
        } else {
          const r = item.data;
          const searchable = [
            r.trigger,
            r.vulnerability,
            r.interpretations,
            r.internalSensations,
            r.externalLanguage,
            r.impulses,
            r.behavior,
            r.consequences,
            r.emotionFunction,
            r.emotionCustom,
          ]
            .join(' ')
            .toLowerCase();
          if (!searchable.includes(query)) return false;
        }
      }

      return true;
    });
  }, [allResults, searchText, selectedEmotions, dateFrom, dateTo, segment, hasActiveFilters]);

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

  if (loading && allResults.length === 0) {
    return (
      <ScreenWrapper scroll={false}>
        <SkeletonRegistros />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll={false}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={styles.title}>{strings.registers.title}</Text>
        <Text style={styles.subtitle}>Todos tus registros en un solo lugar</Text>
      </Animated.View>

      {/* Search bar */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder={strings.search.placeholder}
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
              color={showFilters || hasActiveFilters ? colors.primary[400] : colors.neutral[400]}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Segments */}
      <Animated.View entering={FadeInDown.delay(250).duration(500)}>
        <View style={styles.segments}>
          {([
            { key: 'all' as Segment, label: strings.search.segmentAll },
            { key: 'checkin' as Segment, label: strings.search.segmentCheckin },
            { key: 'register' as Segment, label: strings.search.segmentRegister },
          ]).map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.segment, segment === s.key && styles.segmentActive]}
              onPress={() => handleSegmentChange(s.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, segment === s.key && styles.segmentTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Collapsible filters */}
      {showFilters && (
        <Animated.View entering={FadeInDown.duration(300)}>
          {/* Emotion chips */}
          <Text style={styles.filterLabel}>{strings.search.emotionsLabel}</Text>
          <EmotionChips
            selectedEmotions={selectedEmotions}
            onToggle={handleToggleEmotion}
          />

          {/* Date range */}
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
            <TouchableOpacity onPress={handleClearFilters} style={styles.clearButton}>
              <Text style={styles.clearText}>{strings.search.clearFilters}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Results count */}
      {!loading && (
        <View style={styles.resultRow}>
          <Text style={styles.resultCount}>
            {filteredResults.length} {filteredResults.length === 1 ? strings.search.oneResult : strings.search.results}
          </Text>
        </View>
      )}

      {/* Results */}
      {!loading && filteredResults.length === 0 ? (
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.emptyContainer}
        >
          <EmptyState
            emoji="🔍"
            message={
              hasActiveFilters
                ? strings.search.noResults + '\n' + strings.search.noResultsHint
                : strings.search.noRecords
            }
          />
        </Animated.View>
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => `${item.type}-${item.data.id}`}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index, 10) * 60).duration(400)}
            >
              {item.type === 'checkin' ? (
                <CheckinCard
                  checkin={item.data}
                  onPress={() => router.push(`/checkin/${item.data.id}`)}
                />
              ) : (
                <EmotionalRegisterCard
                  register={item.data}
                  onPress={() => router.push(`/registro-emocional/${item.data.id}`)}
                />
              )}
            </Animated.View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.displaySmall,
    color: colors.neutral[800],
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
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
    fontSize: 13,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  segmentTextActive: {
    color: colors.neutral[700],
    fontFamily: fonts.sansBold,
  },
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
  clearButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  clearText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.primary[400],
  },
  resultRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  resultCount: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.neutral[500],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
});
