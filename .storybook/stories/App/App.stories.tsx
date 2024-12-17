import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react';

// import App from './App.tsx';
import Screens from './Screens';

const meta = {
  title: 'App',
  // component: App,
  component: Screens,
  argTypes: {
  },
  args: {
    activeComponent: 0,
  },
  decorators: [
    (Story) => (
      <View style={{flex: 1}}>
        <Story />
      </View>
    ),
  ],
  parameters: {
  },
} satisfies Meta<typeof Screens>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Header: Story = {};

export const PinModal: Story = {
  args: {
    activeComponent: 1,
  },
};

export const PlasmaModalPinModalContent: Story = {
  args: {
    activeComponent: 2,
  },
};
