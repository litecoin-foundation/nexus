import React, {
  useState,
  useContext,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import {
  StyleSheet,
  RefreshControl,
  View,
  Pressable,
  Keyboard,
  Platform,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Svg, {Path} from 'react-native-svg';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

import {ErrorView} from './ErrorView';
import {EmptyView} from './EmptyView';
import {BrandCard} from './BrandCard';
import {SkeletonBrandCard} from './SkeletonBrandCard';
import {Brand, TilloCategory} from '../../services/giftcards';
import {useTranslation} from 'react-i18next';
import SearchBar from '../SearchBar';
import CategoryPickerModal, {
  formatCategoryLabel,
} from '../Modals/CategoryPickerModal';

import {useBrands} from './hooks';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface BrandGridProps {
  currency: string;
  onSelectBrand: (brand: Brand, initialAmount?: number) => void;
}

export function BrandGrid({currency, onSelectBrand}: BrandGridProps) {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);
  const {t} = useTranslation('nexusShop');

  const {data: brands, loading, error, refetch} = useBrands();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBrandSlug, setExpandedBrandSlug] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<TilloCategory | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const slideY = useSharedValue(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    // TripleSwitch height is 0.05 + some padding to cover things up
    const shiftUp = SCREEN_HEIGHT * 0.07;

    const showSub = Keyboard.addListener(showEvent, () => {
      slideY.value = withTiming(-shiftUp, {duration: 250});
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      slideY.value = withTiming(0, {duration: 250});
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [SCREEN_HEIGHT, slideY]);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{translateY: slideY.value}],
  }));

  const filterScale = useSharedValue(1);
  const filterAnimStyle = useAnimatedStyle(() => ({
    transform: [{scale: filterScale.value}],
  }));
  const onFilterPressIn = useCallback(() => {
    filterScale.value = withTiming(0.85, {duration: 100});
  }, [filterScale]);
  const onFilterPressOut = useCallback(() => {
    filterScale.value = withTiming(1, {duration: 100});
  }, [filterScale]);

  const filteredBrands = useMemo(() => {
    let base =
      brands && selectedCategory
        ? brands.filter(b => b.categories?.includes(selectedCategory))
        : brands;
    if (!base) return base;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      base = base.filter(b => b.name.toLowerCase().includes(q));
    }
    return [...base].sort(
      (a, b) => (b.priority ?? -Infinity) - (a.priority ?? -Infinity),
    );
  }, [brands, selectedCategory, searchQuery]);

  const handleCategorySelect = (category: TilloCategory | null) => {
    setSelectedCategory(category);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleToggleBrand = useCallback((brandSlug: string) => {
    setExpandedBrandSlug(prev => (prev === brandSlug ? null : brandSlug));
  }, []);

  const renderItem = useCallback(
    ({item}: {item: Brand}) => (
      <BrandCard
        brand={item}
        currency={currency}
        onSelectBrand={onSelectBrand}
        expandedBrandSlug={expandedBrandSlug}
        onToggleBrand={handleToggleBrand}
      />
    ),
    [currency, onSelectBrand, expandedBrandSlug, handleToggleBrand],
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <TranslateText
              textKey="available_gif_cards"
              domain="nexusShop"
              maxSizeInPixels={SCREEN_HEIGHT * 0.015}
              textStyle={styles.title}
            />
            <AnimatedPressable
              style={[styles.filterButton, filterAnimStyle]}
              onPress={() => setCategoryPickerVisible(true)}
              onPressIn={onFilterPressIn}
              onPressOut={onFilterPressOut}
              hitSlop={12}>
              {selectedCategory && (
                <TranslateText
                  textValue={formatCategoryLabel(selectedCategory)}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                  textStyle={styles.filterLabel}
                  numberOfLines={1}
                />
              )}
              <Svg
                width={SCREEN_HEIGHT * 0.0256}
                height={SCREEN_HEIGHT * 0.0256}
                viewBox="0 0 24 24"
                fill="none">
                <Path
                  d="M2 5h20"
                  stroke={selectedCategory ? '#1162E6' : '#2E2E2E'}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M6 12h12"
                  stroke={selectedCategory ? '#1162E6' : '#2E2E2E'}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M9 19h6"
                  stroke={selectedCategory ? '#1162E6' : '#2E2E2E'}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </AnimatedPressable>
          </View>
        </View>
        <CategoryPickerModal
          isVisible={categoryPickerVisible}
          close={() => setCategoryPickerVisible(false)}
          selectedCategory={selectedCategory}
          onSelect={handleCategorySelect}
        />
        <View style={styles.gridContainer}>
          <SkeletonBrandCard />
          <SkeletonBrandCard />
          <SkeletonBrandCard />
          <SkeletonBrandCard />
          <SkeletonBrandCard />
          <SkeletonBrandCard />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorView message={error} onRetry={refetch} onRetryText="Try Again" />
    );
  }

  if (!brands || brands.length === 0) {
    return <EmptyView message="No giftcards available in your country." />;
  }

  return (
    <Animated.View style={[styles.container, animatedSlideStyle]}>
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <TranslateText
            textKey="available_gif_cards"
            domain="nexusShop"
            maxSizeInPixels={SCREEN_HEIGHT * 0.015}
            textStyle={styles.title}
          />
          <AnimatedPressable
            style={[styles.filterButton, filterAnimStyle]}
            onPress={() => setCategoryPickerVisible(true)}
            onPressIn={onFilterPressIn}
            onPressOut={onFilterPressOut}
            hitSlop={12}>
            {selectedCategory && (
              <TranslateText
                textValue={formatCategoryLabel(selectedCategory)}
                maxSizeInPixels={SCREEN_HEIGHT * 0.015}
                textStyle={styles.filterLabel}
                numberOfLines={1}
              />
            )}
            <Svg
              width={SCREEN_HEIGHT * 0.0256}
              height={SCREEN_HEIGHT * 0.0256}
              viewBox="0 0 24 24"
              fill="none">
              <Path
                d="M2 5h20"
                stroke={selectedCategory ? '#1162E6' : '#2E2E2E'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M6 12h12"
                stroke={selectedCategory ? '#1162E6' : '#2E2E2E'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M9 19h6"
                stroke={selectedCategory ? '#1162E6' : '#2E2E2E'}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </AnimatedPressable>
        </View>
      </View>
      <CategoryPickerModal
        isVisible={categoryPickerVisible}
        close={() => setCategoryPickerVisible(false)}
        selectedCategory={selectedCategory}
        onSelect={handleCategorySelect}
      />
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('find_brand')}
          noShadow
          borderRadius={SCREEN_HEIGHT * 0.012}
        />
      </View>
      <FlashList
        data={filteredBrands}
        keyExtractor={item => item.slug}
        contentContainerStyle={styles.gridContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={renderItem}
        extraData={expandedBrandSlug}
      />
    </Animated.View>
  );
}

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      zIndex: 1,
      paddingTop: screenHeight * 0.01,
      backgroundColor: '#f7f7f7',
    },
    gridContainer: {
      paddingVertical: screenHeight * 0.008,
      paddingHorizontal: screenWidth * 0.03,
    },
    titleContainer: {
      height: screenHeight * 0.025,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: screenWidth * 0.06,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: screenWidth * 0.015,
      marginTop: screenHeight * 0.005 * -1,
    },
    filterLabel: {
      fontFamily: 'Satoshi Variable',
      fontWeight: '700',
      fontSize: screenHeight * 0.015,
      color: '#1162E6',
    },
    title: {
      height: '100%',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#2E2E2E',
      fontSize: screenHeight * 0.015,
      textTransform: 'uppercase',
    },
    searchContainer: {
      paddingVertical: screenHeight * 0.005,
      paddingHorizontal: screenWidth * 0.03,
    },
  });
