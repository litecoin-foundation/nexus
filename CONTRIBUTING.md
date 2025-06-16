# Contributing to Nexus Wallet

Thank you for your interest in contributing to Nexus Wallet! This guide will help you get started with contributing to the Nexus Wallet for Litecoin app, built with React Native.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
  - [LNDltc Setup](#lndltc-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
  - [Asset Management](#asset-management)
  - [Internationalization](#internationalization)
- [Development Workflow](#development-workflow)
- [Submitting Changes](#submitting-changes)
- [Code Review Process](#code-review-process)
- [Additional Resources](#additional-resources)
  - [Troubleshooting](#troubleshooting)
  - [Build and Release Process](#build-and-release-process)
  - [Third-Party Service Integration](#third-party-service-integration)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following tools installed:

- **Node.js** v18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **Yarn** package manager
- **Xcode** (for iOS development on macOS)
- **Android Studio** (for Android development)
- **CocoaPods** (for iOS dependencies)
- **Git** for version control

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/nexus.git
   cd nexus
   ```

## Development Setup

### Initial Installation

```bash
# Install dependencies
yarn

# iOS-specific setup
yarn run fetch:ios    # Fetches iOS lndltc framework
yarn run pods         # Install iOS pods

# Android-specific setup
yarn run fetch:android # Fetches Android lndltc framework

# Start Metro bundler
yarn start
```

### Running the Application

```bash
# iOS
yarn ios

# Android
yarn android
```

### Development Tools

- **React Native DevTools**: For debugging the frontend
- **Xcode/Android Studio**: For native debugging

### LNDltc Setup

Nexus integrates with LNDltc as the Litecoin backend:

- **LND binaries** are automatically fetched via `yarn run fetch:ios` and `yarn run fetch:android`
- **Neutrino mode** is used for light client operation
- **LND data directory**: Located at `DocumentDirectoryPath/lndltc/`
- **Debug logs**: Available in the LND data directory for troubleshooting

## Project Structure

Nexus Wallet follows a well-organized React Native architecture:

```
nexus/
├── src/
│   ├── animations/          # Animation hooks and layouts
│   ├── assets/             # Static assets (images, icons, locales, fonts)
│   │   ├── icons/          # App icons and UI icons
│   │   ├── images/         # Image assets
│   │   └── locales/        # Translation files (15 languages)
│   ├── components/         # Reusable UI components
│   │   ├── Buttons/        # Button variants
│   │   ├── Cards/          # Feature cards (Buy, Send, Receive, etc.)
│   │   ├── Cells/          # List item components
│   │   ├── Modals/         # Modal dialog components
│   │   └── Numpad/         # Numeric input components
│   ├── context/           # React context providers
│   ├── lib/               # Utility libraries and type definitions
│   │   ├── typedef/        # TypeScript definitions for external libraries
│   │   └── utils/          # Utility functions
│   ├── navigation/        # Navigation stacks and routing
│   ├── reducers/          # Redux slices and state management
│   ├── screens/           # Screen components organized by feature
│   │   ├── Auth/          # Authentication screens
│   │   ├── Buy/           # Purchase-related screens
│   │   ├── Onboarding/    # Wallet setup screens
│   │   ├── Settings/      # Settings screens
│   │   └── Wallet/        # Dashboard screens
│   ├── store/             # Redux store configuration
│   ├── theme/             # Theme and styling utilities
│   └── utils/             # App-specific utilities
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
```

### Key Architecture Patterns

#### Technology Stack
- **React Native** with **TypeScript**
- **Redux Toolkit** for state management with **redux-persist**
- **React Navigation** for navigation
- **React Native Reanimated** for animations
- **i18next** for internationalization (15 languages)

#### Component Architecture
- **Feature-based organization**: Components grouped by functionality
- **Responsive design**: Uses `ScreenSizeContext` for device-specific layouts
- **TypeScript interfaces**: Strong typing for all component props
- **Reusable components**: Organized into logical subdirectories

## Coding Standards

### TypeScript Guidelines

#### Component Structure
```typescript
// Component interface
interface Props {
  value?: string;
  textKey?: string;
  onPress: () => void;
  disabled?: boolean;
}

// Component implementation
const ComponentName: React.FC<Props> = props => {
  const {value, onPress, disabled = false} = props;

  // Responsive design
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);

  // Event handlers
  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Text style={styles.text}>{value}</Text>
    </TouchableOpacity>
  );
};

// Dynamic styles based on screen dimensions
const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: screenWidth * 0.9,
      height: screenHeight * 0.055,
    },
    text: {
      fontSize: screenHeight * 0.02,
    },
  });

export default ComponentName;
```

#### Redux Patterns
```typescript
// Reducer slice structure
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {AppThunk} from './types';

interface IState {
  loading: boolean;
  data: string[];
  error: string | null;
}

const initialState: IState = {
  loading: false,
  data: [],
  error: null,
};

// Async thunk
export const fetchData = (): AppThunk => async dispatch => {
  try {
    dispatch(slice.actions.setLoading(true));
    // Async logic here
    dispatch(slice.actions.setData(result));
  } catch (error) {
    dispatch(slice.actions.setError(error.message));
  } finally {
    dispatch(slice.actions.setLoading(false));
  }
};

export const slice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setData: (state, action: PayloadAction<string[]>) => {
      state.data = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});
```

### Naming Conventions

#### Files and Directories
- **PascalCase** for component files: `BlueButton.tsx`
- **camelCase** for utility files: `config.ts`
- **kebab-case** for asset files: `back-arrow.png`
- **Feature-based grouping** for screens: `Settings/Settings.tsx`

#### Code Conventions
- **Props interface** always named `Props`
- **Screen dimensions** consistently named `SCREEN_WIDTH`, `SCREEN_HEIGHT`
- **Style functions** named `getStyles`
- **Event handlers** prefixed with `handle` or `on`

### Import Organization
```typescript
// React imports first
import React, {useState, useContext} from 'react';

// React Native imports
import {StyleSheet, View, Text} from 'react-native';

// Third-party libraries
import {useTranslation} from 'react-i18next';

// Local imports (components, utilities, etc.)
import {useAppDispatch} from '../../store/hooks';
import TranslateText from '../../components/TranslateText';
```

### Responsive Design

All components should use the responsive design system:

```typescript
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);

// Use percentage-based sizing
const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH * 0.9,
    paddingHorizontal: SCREEN_HEIGHT * 0.025,
    fontSize: SCREEN_HEIGHT * 0.02,
  },
});
```

### Internationalization

Use the translation system for all user-facing text:

```typescript
// Hook-based translation
const {t} = useTranslation('domainName');

