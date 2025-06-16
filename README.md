# Nexus Wallet for Litecoin

Pay, trade & grow with Litecoin. Nexus Wallet gives you low-fee sends, private Litecoin payments, Flexa checkout, 130 + local buy options — all in one tap.

### Dev Instructions

Building Nexus is simple. If your system is already configured for native mobile development, or for React Native development, builiding can be done in a few simple steps.

**Required Tools:**
- Node v22+ (via nvm)
- Yarn
- Xcode
- Android Studio
- Cocoapods for iOS

**Installation Instructions:**
```bash
$ git clone https://github.com/litecoin-foundation/nexus.git
$ cd nexus
$ yarn

# ios specific
$ yarn run fetch:ios # fetches ios lndltc framework
$ yarn run pods

# android specific
$ yarn run fetch:android # fetches android lndltc framework

$ yarn start
```

You should now be able to open up the project in Android Studio or Xcode and compile a binary.

### Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) if you are interested in contributing code to the Nexus Wallet codebase. More information about debugging is documented in CONTRIBUTING.md.
