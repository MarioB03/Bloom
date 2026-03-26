import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { StepIndicator } from '@/components/skills/StepIndicator';
import { ExerciseTimer } from '@/components/skills/ExerciseTimer';
import { BreathingCircle } from '@/components/skills/BreathingCircle';
import { getSkillById, getCategoryMeta } from '@/constants/skills';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius, shadows } from '@/constants/theme';

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const skill = getSkillById(id);
  const category = skill ? getCategoryMeta(skill.category) : null;

  // Exercise state
  const [currentStep, setCurrentStep] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const isExercise = skill?.type === 'exercise';
  const isBreathing = skill?.id.startsWith('respiracion');
  const step = skill?.steps[currentStep];
  const hasDuration = step?.durationSeconds && step.durationSeconds > 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isRunning, remainingSeconds]);

  const handleStart = () => {
    setIsStarted(true);
    setCurrentStep(0);
    const firstStep = skill?.steps[0];
    if (firstStep?.durationSeconds) {
      setRemainingSeconds(firstStep.durationSeconds);
      setIsRunning(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleNextStep = () => {
    if (!skill) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);

    if (currentStep < skill.steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      const nextStep = skill.steps[next];
      if (nextStep.durationSeconds) {
        setRemainingSeconds(nextStep.durationSeconds);
        setIsRunning(true);
      } else {
        setRemainingSeconds(0);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      setIsDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRestart = () => {
    setIsDone(false);
    setIsStarted(false);
    setCurrentStep(0);
    setRemainingSeconds(0);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
    } else if (remainingSeconds > 0) {
      setIsRunning(true);
    }
  };

  if (!skill || !category) {
    return (
      <ScreenWrapper>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center', paddingTop: 80 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
          <Text style={{ ...typography.body, color: colors.neutral[500] }}>Habilidad no encontrada</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // ── Exercise finished ──
  if (isDone) {
    return (
      <View style={styles.doneOverlay}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.doneContent}>
          <Text style={styles.doneEmoji}>{skill.icon}</Text>
          <Text style={styles.doneTitle}>{strings.skills.congratulations}</Text>
          <Text style={styles.doneHint}>{strings.skills.keepPracticing}</Text>
          <View style={styles.doneButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleRestart();
              }}
              style={styles.doneButtonOutline}
            >
              <Ionicons name="refresh" size={18} color={colors.primary[400]} />
              <Text style={styles.doneButtonOutlineText}>{strings.skills.practiceAgain}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>{strings.skills.backToSkills}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ── Exercise mode (started) ──
  if (isExercise && isStarted) {
    return (
      <ScreenWrapper scrollRef={scrollRef}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{skill.title}</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <View style={styles.stepIndicatorContainer}>
          <StepIndicator
            currentStep={currentStep}
            totalSteps={skill.steps.length}
            color={category.color}
          />
          <Text style={styles.stepLabel}>
            {strings.skills.stepOf
              .replace('{current}', String(currentStep + 1))
              .replace('{total}', String(skill.steps.length))}
          </Text>
        </View>

        <Animated.View
          key={currentStep}
          entering={FadeInDown.duration(400)}
          style={styles.stepCard}
        >
          <Text style={styles.stepTitle}>{step?.title}</Text>
          <Text style={styles.stepInstruction}>{step?.instruction}</Text>
          {hasDuration && (
            <View style={styles.timerContainer}>
              {isBreathing && step?.breathingPattern ? (
                <BreathingCircle
                  pattern={step!.breathingPattern}
                  isRunning={isRunning}
                  remainingSeconds={remainingSeconds}
                  durationSeconds={step!.durationSeconds!}
                  onToggle={toggleTimer}
                  color={category.color}
                />
              ) : (
                <ExerciseTimer
                  durationSeconds={step!.durationSeconds!}
                  isRunning={isRunning}
                  remainingSeconds={remainingSeconds}
                  onToggle={toggleTimer}
                  color={category.color}
                />
              )}
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleNextStep}
          style={[styles.nextButton, { backgroundColor: category.color }]}
        >
          <Text style={styles.nextButtonText}>
            {currentStep < skill.steps.length - 1
              ? strings.skills.nextStep
              : strings.skills.finish}
          </Text>
          <Ionicons
            name={currentStep < skill.steps.length - 1 ? 'arrow-forward' : 'checkmark'}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  // ── Default: Skill detail view ──
  return (
    <ScreenWrapper scrollRef={scrollRef}>
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.title}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Skill hero */}
      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.hero}>
        <Text style={styles.heroEmoji}>{skill.icon}</Text>
        <View style={styles.heroBadges}>
          <View style={[styles.typeBadge, isExercise ? styles.exerciseBadge : styles.articleBadge]}>
            <Ionicons
              name={isExercise ? 'fitness-outline' : 'book-outline'}
              size={12}
              color={isExercise ? colors.secondary[500] : colors.accent[500]}
            />
            <Text style={[styles.typeText, isExercise ? styles.exerciseText : styles.articleText]}>
              {isExercise ? strings.skills.exercise : strings.skills.article}
            </Text>
          </View>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={12} color={colors.neutral[500]} />
            <Text style={styles.durationText}>{skill.durationLabel}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>{skill.title}</Text>
        <Text style={styles.heroDescription}>{skill.longDescription}</Text>
      </Animated.View>

      {/* Article: show all content inline */}
      {!isExercise && (
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <Text style={styles.sectionTitle}>{strings.skills.steps}</Text>
          {skill.steps.map((s, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(300 + i * 60).duration(400)} style={styles.articleStep}>
              <View style={[styles.articleStepNumber, { backgroundColor: category.color + '15' }]}>
                <Text style={[styles.articleStepNumberText, { color: category.color }]}>{i + 1}</Text>
              </View>
              <View style={styles.articleStepContent}>
                <Text style={styles.articleStepTitle}>{s.title}</Text>
                <Text style={styles.articleStepInstruction}>{s.instruction}</Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Exercise: step preview */}
      {isExercise && (
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <Text style={styles.sectionTitle}>
            {skill.steps.length} {strings.skills.steps.toLowerCase()}
          </Text>
          {skill.steps.map((s, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(300 + i * 40).duration(300)} style={styles.exerciseStepPreview}>
              <View style={[styles.exerciseStepDot, { backgroundColor: category.color }]} />
              <Text style={styles.exerciseStepPreviewTitle}>{s.title}</Text>
              {s.durationSeconds ? (
                <Text style={styles.exerciseStepDuration}>{s.durationSeconds}s</Text>
              ) : null}
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Tips */}
      {skill.tips.length > 0 && (
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={styles.sectionTitle}>{strings.skills.tips}</Text>
          <View style={styles.tipsCard}>
            {skill.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipBullet}>💡</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Only exercises get an action button */}
      {isExercise && (
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.actionContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleStart}
            style={[styles.actionButton, { backgroundColor: category.color }]}
          >
            <Ionicons name="play" size={22} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{strings.skills.startExercise}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  exerciseBadge: { backgroundColor: colors.secondary[50] },
  articleBadge: { backgroundColor: colors.accent[50] },
  typeText: { fontFamily: fonts.rounded, fontSize: 12 },
  exerciseText: { color: colors.secondary[500] },
  articleText: { color: colors.accent[500] },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  durationText: { fontFamily: fonts.rounded, fontSize: 12, color: colors.neutral[500] },
  heroTitle: {
    ...typography.displaySmall,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroDescription: {
    ...typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
  articleStep: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  articleStepNumber: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  articleStepNumberText: { fontFamily: fonts.sansBold, fontSize: 14 },
  articleStepContent: { flex: 1 },
  articleStepTitle: { ...typography.bodyBold, color: colors.neutral[700], marginBottom: 4 },
  articleStepInstruction: { ...typography.body, color: colors.neutral[600], lineHeight: 22 },
  exerciseStepPreview: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  exerciseStepDot: { width: 8, height: 8, borderRadius: 4 },
  exerciseStepPreviewTitle: { ...typography.body, color: colors.neutral[600], flex: 1 },
  exerciseStepDuration: { ...typography.caption, color: colors.neutral[400] },
  tipsCard: {
    backgroundColor: colors.accent[50],
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent[100],
    marginBottom: spacing.lg,
  },
  tipRow: { flexDirection: 'row', gap: spacing.sm },
  tipBullet: { fontSize: 16, marginTop: 1 },
  tipText: { ...typography.body, color: colors.neutral[600], flex: 1, lineHeight: 22 },
  actionContainer: { marginBottom: spacing.xl },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.warm,
  },
  actionButtonText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#FFFFFF' },
  stepIndicatorContainer: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  stepLabel: { ...typography.caption, color: colors.neutral[500] },
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  stepTitle: { ...typography.heading2, color: colors.neutral[800], marginBottom: spacing.sm },
  stepInstruction: { ...typography.body, color: colors.neutral[600], lineHeight: 24 },
  timerContainer: { marginTop: spacing.lg },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    ...shadows.warm,
  },
  nextButtonText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#FFFFFF' },
  // Done overlay
  doneOverlay: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  doneContent: { alignItems: 'center', width: '100%' },
  doneEmoji: { fontSize: 72, marginBottom: spacing.lg },
  doneTitle: { ...typography.displayLarge, color: colors.neutral[800], marginBottom: spacing.sm },
  doneHint: { ...typography.body, color: colors.neutral[500], textAlign: 'center', marginBottom: spacing.xl },
  doneButtons: { gap: spacing.sm, width: '100%' },
  doneButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  doneButtonOutlineText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.primary[400] },
  doneButton: {
    backgroundColor: colors.primary[400],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  doneButtonText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#FFFFFF' },
});