// Component-based translation with responsive sizing
<TranslateText
  textKey="translation_key"
  domain="domainName"
  maxSizeInPixels={SCREEN_HEIGHT * 0.022}
  textStyle={styles.text}
  interpolationObj={{variable: value}}
/>
```

#### Adding New Translations

1. **Add translation keys** to appropriate domain files in `src/assets/locales/`
2. **Use descriptive keys**: `settings_language_selection` vs `langSel`
3. **Support interpolation**: `"welcome_message": "Welcome {{username}}!"`
4. **Test with different languages** to ensure UI layout works

#### Supported Languages
Currently supporting 15 languages: English (default), German, Spanish, Persian, French, Hindi, Indonesian, Italian, Lithuanian, Polish, Russian, Albanian, Tamil, Filipino, Chinese.

### Asset Management

#### Icons and Images
- **Multi-resolution**: Provide @1x, @2x, @3x variants for all images
- **Naming convention**: Use kebab-case (`back-arrow.png`)
- **Location**:
  - Icons: `src/assets/icons/`
  - Images: `src/assets/images/`
- **Format**: PNG preferred for icons, optimized for size

#### Fonts
- **Custom font**: Satoshi-Variable.ttf with italic variant
- **Usage**: Automatically applied via theme system
- **Weight variations**: Achieved through font-weight CSS property

## Development Workflow

### Branch Strategy

- **Main branch**: `master` (stable, production-ready code)
- **Feature branches**: `feature/feature-name` or descriptive names
- **Bug fixes**: `fix/bug-description` or `bugs` (team convention)
- **Development branches**: Used for experimental features

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add dark mode toggle to settings
fix: resolve crash when importing seed phrase
docs: update installation instructions
perf: optimize transaction list rendering
build: update dependencies
```

### Code Quality Tools

#### ESLint Configuration
```bash
# Run linting
yarn lint

# Auto-fix linting issues
yarn lint --fix
```

#### Pre-commit Hooks
The project uses **lefthook** for git hooks. Configuration in `lefthook.yml` includes:
- Code linting before commits
- Automated formatting checks

**Setup lefthook:**
```bash
# Install lefthook globally
npm install -g lefthook

# Initialize in project
lefthook install
```

#### Build Scripts
```bash
# iOS build preparation
yarn run fetch:ios && yarn run pods

# Android build preparation
yarn run fetch:android

# Clean and reset
yarn reset  # Clears node_modules and cache
```

## Submitting Changes

### Pull Request Process

1. **Create a feature branch** from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards

3. **Test your changes** thoroughly:
   ```bash
   yarn lint          # Check code style
   yarn ios           # Test on iOS
   yarn android       # Test on Android
   ```

