import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Animated, {
  FadeInDown, FadeIn, SlideInRight,
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import AnimatedButton from '../../components/ui/AnimatedButton';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import GlowingIcon from '../../components/ui/GlowingIcon';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { analyzeFood, analyzeFoodTextOnly } from '../../services/gemini';
import { auth } from '../../services/firebase';
import { MEAL_ICONS } from '../../constants/icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';

/* â”€â”€ bounce helper hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function useBounce() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bounce = useCallback(() => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 12, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
  }, []);
  return { style, bounce };
}

/* â”€â”€ Macro color map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const MACRO_COLORS = {
  calories: theme.colors.accentOrange,
  protein: theme.colors.macroProtein,
  carbs: theme.colors.macroCarbs,
  fat: theme.colors.macroFat,
};

export default function FoodLogScreen({ route, navigation }: any) {
  const { logFood, settings, todayFoodLogs, deleteFood } = useApp();
  const [mode, setMode] = useState<'manual' | 'ai' | 'barcode'>(route?.params?.aiMode ? 'ai' : 'manual');
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* bounce instances */
  const modeBounce = useBounce();
  const mealBounce = useBounce();
  const photoBounce = useBounce();
  const logBtnBounce = useBounce();

  const handleBarcodeScan = async ({ data }: { data: string }) => {
    if (barcodeScanned || barcodeLoading) return;
    setBarcodeScanned(true);
    setBarcodeLoading(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}.json`);
      const json = await res.json();
      const n = json?.product?.nutriments;
      const name = json?.product?.product_name || json?.product?.product_name_en || '';
      if (n && name) {
        const p = Math.round(n.proteins_100g || n.proteins || 0);
        const c = Math.round(n.carbohydrates_100g || n.carbohydrates || 0);
        const f = Math.round(n.fat_100g || n.fat || 0);
        let cal = n['energy-kcal_100g'] || n['energy-kcal'] || n['energy-kcal_value'] || 0;
        if (!cal) {
          const macroCal = p * 4 + c * 4 + f * 9;
          if (macroCal > 0) {
            cal = Math.round(macroCal);
          } else if (n.energy_100g || n.energy_value) {
            const rawE = n.energy_100g || n.energy_value;
            const unit = (n.energy_unit || '').toString().toLowerCase();
            cal = unit === 'kcal' ? Math.round(rawE) : Math.round(rawE / 4.184);
          }
        }
        if (!cal && !p && !c && !f) {
          // Product found but no nutrition data at all
          setFoodName(name);
          setMode('manual');
          Toast.show({ type: 'info', text1: 'Partial Data', text2: `${name} found but no nutrition info. Enter manually.` });
        } else {
          setFoodName(name);
          setCalories(Math.round(cal).toString());
          setProtein(p.toString());
          setCarbs(c.toString());
          setFat(f.toString());
          setMode('manual');
          Toast.show({ type: 'success', text1: 'Product Found!', text2: name });
        }
      } else {
        Toast.show({ type: 'error', text1: 'Not Found', text2: 'Product not in database. Enter manually.' });
        setMode('manual');
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Scan Failed', text2: 'Check your internet connection.' });
      setBarcodeScanned(false);
    }
    setBarcodeLoading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setImageUri(manipulated.uri);
      setImageBase64(manipulated.base64 || null);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: 'error', text1: 'Permission needed', text2: 'Camera access is required' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setImageUri(manipulated.uri);
      setImageBase64(manipulated.base64 || null);
    }
  };

  const analyzeWithAI = async () => {
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a food description' });
      return;
    }
    const apiKey = settings?.gemini_api_key || '';
    setLoading(true);
    try {
      // Get Firebase auth token for shared key usage
      let authToken: string | undefined;
      try {
        if (!apiKey && auth.currentUser) {
          authToken = await auth.currentUser.getIdToken(true); // force refresh
        }
      } catch (tokenErr) {
        console.warn('[FoodLog] Failed to get auth token:', tokenErr);
      }

      let result;
      if (imageBase64) {
        result = await analyzeFood(imageBase64, description, apiKey, authToken);
      } else {
        result = await analyzeFoodTextOnly(description, apiKey, authToken);
      }
      setAiResult(result);
      setFoodName(result.food_name || description);
      setCalories(String(result.calories || 0));
      setProtein(String(result.protein || 0));
      setCarbs(String(result.carbs || 0));
      setFat(String(result.fat || 0));
      Toast.show({ type: 'success', text1: 'Analyzed!', text2: 'Review and confirm the values' });
    } catch (error: any) {
      console.warn('[FoodLog] AI error:', error?.message || error);
      Toast.show({ type: 'error', text1: 'AI Error', text2: error.message || 'Failed to analyze food' });
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
    if (!foodName.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter food name' });
      return;
    }
    setLoading(true);
    try {
      await logFood({
        food_name: foodName.trim(),
        calories: Math.max(0, parseInt(calories) || 0),
        protein: Math.max(0, parseFloat(protein) || 0),
        carbs: Math.max(0, parseFloat(carbs) || 0),
        fat: Math.max(0, parseFloat(fat) || 0),
        meal_type: mealType,
        logged_at: new Date().toISOString(),
      });
      Toast.show({ type: 'success', text1: 'âœ… Food Logged!', text2: `${foodName} added` });
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setDescription('');
      setImageUri(null);
      setImageBase64(null);
      setAiResult(null);
    } catch (error) {
      // Handled by optimistic update rollback
    } finally {
      setLoading(false);
    }
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

  /* â”€â”€ total kcal today â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const totalCalToday = todayFoodLogs.reduce((s, f) => s + (f.calories || 0), 0);

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeIn.duration(400)}>

            {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Log Food</Text>
                <Text style={styles.subtitle}>Track your nutrition</Text>
              </View>
              {totalCalToday > 0 && (
                <View style={styles.headerCalBadge}>
                  <Text style={styles.headerCalNum}>{totalCalToday}</Text>
                  <Text style={styles.headerCalLabel}>kcal today</Text>
                </View>
              )}
            </View>

            {/* â”€â”€ Mode Toggle (gradient active) â”€â”€â”€â”€â”€â”€â”€ */}
            <Animated.View style={modeBounce.style}>
              <View style={styles.modeToggle}>
                {(['manual', 'ai', 'barcode'] as const).map((m) => {
                  const active = mode === m;
                  const mColors: Record<string, string[]> = {
                    manual: [theme.colors.accent, theme.colors.accentEnd],
                    ai: [theme.colors.accentOrange, '#FF6EC7'],
                    barcode: ['#A855F7', '#7C3AED'],
                  };
                  const mIcons: Record<string, string> = { manual: 'create', ai: 'sparkles', barcode: 'barcode' };
                  const mIconsO: Record<string, string> = { manual: 'create-outline', ai: 'sparkles-outline', barcode: 'barcode-outline' };
                  const mLabels: Record<string, string> = { manual: 'Manual', ai: 'AI Powered', barcode: 'Barcode' };
                  const inner = (
                    <Pressable
                      key={m}
                      onPress={() => {
                        modeBounce.bounce();
                        if (m === 'barcode') {
                          setBarcodeScanned(false);
                          if (!cameraPermission?.granted) requestCameraPermission();
                        }
                        setMode(m);
                      }}
                      style={[styles.modeBtn, active && styles.modeBtnActiveWrap]}
                      hitSlop={8}
                    >
                      {active ? (
                        <LinearGradient
                          colors={mColors[m] as [string, string]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={styles.modeBtnGradient}
                        >
                          <Ionicons name={mIcons[m] as any} size={18} color="#fff" />
                          <Text style={styles.modeTextActive}>{mLabels[m]}</Text>
                        </LinearGradient>
                      ) : (
                        <>
                          <Ionicons name={mIconsO[m] as any} size={18} color={theme.colors.textSecondary} />
                          <Text style={styles.modeText}>{mLabels[m]}</Text>
                        </>
                      )}
                    </Pressable>
                  );
                  return inner;
                })}
              </View>
            </Animated.View>

            {/* â”€â”€ Meal Type (colored icon buttons) â”€â”€â”€â”€ */}
            <Animated.View style={mealBounce.style}>
              <View style={styles.mealTypeRow}>
                {mealTypes.map((mt) => {
                  const active = mealType === mt;
                  const mi = MEAL_ICONS[mt];
                  return (
                    <Pressable
                      key={mt}
                      onPress={() => { mealBounce.bounce(); setMealType(mt); }}
                      style={[
                        styles.mealTypeBtn,
                        active && { borderColor: mi.color + '60', backgroundColor: mi.color + '12' },
                      ]}
                      hitSlop={4}
                    >
                      <GlowingIcon icon={mi.icon} size={16} color={active ? mi.color : theme.colors.textTertiary} />
                      <Text style={[
                        styles.mealTypeText,
                        active && { color: mi.color },
                      ]}>
                        {mt.charAt(0).toUpperCase() + mt.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* ── Barcode Mode ──────────────────────────── */}
            {mode === 'barcode' ? (
              <View style={styles.barcodeContainer}>
                {cameraPermission?.granted ? (
                  <>
                    <CameraView
                      style={styles.barcodeCamera}
                      facing="back"
                      onBarcodeScanned={barcodeScanned ? undefined : handleBarcodeScan}
                      barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
                    />
                    <View style={styles.barcodeOverlay}>
                      <View style={styles.barcodeFrame}>
                        <View style={[styles.barcodeCorner, styles.bcTopLeft]} />
                        <View style={[styles.barcodeCorner, styles.bcTopRight]} />
                        <View style={[styles.barcodeCorner, styles.bcBottomLeft]} />
                        <View style={[styles.barcodeCorner, styles.bcBottomRight]} />
                      </View>
                      <Text style={styles.barcodeTip}>
                        {barcodeLoading ? 'Looking up product...' : 'Point at product barcode'}
                      </Text>
                      {barcodeScanned && !barcodeLoading && (
                        <Pressable onPress={() => setBarcodeScanned(false)} style={styles.barcodeRescan}>
                          <Ionicons name="refresh" size={16} color="#fff" />
                          <Text style={styles.barcodeRescanText}>Scan Again</Text>
                        </Pressable>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.barcodeNoPerm}>
                    <Ionicons name="camera-outline" size={44} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.barcodeNoPermText}>Camera permission required</Text>
                    <Pressable onPress={requestCameraPermission} style={styles.barcodePermBtn}>
                      <Text style={styles.barcodePermBtnText}>Grant Access</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : mode === 'ai' ? (
              <View>
                {/* Photo section with gradient dashed border */}
                <View style={styles.photoSection}>
                  {imageUri ? (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: imageUri }} style={styles.previewImage} />
                      <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent']}
                        style={styles.imageOverlay}
                      />
                      <Pressable
                        onPress={() => { setImageUri(null); setImageBase64(null); }}
                        style={styles.removeImage}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={28} color={theme.colors.error} />
                      </Pressable>
                    </View>
                  ) : (
                    <Animated.View style={photoBounce.style}>
                      <LinearGradient
                        colors={[theme.colors.accent + '30', theme.colors.accentEnd + '30']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.photoBorderGradient}
                      >
                        <View style={styles.photoButtonsInner}>
                          <Pressable onPress={() => { photoBounce.bounce(); takePhoto(); }} style={styles.photoBtn} hitSlop={8}>
                            <GlowingIcon icon="camera" size={28} color={theme.colors.accent} gradient gradientColors={[theme.colors.accent, theme.colors.accentEnd]} />
                            <Text style={styles.photoBtnText}>Camera</Text>
                          </Pressable>
                          <View style={styles.photoDivider} />
                          <Pressable onPress={() => { photoBounce.bounce(); pickImage(); }} style={styles.photoBtn} hitSlop={8}>
                            <GlowingIcon icon="image" size={28} color={theme.colors.accentCyan} gradient gradientColors={[theme.colors.accentCyan, theme.colors.accent]} />
                            <Text style={styles.photoBtnText}>Gallery</Text>
                          </Pressable>
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  )}
                  <Text style={styles.photoHint}>ðŸ“¸ Photo is optional but improves accuracy</Text>
                </View>

                <Input
                  label="Food Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g., butter chicken with 100g chicken and curd"
                  multiline
                  numberOfLines={3}
                />

                <Animated.View style={logBtnBounce.style}>
                  <AnimatedButton
                    title="Analyze with AI"
                    onPress={() => { logBtnBounce.bounce(); analyzeWithAI(); }}
                    loading={loading}
                    fullWidth
                    size="lg"
                    icon={<Ionicons name="sparkles" size={18} color="#fff" />}
                  />
                </Animated.View>

                {/* AI Result Card with glass + glow */}
                {aiResult && (
                  <Animated.View entering={SlideInRight.duration(400)}>
                    <View style={styles.resultCardGlass}>
                      <LinearGradient
                        colors={[theme.colors.accentOrange + '10', theme.colors.accent + '08']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.resultCardInner}
                      >
                        <View style={styles.resultHeader}>
                          <GlowingIcon icon="sparkles" size={18} color={theme.colors.accentOrange} />
                          <Text style={styles.resultTitle}>AI Estimate</Text>
                        </View>
                        <Text style={styles.resultName}>{aiResult.food_name}</Text>
                        <View style={styles.resultRow}>
                          <MacroChip label="Calories" value={`${aiResult.calories}`} color={MACRO_COLORS.calories} />
                          <MacroChip label="Protein" value={`${aiResult.protein}g`} color={MACRO_COLORS.protein} />
                          <MacroChip label="Carbs" value={`${aiResult.carbs}g`} color={MACRO_COLORS.carbs} />
                          <MacroChip label="Fat" value={`${aiResult.fat}g`} color={MACRO_COLORS.fat} />
                        </View>
                        <AnimatedButton
                          title="Confirm & Log"
                          onPress={handleLog}
                          fullWidth
                          size="md"
                          style={{ marginTop: 14 }}
                          icon={<Ionicons name="checkmark" size={18} color="#fff" />}
                        />
                      </LinearGradient>
                    </View>
                  </Animated.View>
                )}
              </View>
            ) : (
              /* â”€â”€ Manual Mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
              <View>
                <Input label="Food Name" value={foodName} onChangeText={setFoodName} placeholder="Chicken breast" />
                <View style={styles.macroInputRow}>
                  <View style={{ flex: 1 }}>
                    <Input label="Calories" value={calories} onChangeText={setCalories} placeholder="300" keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label="Protein (g)" value={protein} onChangeText={setProtein} placeholder="30" keyboardType="decimal-pad" />
                  </View>
                </View>
                <View style={styles.macroInputRow}>
                  <View style={{ flex: 1 }}>
                    <Input label="Carbs (g)" value={carbs} onChangeText={setCarbs} placeholder="20" keyboardType="decimal-pad" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label="Fat (g)" value={fat} onChangeText={setFat} placeholder="10" keyboardType="decimal-pad" />
                  </View>
                </View>

                <Animated.View style={logBtnBounce.style}>
                  <AnimatedButton
                    title="Log Food"
                    onPress={() => { logBtnBounce.bounce(); handleLog(); }}
                    loading={loading}
                    fullWidth
                    size="lg"
                    icon={<Ionicons name="checkmark" size={18} color="#fff" />}
                  />
                </Animated.View>
              </View>
            )}

            {/* â”€â”€ Today's Food Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {todayFoodLogs.length > 0 && (
              <View style={styles.logSection}>
                <View style={styles.logSectionHeader}>
                  <Text style={styles.logSectionTitle}>Today's Food</Text>
                  <Text style={styles.logSectionCount}>{todayFoodLogs.length} items</Text>
                </View>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(mt => {
                  const items = todayFoodLogs.filter(f => f.meal_type === mt);
                  if (items.length === 0) return null;
                  const mi = MEAL_ICONS[mt];
                  const mealCals = items.reduce((s, f) => s + (f.calories || 0), 0);
                  return (
                    <View key={mt} style={styles.mealGroup}>
                      <View style={styles.mealGroupHeader}>
                        <Ionicons name={mi.icon as any} size={16} color={mi.color} />
                        <Text style={[styles.mealGroupTitle, { color: mi.color }]}>
                          {mt.charAt(0).toUpperCase() + mt.slice(1)}
                        </Text>
                        <Text style={styles.mealGroupCals}>{mealCals} kcal</Text>
                      </View>
                      {items.map((food, index) => (
                        <Animated.View key={food.id} entering={FadeInDown.delay(index * 60).duration(350)}>
                          <View style={styles.logItem}>
                            <View style={[styles.logItemStrip, { backgroundColor: mi.color }]} />
                            <View style={styles.logItemContent}>
                              <View style={styles.logItemLeft}>
                                <Text style={styles.logItemName}>{food.food_name}</Text>
                                <View style={styles.logItemMacroRow}>
                                  <Text style={[styles.logItemMacroTag, { color: MACRO_COLORS.protein }]}>
                                    P {food.protein}g
                                  </Text>
                                  <Text style={styles.logItemMacroDot}>·</Text>
                                  <Text style={[styles.logItemMacroTag, { color: MACRO_COLORS.carbs }]}>
                                    C {food.carbs}g
                                  </Text>
                                  <Text style={styles.logItemMacroDot}>·</Text>
                                  <Text style={[styles.logItemMacroTag, { color: MACRO_COLORS.fat }]}>
                                    F {food.fat}g
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.logItemRight}>
                                <Text style={styles.logItemCalories}>{food.calories}</Text>
                                <Text style={styles.logItemCalLabel}>kcal</Text>
                              </View>
                              <Pressable
                                onPress={() => deleteFood(food.id)}
                                hitSlop={12}
                                style={styles.deleteBtn}
                              >
                                <Ionicons name="trash-outline" size={16} color={theme.colors.error + '90'} />
                              </Pressable>
                            </View>
                          </View>
                        </Animated.View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* â”€â”€ Macro Chip sub-component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[chipStyles.chip, { borderColor: color + '35', backgroundColor: color + '0A' }]}>
      <Text style={[chipStyles.value, { color }]}>{value}</Text>
      <Text style={chipStyles.label}>{label}</Text>
      {/* glow dot */}
      <View style={[chipStyles.glow, { backgroundColor: color }]} />
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  value: { fontSize: 18, fontWeight: '800' as any, letterSpacing: -0.5 },
  label: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 3, fontWeight: '500' as any },
  glow: {
    position: 'absolute', bottom: -4, width: 30, height: 6, borderRadius: 3, opacity: 0.25,
  },
});

/* â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingTop: 60 },

  /* Header */
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24,
  },
  title: {
    fontSize: theme.fontSize.xxxl, fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary, letterSpacing: -0.5,
  },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textTertiary, marginTop: 2 },
  headerCalBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.accentOrange + '25',
  },
  headerCalNum: {
    fontSize: 22, fontWeight: '900' as any, color: theme.colors.accentOrange, letterSpacing: -0.5,
  },
  headerCalLabel: { fontSize: 9, color: theme.colors.textTertiary, fontWeight: '600' as any, marginTop: 1 },

  /* Mode Toggle */
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modeBtnActiveWrap: { overflow: 'hidden' },
  modeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  modeText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium, fontSize: 14 },
  modeTextActive: { color: '#fff', fontWeight: theme.fontWeight.bold, fontSize: 14 },

  /* Meal Type */
  mealTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  mealTypeBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  mealTypeText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.2,
  },

  /* Photo Section */
  photoSection: { marginBottom: 18 },
  photoBorderGradient: {
    borderRadius: theme.borderRadius.xl,
    padding: 1.5,
  },
  photoButtonsInner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.xl - 1,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  photoBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoDivider: {
    width: 1, height: 40, backgroundColor: theme.colors.glassBorder,
  },
  photoBtnText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.medium },
  imagePreview: { position: 'relative', borderRadius: theme.borderRadius.xl, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, borderRadius: theme.borderRadius.xl },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 50 },
  removeImage: { position: 'absolute', top: 10, right: 10 },
  photoHint: { color: theme.colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 10 },

  /* AI Result Card (glass + glow) */
  resultCardGlass: {
    marginTop: 18,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.accentOrange + '20',
    overflow: 'hidden',
  },
  resultCardInner: {
    padding: 18,
    borderRadius: theme.borderRadius.xl - 1,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  resultTitle: {
    color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.semibold,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  resultName: {
    color: theme.colors.textPrimary, fontSize: 20, fontWeight: theme.fontWeight.bold, marginBottom: 14,
  },
  resultRow: { flexDirection: 'row', gap: 8 },

  /* Manual macro input */
  macroInputRow: { flexDirection: 'row', gap: 12 },

  /* Today's Log */
  logSection: { marginTop: 36 },
  logSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  logSectionTitle: {
    color: theme.colors.textPrimary, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold,
  },
  logSectionCount: {
    color: theme.colors.textTertiary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium,
    backgroundColor: theme.colors.glass, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: theme.borderRadius.full, overflow: 'hidden',
  },
  mealGroup: { marginBottom: 16 },
  mealGroupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 4,
  },
  mealGroupTitle: {
    fontSize: 14, fontWeight: '700' as any, flex: 1, textTransform: 'uppercase', letterSpacing: 1,
  },
  mealGroupCals: {
    fontSize: 12, fontWeight: '700' as any, color: theme.colors.textTertiary,
  },
  logItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    overflow: 'hidden',
  },
  logItemStrip: { width: 3.5, borderTopLeftRadius: theme.borderRadius.lg, borderBottomLeftRadius: theme.borderRadius.lg },
  logItemContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14 },
  logItemLeft: { flex: 1 },
  logItemName: {
    color: theme.colors.textPrimary, fontSize: 15, fontWeight: theme.fontWeight.semibold,
  },
  logItemMacroRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  logItemMacroTag: { fontSize: 11, fontWeight: theme.fontWeight.medium },
  logItemMacroDot: { color: theme.colors.textTertiary, fontSize: 11 },
  logItemRight: { alignItems: 'flex-end', marginRight: 14 },
  logItemCalories: {
    color: theme.colors.accentOrange, fontSize: 20, fontWeight: theme.fontWeight.black, letterSpacing: -0.5,
  },
  logItemCalLabel: { color: theme.colors.textTertiary, fontSize: 9, fontWeight: '600' as any },
  deleteBtn: {
    padding: 6,
    backgroundColor: theme.colors.error + '10',
    borderRadius: theme.borderRadius.sm,
  },

  /* ── Barcode Scanner ─────────────────────── */
  barcodeContainer: {
    height: 300, borderRadius: 20, overflow: 'hidden',
    marginVertical: 16, position: 'relative',
  },
  barcodeCamera: { ...StyleSheet.absoluteFillObject },
  barcodeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  barcodeFrame: {
    width: 220, height: 140, position: 'relative',
  },
  barcodeCorner: {
    position: 'absolute', width: 24, height: 24,
    borderColor: '#00E5FF', borderWidth: 3,
  },
  bcTopLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  bcTopRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  bcBottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  bcBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  barcodeTip: {
    color: '#fff', fontSize: 13, fontWeight: '600',
    marginTop: 24, textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999,
  },
  barcodeRescan: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#00E5FF20', borderWidth: 1, borderColor: '#00E5FF40',
  },
  barcodeRescanText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  barcodeNoPerm: {
    height: 200, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginVertical: 16,
  },
  barcodeNoPermText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 12 },
  barcodePermBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999,
    backgroundColor: '#A855F720', borderWidth: 1, borderColor: '#A855F740',
  },
  barcodePermBtnText: { color: '#A855F7', fontSize: 14, fontWeight: '700' },
});

