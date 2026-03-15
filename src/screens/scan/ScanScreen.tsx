import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Dimensions, TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { theme } from '../../theme';
import { useApp } from '../../store/AppContext';
import { analyzeNutritionLabelImage, analyzeFrontPackageImage, ProductAnalysis } from '../../services/gemini';
import { auth } from '../../services/firebase';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import { FoodLog } from '../../types';

const { width: SW } = Dimensions.get('window');

const HEALTH_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  dangerous: { color: '#FF1744', bg: 'rgba(255,23,68,0.15)', icon: 'skull-outline', label: 'Dangerous' },
  bad: { color: '#FF6D00', bg: 'rgba(255,109,0,0.15)', icon: 'thumbs-down-outline', label: 'Bad' },
  alright: { color: '#FFD600', bg: 'rgba(255,214,0,0.15)', icon: 'hand-right-outline', label: 'Alright' },
  good: { color: '#69F0AE', bg: 'rgba(105,240,174,0.15)', icon: 'thumbs-up-outline', label: 'Good' },
  healthy: { color: '#00E676', bg: 'rgba(0,230,118,0.15)', icon: 'heart-outline', label: 'Healthy' },
};

export default function ScanScreen() {
  const { settings, logFood } = useApp();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'nutrition_label' | 'front_package'>('nutrition_label');
  const [loadingStage, setLoadingStage] = useState('Reading nutrition label');
  const [product, setProduct] = useState<ProductAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const lastSource = useRef<'camera' | 'gallery' | ''>('');

  const getAuthToken = useCallback(async () => {
    if (!settings?.gemini_api_key && auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return undefined;
  }, [settings?.gemini_api_key]);

  const analyzeImageBase64 = useCallback(async (imageBase64: string, source: 'camera' | 'gallery', mode: 'nutrition_label' | 'front_package') => {
    try {
      if (loading) return;
      lastSource.current = source;
      setScanMode(mode);
      setScanned(true);
      setLoading(true);
      setLoadingStage(mode === 'nutrition_label' ? 'Reading nutrition label' : 'Reading front package');
      setError(null);

      const authToken = await getAuthToken();
      const analysis = mode === 'nutrition_label' 
        ? await analyzeNutritionLabelImage(imageBase64, settings?.gemini_api_key || '', authToken, setLoadingStage)
        : await analyzeFrontPackageImage(imageBase64, settings?.gemini_api_key || '', authToken, setLoadingStage);
        
      setProduct(analysis);
    } catch (err: any) {
      setError(err?.message || 'Failed to read image. Try a clearer photo.');
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, loading, settings?.gemini_api_key]);

  const openCameraCapture = useCallback(async (mode: 'nutrition_label' | 'front_package') => {
    if (loading) return;
    const perm = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();

    if (!perm?.granted) {
      Toast.show({ type: 'error', text1: 'Permission needed', text2: 'Camera access is required' });
      return;
    }

    setScanMode(mode);
    setCameraOpen(true);
  }, [cameraPermission, loading, requestCameraPermission]);

  const analyzeImageFromGallery = useCallback(async (mode: 'nutrition_label' | 'front_package') => {
    try {
      if (loading) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      if (!result.assets[0].base64) {
        throw new Error('Could not read the selected photo.');
      }

      await analyzeImageBase64(result.assets[0].base64, 'gallery', mode);
    } catch (err: any) {
      setError(err?.message || 'Failed to read image. Try a clearer photo.');
      setScanned(true);
    }
  }, [analyzeImageBase64, loading]);

  const captureImage = useCallback(async () => {
    try {
      if (loading || !cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 1,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        throw new Error('Could not capture the photo.');
      }

      setCameraOpen(false);
      await analyzeImageBase64(photo.base64, 'camera', scanMode);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Capture failed', text2: err?.message || 'Try taking the photo again.' });
    }
  }, [analyzeImageBase64, loading, scanMode]);

  const resetScan = () => {
    setCameraOpen(false);
    setScanned(false);
    setProduct(null);
    setError(null);
    lastSource.current = '';
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      {cameraOpen ? (
        <View style={styles.cameraShell}>
          <CameraView ref={cameraRef} style={styles.cameraView} facing="back" />
          <View style={styles.cameraOverlay}>
            <Pressable style={styles.cameraCloseBtn} onPress={() => setCameraOpen(false)}>
              <Ionicons name="close" size={34} color="#fff" />
            </Pressable>
            <View style={styles.cameraGuideCard}>
              <Text style={styles.cameraGuideTitle}>{scanMode === 'nutrition_label' ? 'Fit the nutrition table in frame' : 'Fit the product front in frame'}</Text>
              <Text style={styles.cameraGuideText}>{scanMode === 'nutrition_label' ? 'Keep the text flat, sharp, and close.' : 'Make sure the brand and product name are visible.'}</Text>
            </View>
            <View style={styles.cameraBottomBar}>
              <Pressable style={styles.cameraGalleryBtn} onPress={() => { setCameraOpen(false); void analyzeImageFromGallery(scanMode); }}>
                <Ionicons name="images-outline" size={22} color="#fff" />
              </Pressable>
              <Pressable style={styles.shutterOuter} onPress={() => { void captureImage(); }}>
                <View style={styles.shutterInner} />
              </Pressable>
              <View style={styles.cameraBottomSpacer} />
            </View>
          </View>
        </View>
      ) : !scanned ? (
        <ScrollView contentContainerStyle={styles.entryScroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.entryHero}>
            <View style={styles.entryIconWrap}>
              <LinearGradient colors={['rgba(0,229,255,0.22)', 'rgba(74,144,255,0.12)']} style={styles.entryIconGrad}>
                <Ionicons name="document-text-outline" size={40} color="#67E8F9" />
              </LinearGradient>
            </View>
            <Text style={styles.entryTitle}>Product Scanner</Text>
            <Text style={styles.entrySub}>
              Scan the nutrition label for exact macros, or the front package for an AI estimate.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.entryCard}>
            <Pressable style={styles.entryActionBtn} onPress={() => { void openCameraCapture('nutrition_label'); }}>
              <LinearGradient colors={['#00E5FF', '#4A90FF']} style={styles.entryActionGrad}>
                <Ionicons name="document-text-outline" size={24} color="#081018" />
                <Text style={styles.entryActionPrimary}>Scan Nutrition Label</Text>
                <Text style={styles.entryActionSecondary}>Get exact macros from the table</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.entryActionBtn} onPress={() => { void openCameraCapture('front_package'); }}>
              <LinearGradient colors={['#FACC15', '#FF8A00']} style={styles.entryActionGrad}>
                <Ionicons name="scan-outline" size={24} color="#081018" />
                <Text style={styles.entryActionPrimary}>Scan Front Package</Text>
                <Text style={styles.entryActionSecondary}>AI estimates from the product look</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.entryGhostBtn} onPress={() => { void analyzeImageFromGallery('nutrition_label'); }}>
              <Ionicons name="images-outline" size={20} color="#fff" />
              <Text style={styles.entryGhostText}>Upload Image From Gallery</Text>
            </Pressable>

            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Best results</Text>
              <Text style={styles.tipText}>Nutrition Label: Fill frame with text, avoid glare.</Text>
              <Text style={styles.tipText}>Front Package: Ensure the brand and product name are clearly readable.</Text>
            </View>
          </Animated.View>
        </ScrollView>
      ) : (
        <View style={styles.resultContainer}>
          <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
            {loading ? (
              <Animated.View entering={FadeIn} style={styles.loadingWrap}>
                <Ionicons name="sparkles" size={36} color={theme.colors.accent} />
                <Text style={styles.loadingTitle}>Reading label...</Text>
                <Text style={styles.loadingSub}>{loadingStage}</Text>
                <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 16 }} />
              </Animated.View>
            ) : error ? (
              <Animated.View entering={FadeIn} style={styles.errorWrap}>
                <Ionicons name="alert-circle-outline" size={44} color="#FF6D00" />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable style={styles.labelFallbackBtn} onPress={() => {
                  if ((lastSource.current || 'camera') === 'camera') {
                    void openCameraCapture(scanMode);
                    return;
                  }
                  void analyzeImageFromGallery(scanMode);
                }}>
                  <Ionicons name="camera-outline" size={18} color="#00E5FF" />
                  <Text style={styles.labelFallbackText}>Retake Photo</Text>
                </Pressable>
                <Pressable style={styles.scanAgainBtn} onPress={resetScan}>
                  <Ionicons name="arrow-back-outline" size={18} color="#fff" />
                  <Text style={styles.scanAgainText}>Back to Scan Options</Text>
                </Pressable>
              </Animated.View>
            ) : product ? (
              <ProductResult
                product={product}
                onScanAgain={resetScan}
                onUseNutritionLabel={() => {
                  if ((lastSource.current || 'camera') === 'camera') {
                    void openCameraCapture('nutrition_label');
                    return;
                  }
                  void analyzeImageFromGallery('nutrition_label');
                }}
                logFood={logFood}
              />
            ) : null}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function ProductResult({ product, onScanAgain, onUseNutritionLabel, logFood }: {
  product: ProductAnalysis;
  onScanAgain: () => void;
  onUseNutritionLabel: () => void;
  logFood: (food: Omit<FoodLog, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
}) {
  const health = HEALTH_CONFIG[product.health_rating] || HEALTH_CONFIG.alright;
  const [addingMacros, setAddingMacros] = useState(false);
  const [macrosAdded, setMacrosAdded] = useState(false);
  const [servingMode, setServingMode] = useState<'100g' | 'full' | 'custom' | 'grams'>('100g');
  const [customPercent, setCustomPercent] = useState(50);
  const [customGrams, setCustomGrams] = useState('100');

  const packWeightG = product.product_weight_g || 0;
  const multiplier =
    servingMode === '100g' ? 1 :
    servingMode === 'full' ? (packWeightG > 0 ? packWeightG / 100 : 1) :
    servingMode === 'grams' ? (parseFloat(customGrams) || 100) / 100 :
    (customPercent / 100) * (packWeightG > 0 ? packWeightG / 100 : 1);

  const displayCals = Math.round(product.calories * multiplier);
  const displayProtein = Math.round(product.protein * multiplier * 10) / 10;
  const displayCarbs = Math.round(product.carbs * multiplier * 10) / 10;
  const displayFat = Math.round(product.fat * multiplier * 10) / 10;

  const servingLabel =
    servingMode === '100g' ? 'per 100g' :
    servingMode === 'full' ? `whole pack (${packWeightG}g)` :
    servingMode === 'grams' ? `${parseFloat(customGrams) || 100}g` :
    `${customPercent}% of pack (${Math.round(packWeightG * customPercent / 100)}g)`;

  const MEAL_TYPES: Array<{ key: FoodLog['meal_type']; label: string; icon: string }> = [
    { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
    { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
    { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
    { key: 'snack', label: 'Snack', icon: 'cafe-outline' },
  ];

  const handleAddToMacros = async (mealType: FoodLog['meal_type']) => {
    setAddingMacros(true);
    try {
      await logFood({
        food_name: product.brand !== 'Unknown'
          ? `${product.product_name} (${product.brand})`
          : product.product_name,
        calories: displayCals,
        protein: displayProtein,
        carbs: displayCarbs,
        fat: displayFat,
        meal_type: mealType,
        logged_at: new Date().toISOString(),
      });
      setMacrosAdded(true);
      Toast.show({ type: 'success', text1: 'Added to macros', text2: `${product.product_name} logged as ${mealType}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed', text2: 'Could not add to macros' });
    }
    setAddingMacros(false);
  };

  return (
    <>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.productHeader}>
        {product.source === 'ai_estimate' && (
          <View style={styles.estimatePill}>
            <Ionicons name="sparkles-outline" size={14} color="#FACC15" />
            <Text style={styles.estimatePillText}>AI estimate, not a verified barcode match</Text>
          </View>
        )}
        {product.source === 'nutrition_label' && (
          <View style={styles.labelReadPill}>
            <Ionicons name="document-text-outline" size={14} color="#67E8F9" />
            <Text style={styles.labelReadPillText}>Read from nutrition label photo</Text>
          </View>
        )}
        <View style={[styles.healthBadge, { backgroundColor: health.bg, borderColor: health.color + '40' }]}>
          <Ionicons name={health.icon as any} size={20} color={health.color} />
          <Text style={[styles.healthLabel, { color: health.color }]}>{health.label}</Text>
        </View>
        <Text style={styles.productName}>{product.product_name}</Text>
        {product.brand !== 'Unknown' && <Text style={styles.productBrand}>{product.brand}</Text>}
        <Text style={styles.servingSize}>Per {servingLabel}</Text>
      </Animated.View>

      {/* Health reasoning */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.reasonCard, { borderColor: health.color + '30' }]}>
        <Ionicons name="information-circle" size={18} color={health.color} />
        <Text style={styles.reasonText}>{product.health_reasoning}</Text>
      </Animated.View>

      {product.source === 'ai_estimate' && (
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.labelHelpCard}>
          <View style={styles.labelHelpHeader}>
            <Ionicons name="camera-outline" size={18} color="#67E8F9" />
            <Text style={styles.labelHelpTitle}>Want a more accurate result?</Text>
          </View>
          <Text style={styles.labelHelpText}>
            If the barcode database missed this item, snap the nutrition facts panel and we will read the macros directly from the label.
          </Text>
          <Pressable style={styles.labelHelpBtn} onPress={onUseNutritionLabel}>
            <Ionicons name="sparkles-outline" size={16} color="#081018" />
            <Text style={styles.labelHelpBtnText}>Use Nutrition Label Photo</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Serving size picker */}
      <Animated.View entering={FadeInDown.delay(280).duration(400)} style={styles.servingPickerCard}>
        <Text style={styles.cardTitle}>Serving Size</Text>
        <View style={styles.servingBtnRow}>
          <Pressable
            style={[styles.servingBtn, servingMode === '100g' && styles.servingBtnActive]}
            onPress={() => setServingMode('100g')}
          >
            <Text style={[styles.servingBtnText, servingMode === '100g' && styles.servingBtnTextActive]}>Per 100g</Text>
          </Pressable>
          {packWeightG > 0 && (
            <Pressable
              style={[styles.servingBtn, servingMode === 'full' && styles.servingBtnActive]}
              onPress={() => setServingMode('full')}
            >
              <Text style={[styles.servingBtnText, servingMode === 'full' && styles.servingBtnTextActive]}>Whole Pack ({packWeightG}g)</Text>
            </Pressable>
          )}
          {packWeightG > 0 && (
            <Pressable
              style={[styles.servingBtn, servingMode === 'custom' && styles.servingBtnActive]}
              onPress={() => setServingMode('custom')}
            >
              <Text style={[styles.servingBtnText, servingMode === 'custom' && styles.servingBtnTextActive]}>Custom %</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.servingBtn, servingMode === 'grams' && styles.servingBtnActive]}
            onPress={() => setServingMode('grams')}
          >
            <Text style={[styles.servingBtnText, servingMode === 'grams' && styles.servingBtnTextActive]}>Custom (g)</Text>
          </Pressable>
        </View>
        {servingMode === 'grams' && (
          <View style={styles.sliderWrap}>
            <Text style={styles.sliderLabel}>Enter amount in grams</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  color: '#fff',
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
                value={customGrams}
                onChangeText={setCustomGrams}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <Text style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8, fontSize: 14 }}>g</Text>
            </View>
            <View style={styles.sliderBtnRow}>
              {[50, 100, 150, 200, 250, 500].map(g => (
                <Pressable
                  key={g}
                  style={[styles.sliderPresetBtn, customGrams === String(g) && styles.sliderPresetBtnActive]}
                  onPress={() => setCustomGrams(String(g))}
                >
                  <Text style={[styles.sliderPresetText, customGrams === String(g) && styles.sliderPresetTextActive]}>{g}g</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {servingMode === 'custom' && packWeightG > 0 && (
          <View style={styles.sliderWrap}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>{customPercent}%</Text>
              <Text style={styles.sliderSubLabel}>{Math.round(packWeightG * customPercent / 100)}g</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${customPercent}%` }]} />
            </View>
            <View style={styles.sliderBtnRow}>
              {[10, 25, 50, 75, 100].map(p => (
                <Pressable
                  key={p}
                  style={[styles.sliderPresetBtn, customPercent === p && styles.sliderPresetBtnActive]}
                  onPress={() => setCustomPercent(p)}
                >
                  <Text style={[styles.sliderPresetText, customPercent === p && styles.sliderPresetTextActive]}>{p}%</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Animated.View>

      {/* Main macros */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.macroCard}>
        <Text style={styles.cardTitle}>Nutrition Facts</Text>
        <View style={styles.calorieRow}>
          <Text style={styles.calorieValue}>{displayCals}</Text>
          <Text style={styles.calorieUnit}>kcal</Text>
        </View>
        <View style={styles.macroRow}>
          <MacroBar label="Protein" value={displayProtein} unit="g" color="#4ADE80" max={50} />
          <MacroBar label="Carbs" value={displayCarbs} unit="g" color="#FACC15" max={80} />
          <MacroBar label="Fat" value={displayFat} unit="g" color="#FB923C" max={40} />
        </View>
      </Animated.View>

      {/* Detailed nutrients */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.detailCard}>
        <Text style={styles.cardTitle}>Detailed Breakdown</Text>
        <NutrientRow label="Sugar" value={`${product.sugar}g`} warn={product.sugar > 12} />
        <NutrientRow label="Fiber" value={`${product.fiber}g`} good={product.fiber > 3} />
        <NutrientRow label="Saturated Fat" value={`${product.saturated_fat}g`} warn={product.saturated_fat > 5} />
        <NutrientRow label="Trans Fat" value={`${product.trans_fat}g`} warn={product.trans_fat > 0} />
        <NutrientRow label="Sodium" value={`${product.sodium_mg}mg`} warn={product.sodium_mg > 600} />
        <NutrientRow label="Cholesterol" value={`${product.cholesterol_mg}mg`} warn={product.cholesterol_mg > 60} />
      </Animated.View>

      {/* Concerns */}
      {(product.ingredients_concern.length > 0 || product.additives.length > 0) && (
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.concernCard}>
          <Text style={styles.cardTitle}>Concerns</Text>
          {product.ingredients_concern.map((c, i) => (
            <View key={`c-${i}`} style={styles.concernRow}>
              <Ionicons name="warning-outline" size={14} color="#FF6D00" />
              <Text style={styles.concernText}>{c}</Text>
            </View>
          ))}
          {product.additives.map((a, i) => (
            <View key={`a-${i}`} style={styles.concernRow}>
              <Ionicons name="flask-outline" size={14} color="#FFD600" />
              <Text style={styles.concernText}>{a}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      {/* Allergens */}
      {product.allergens.length > 0 && (
        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.allergenCard}>
          <Text style={styles.cardTitle}>Allergens</Text>
          <View style={styles.allergenRow}>
            {product.allergens.map((a, i) => (
              <View key={i} style={styles.allergenPill}>
                <Ionicons name="alert-circle" size={12} color="#FF1744" />
                <Text style={styles.allergenText}>{a}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Add to Macros */}
      <Animated.View entering={FadeInDown.delay(650).duration(400)} style={styles.addMacrosCard}>
        {macrosAdded ? (
          <View style={styles.macrosAddedWrap}>
            <Ionicons name="checkmark-circle" size={24} color="#4ADE80" />
            <Text style={styles.macrosAddedText}>Added to your food log!</Text>
          </View>
        ) : (
          <>
            <Text style={styles.cardTitle}>Add to Macros</Text>
            <Text style={styles.addMacrosSub}>Log this product to your daily food intake</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map(mt => (
                <Pressable
                  key={mt.key}
                  style={({ pressed }) => [styles.mealTypeBtn, { opacity: pressed || addingMacros ? 0.6 : 1 }]}
                  onPress={() => handleAddToMacros(mt.key)}
                  disabled={addingMacros}
                >
                  <Ionicons name={mt.icon as any} size={18} color="#fff" />
                  <Text style={styles.mealTypeBtnText}>{mt.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </Animated.View>

      {/* Scan again */}
      <Animated.View entering={FadeInDown.delay(700).duration(400)}>
        <Pressable style={styles.scanAgainBtn} onPress={onScanAgain}>
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.scanAgainText}>Scan Another Label</Text>
        </Pressable>
      </Animated.View>

      <View style={{ height: 100 }} />
    </>
  );
}

function MacroBar({ label, value, unit, color, max }: { label: string; value: number; unit: string; color: string; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={styles.macroBarWrap}>
      <Text style={styles.macroBarValue}>{value}{unit}</Text>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroBarLabel}>{label}</Text>
    </View>
  );
}

function NutrientRow({ label, value, warn, good }: { label: string; value: string; warn?: boolean; good?: boolean }) {
  return (
    <View style={styles.nutrientRow}>
      <Text style={styles.nutrientLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {warn && <Ionicons name="alert-circle" size={14} color="#FF6D00" />}
        {good && <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />}
        <Text style={[styles.nutrientValue, warn && { color: '#FF6D00' }, good && { color: '#4ADE80' }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020408' },
  cameraShell: { flex: 1, backgroundColor: '#000' },
  cameraView: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 44,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  cameraCloseBtn: {
    alignSelf: 'flex-end',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cameraGuideCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.34)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 16,
    marginTop: 24,
  },
  cameraGuideTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  cameraGuideText: { color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 20 },
  cameraBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cameraGalleryBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  cameraBottomSpacer: { width: 54, height: 54 },
  entryScroll: { flexGrow: 1, padding: 20, paddingTop: 72, paddingBottom: 120 },
  entryHero: { alignItems: 'center', marginBottom: 24 },
  entryIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.18)',
  },
  entryIconGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  entryTitle: { color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center' },
  entrySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 10,
    maxWidth: SW * 0.88,
  },
  entryCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  entryActionBtn: { borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  entryActionGrad: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 18 },
  entryActionPrimary: { color: '#081018', fontSize: 17, fontWeight: '900', marginTop: 8 },
  entryActionSecondary: { color: 'rgba(8,16,24,0.72)', fontSize: 13, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  entryGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 18,
  },
  entryGhostText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tipCard: {
    backgroundColor: 'rgba(103,232,249,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.14)',
    padding: 16,
    gap: 8,
  },
  tipTitle: { color: '#67E8F9', fontSize: 14, fontWeight: '800' },
  tipText: { color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 20 },
  resultContainer: { flex: 1 },
  resultScroll: { padding: 20, paddingTop: 60 },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  loadingTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16 },
  loadingSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6 },
  errorWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  errorText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center', marginTop: 14, marginBottom: 24 },
  labelFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(0,229,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    marginBottom: 12,
  },
  labelFallbackText: { color: '#67E8F9', fontSize: 14, fontWeight: '700' },
  productHeader: { alignItems: 'center', marginBottom: 20 },
  estimatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(250,204,21,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.25)',
    marginBottom: 14,
  },
  estimatePillText: { color: '#FACC15', fontSize: 12, fontWeight: '700' },
  labelReadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(103,232,249,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.25)',
    marginBottom: 14,
  },
  labelReadPillText: { color: '#67E8F9', fontSize: 12, fontWeight: '700' },
  healthBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    borderWidth: 1, marginBottom: 16,
  },
  healthLabel: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  productName: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  productBrand: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600', marginTop: 4 },
  servingSize: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6 },
  reasonCard: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, marginBottom: 16,
  },
  reasonText: { flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20 },
  labelHelpCard: {
    backgroundColor: 'rgba(103,232,249,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.18)',
    padding: 18,
    marginBottom: 16,
  },
  labelHelpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  labelHelpTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  labelHelpText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  labelHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#67E8F9',
    borderRadius: 14,
    paddingVertical: 13,
  },
  labelHelpBtnText: { color: '#081018', fontSize: 13, fontWeight: '800' },
  macroCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', padding: 20, marginBottom: 16,
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  calorieRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 20 },
  calorieValue: { color: '#fff', fontSize: 44, fontWeight: '900' },
  calorieUnit: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: 12 },
  macroBarWrap: { flex: 1, alignItems: 'center' },
  macroBarValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  macroBarTrack: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
  macroBarLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginTop: 6 },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', padding: 20, marginBottom: 16,
  },
  nutrientRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  nutrientLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  nutrientValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  concernCard: {
    backgroundColor: 'rgba(255,109,0,0.06)', borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,109,0,0.15)', padding: 20, marginBottom: 16,
  },
  concernRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  concernText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, flex: 1 },
  allergenCard: {
    backgroundColor: 'rgba(255,23,68,0.06)', borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,23,68,0.15)', padding: 20, marginBottom: 16,
  },
  allergenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergenPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,23,68,0.12)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,23,68,0.2)',
  },
  allergenText: { color: '#FF8A80', fontSize: 12, fontWeight: '600' },
  scanAgainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16,
    paddingVertical: 16, marginTop: 8, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  scanAgainText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  addMacrosCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.20)', padding: 20, marginBottom: 16,
  },
  addMacrosSub: {
    color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: -8, marginBottom: 14,
  },
  mealTypeRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  mealTypeBtn: {
    flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(74,222,128,0.12)', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
  },
  mealTypeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  macrosAddedWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 8,
  },
  macrosAddedText: { color: '#4ADE80', fontSize: 16, fontWeight: '700' },
  servingPickerCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)', padding: 20, marginBottom: 16,
  },
  servingBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  servingBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  servingBtnActive: {
    backgroundColor: 'rgba(0,229,255,0.15)',
    borderColor: 'rgba(0,229,255,0.40)',
  },
  servingBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700' },
  servingBtnTextActive: { color: '#00E5FF' },
  sliderWrap: { marginTop: 16 },
  sliderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sliderLabel: { color: '#00E5FF', fontSize: 20, fontWeight: '800' },
  sliderSubLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600', alignSelf: 'flex-end' },
  sliderTrack: {
    width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 12,
  },
  sliderFill: { height: '100%', borderRadius: 3, backgroundColor: '#00E5FF' },
  sliderBtnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  sliderPresetBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sliderPresetBtnActive: {
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderColor: 'rgba(0,229,255,0.30)',
  },
  sliderPresetText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' },
  sliderPresetTextActive: { color: '#00E5FF' },
});