4. **Commit your changes** with descriptive messages:
   ```bash
   git add .
   git commit -m "feat: implement feature description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** from your fork to the main repository

### Pull Request Guidelines

#### PR Title
Use conventional commit format:
- `feat: add new feature`
- `fix: resolve issue with component`
- `docs: update contributing guide`

#### PR Description
Include:
- **Summary** of changes made
- **Motivation** for the changes
- **Testing** performed
- **Screenshots** for UI changes
- **Breaking changes** if any

#### PR Template
```markdown
## Summary
Brief description of the changes

## Changes Made
- Added feature X
- Fixed issue Y
- Updated component Z

## Testing
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Linting passes
- [ ] No console errors

## Screenshots
(If applicable)

## Breaking Changes
(If any)
```

## Code Review Process

### Review Criteria

PRs will be reviewed for:

1. **Code Quality**
   - Follows TypeScript best practices
   - Proper error handling
   - Performance considerations

2. **Architecture Compliance**
   - Follows established patterns
   - Proper component organization
   - Correct Redux usage

3. **UI/UX Standards**
   - Responsive design implementation
   - Accessibility considerations
   - Consistent with design system

4. **Documentation**
   - Code is well-documented
   - README updates if needed
   - Breaking changes noted

### Review Timeline

- **Initial response**: Within 2-3 business days
- **Full review**: Within 1 week
- **Urgent fixes**: Within 24 hours

## Additional Resources

### Debugging

#### React Native Debugging
- Use **React Native DevTools** for component inspection & Redux State/ Actions

#### Native Debugging
- **iOS**: Use Xcode for native debugging
- **Android**: Use Android Studio for native debugging
- **LND logs**: Located in Nexus data directory

### Troubleshooting

#### LND Integration Issues
```bash
# Clear LND data directory (iOS Simulator)
rm -rf ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Documents/lndltc/

# View LND debug logs
# iOS: Use Xcode > Window > Devices and Simulators > Download Container
# Android: Use adb to pull app data directory
```

#### Build Errors

**iOS CocoaPods Issues:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
```

**Android Gradle Issues:**
```bash
cd android
./gradlew clean
rm -rf .gradle
./gradlew build
```

**React Native Cache Issues:**
```bash
yarn start --reset-cache
rm -rf node_modules && yarn
npx react-native-clean-project
```

#### Platform-Specific Troubleshooting

**iOS Signing Issues:**
- Verify Apple Developer account setup
- Check provisioning profiles in Xcode
- Ensure bundle identifier matches App Store Connect

**Android NDK Issues:**
- Verify NDK version 27.1.12297006 is installed
- Check `local.properties` file paths
- Ensure ANDROID_NDK_HOME environment variable is set

### Learning Resources

#### React Native
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

#### Redux
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Redux Hooks](https://react-redux.js.org/api/hooks)

#### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

#### Litecoin Development
- [LND Documentation](https://docs.lightning.engineering/)
- [Litecoin.info](https://litecoin.info)

### Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For general questions and community support
- **Code Reviews**: For learning and improving code quality

### Performance Considerations

- **Bundle size**: Monitor JavaScript bundle size
- **Memory usage**: Profile memory usage, especially for image handling
- **Animation performance**: Use `runOnJS` sparingly with Reanimated
- **List performance**: Use `FlatList` for large datasets

### Security Guidelines

- **Never commit** sensitive information (private keys, API keys)
- **Validate inputs** from external sources
- **Use secure storage** for sensitive data (Keychain/Keystore)
- **Follow** crypto best practices for key management

### Build and Release Process

#### Development vs Production

**Development Build:**
- Debug symbols included
- Console logs enabled
- React Native DevTools accessible
- Hot reload enabled

**Production Build:**
- Console logs removed (via `transform-remove-console` plugin)
- Minified and optimized
- Code signing required
- Debugging disabled

#### Release Preparation

**Version Management:**
```bash
# Update version in package.json
# Update version in android/app/build.gradle (versionName, versionCode)
# Update version in ios/Nexus/Info.plist (CFBundleShortVersionString, CFBundleVersion)
```

**iOS Release:**
```bash
# Archive and upload to App Store Connect
# Requires Apple Developer Program membership
# Code signing certificates must be configured
```

**Android Release:**
```bash
# Generate release APK/AAB
cd android
./gradlew assembleRelease  # or bundleRelease for AAB
```

### Third-Party Service Integration

#### Flexa SDK
- Payment processing integration
- Requires GitHub Package Registry credentials
- Used for merchant payments

#### MoonPay
- Fiat-to-crypto purchase integration
- Configured in buy flow

#### Firebase

---

## License

By contributing to Nexus Wallet, you agree that your contributions will be licensed under the GPLv3.

## Questions?

If you have any questions about contributing, please:
1. Check existing GitHub issues and discussions
2. Create a new issue for bugs or feature requests
3. Start a discussion for general questions

Thank you for helping make Nexus Wallet better for the Litecoin community!
