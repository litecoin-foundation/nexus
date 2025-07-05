import React, {useState, useEffect, useContext} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import Header from '../../components/Header';
import {ScreenSizeContext} from '../../context/screenSize';
import {fetchCollectionsWithProducts, CategoryWithProducts, Product} from '../../services/shopify';

type RootStackParamList = {
  Products: undefined;
};

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Products'>;
  route: RouteProp<RootStackParamList, 'Products'>;
}

const Products: React.FC<Props> = props => {
  const {navigation} = props;
  const insets = useSafeAreaInsets();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await fetchCollectionsWithProducts(10);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert(
        'Error',
        'Failed to load products. Please check your internet connection and try again.',
        [
          {
            text: 'OK',
            style: 'default',
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const formatPrice = (price: string, currencyCode: string) => {
    const formattedPrice = parseFloat(price).toFixed(2);
    return `${formattedPrice} ${currencyCode}`;
  };

  const renderProduct = (product: Product) => {
    const imageUrl = product.images.edges[0]?.node?.url;
    const price = product.variants.edges[0]?.node?.price;

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => {
          // TODO: Navigate to product details or open product URL
          console.log('Product pressed:', product.title);
        }}>
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image source={{uri: imageUrl}} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          {product.description ? (
            <Text style={styles.productDescription} numberOfLines={3}>
              {product.description.replace(/<[^>]*>/g, '')}
            </Text>
          ) : null}
          {price && (
            <Text style={styles.productPrice}>
              {formatPrice(price.amount, price.currencyCode)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = (category: CategoryWithProducts) => {
    return (
      <View key={category.collection.id} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category.collection.title}</Text>
        {category.collection.description ? (
          <Text style={styles.categoryDescription}>
            {category.collection.description}
          </Text>
        ) : null}
        <View style={styles.productsContainer}>
          {category.products.map(renderProduct)}
        </View>
      </View>
    );
  };

  return (
    <>
      <Header
        title="Products"
        onBackPress={() => navigation.goBack()}
        showBackButton
      />
      <LinearGradient
        colors={['#2C72FF', '#8BB8FF']}
        style={[styles.container, {paddingBottom: insets.bottom}]}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fff"
            />
          }>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products available</Text>
            </View>
          ) : (
            <>
              {categories.map(renderCategory)}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </>
  );
};

const getStyles = (screenWidth: number, _screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    scrollContainer: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
    },
    loadingText: {
      color: '#fff',
      fontSize: 16,
      marginTop: 10,
      fontFamily: 'Satoshi Variable',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
    },
    emptyText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: 'Satoshi Variable',
    },
    categorySection: {
      marginBottom: 30,
    },
    categoryTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 8,
      fontFamily: 'Satoshi Variable',
    },
    categoryDescription: {
      fontSize: 14,
      color: '#E0E0E0',
      marginBottom: 16,
      fontFamily: 'Satoshi Variable',
      lineHeight: 20,
    },
    productsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    productCard: {
      width: screenWidth * 0.43,
      backgroundColor: '#fff',
      borderRadius: 12,
      marginBottom: 20,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    productImageContainer: {
      width: '100%',
      height: screenWidth * 0.35,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      overflow: 'hidden',
    },
    productImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    placeholderImage: {
      width: '100%',
      height: '100%',
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      color: '#999',
      fontSize: 14,
      fontFamily: 'Satoshi Variable',
    },
    productInfo: {
      padding: 12,
    },
    productTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 6,
      fontFamily: 'Satoshi Variable',
    },
    productDescription: {
      fontSize: 12,
      color: '#666',
      lineHeight: 16,
      marginBottom: 8,
      fontFamily: 'Satoshi Variable',
    },
    productPrice: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#2C72FF',
      fontFamily: 'Satoshi Variable',
    },
  });

export default Products;
