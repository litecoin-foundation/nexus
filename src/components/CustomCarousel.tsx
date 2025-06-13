import React, {useRef, forwardRef, useImperativeHandle} from 'react';
import {ScrollView, View} from 'react-native';

interface CustomCarouselProps {
  data: any[];
  renderItem: ({item, index}: {item: any; index: number}) => React.ReactElement;
  onSnapToItem?: (index: number) => void;
  width: number;
  height?: number;
}

export interface CustomCarouselRef {
  next: () => void;
  prev: () => void;
  scrollToIndex: (index: number) => void;
}

const CustomCarousel = forwardRef<CustomCarouselRef, CustomCarouselProps>(
  ({data, renderItem, onSnapToItem, width, height}, ref) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const currentIndexRef = useRef(0);

    useImperativeHandle(ref, () => ({
      next: () => {
        const nextIndex = Math.min(
          currentIndexRef.current + 1,
          data.length - 1,
        );
        scrollToIndex(nextIndex);
      },
      prev: () => {
        const prevIndex = Math.max(currentIndexRef.current - 1, 0);
        scrollToIndex(prevIndex);
      },
      scrollToIndex: (index: number) => {
        scrollToIndex(index);
      },
    }));

    const scrollToIndex = (index: number) => {
      if (scrollViewRef.current && index >= 0 && index < data.length) {
        scrollViewRef.current.scrollTo({
          x: index * width,
          animated: true,
        });
        currentIndexRef.current = index;
        onSnapToItem?.(index);
      }
    };

    const handleMomentumScrollEnd = (event: any) => {
      const contentOffset = event.nativeEvent.contentOffset;
      let index = Math.round(contentOffset.x / width);

      // Clamp index to valid bounds
      index = Math.max(0, Math.min(index, data.length - 1));

      if (index !== currentIndexRef.current) {
        currentIndexRef.current = index;
        onSnapToItem?.(index);
      }
    };

    const handleScrollEndDrag = (event: any) => {
      const contentOffset = event.nativeEvent.contentOffset;
      const currentPos = currentIndexRef.current * width;
      const diff = contentOffset.x - currentPos;

      let index = currentIndexRef.current;

      // If scrolled more than 25% of page width, move to next/prev page
      if (Math.abs(diff) > width * 0.25) {
        if (diff > 0) {
          index = Math.min(currentIndexRef.current + 1, data.length - 1);
        } else {
          index = Math.max(currentIndexRef.current - 1, 0);
        }
      }

      // Snap to the determined page
      scrollViewRef.current?.scrollTo({
        x: index * width,
        animated: true,
      });

      if (index !== currentIndexRef.current) {
        currentIndexRef.current = index;
        onSnapToItem?.(index);
      }
    };

    return (
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        style={{height}}>
        {data.map((item, index) => (
          <View key={index} style={{width}}>
            {renderItem({item, index})}
          </View>
        ))}
      </ScrollView>
    );
  },
);

CustomCarousel.displayName = 'CustomCarousel';

export default CustomCarousel;
