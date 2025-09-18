#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXPO_MODULES_CORE_MM_PATH = 'node_modules/expo-modules-core/ios/JSI/EXJSIUtils.mm';
const EXPO_MODULES_CORE_H_PATH = 'node_modules/expo-modules-core/ios/JSI/EXJSIUtils.h';

function patchEXJSIUtilsMM() {
  const filePath = EXPO_MODULES_CORE_MM_PATH;
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already patched
  if (content.includes('#import <react/bridging/CallbackWrapper.h>') && 
      content.includes('facebook::react::CallbackWrapper::createWeak')) {
    console.log('✅ EXJSIUtils.mm already patched');
    return true;
  }
  
  // Add the import after EventEmitter import
  if (!content.includes('#import <react/bridging/CallbackWrapper.h>')) {
    content = content.replace(
      '#import <ExpoModulesCore/EventEmitter.h>',
      '#import <ExpoModulesCore/EventEmitter.h>\n#import <react/bridging/CallbackWrapper.h>'
    );
  }
  
  // Add facebook:: namespace prefix to CallbackWrapper calls
  content = content.replace(
    /auto weakResolveWrapper = react::CallbackWrapper::createWeak/g,
    'auto weakResolveWrapper = facebook::react::CallbackWrapper::createWeak'
  );
  
  content = content.replace(
    /auto weakRejectWrapper = react::CallbackWrapper::createWeak/g,
    'auto weakRejectWrapper = facebook::react::CallbackWrapper::createWeak'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Patched EXJSIUtils.mm');
  return true;
}

function patchEXJSIUtilsH() {
  const filePath = EXPO_MODULES_CORE_H_PATH;
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already patched
  if (content.includes('#import <ReactCommon/CallInvoker.h>')) {
    console.log('✅ EXJSIUtils.h already patched');
    return true;
  }
  
  // Add the import after TurboModuleUtils import
  content = content.replace(
    '#import <ReactCommon/TurboModuleUtils.h>',
    '#import <ReactCommon/TurboModuleUtils.h>\n#import <ReactCommon/CallInvoker.h>'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Patched EXJSIUtils.h');
  return true;
}

function main() {
  console.log('🔧 Patching ExpoModulesCore...');
  
  const mmPatched = patchEXJSIUtilsMM();
  const hPatched = patchEXJSIUtilsH();
  
  if (mmPatched && hPatched) {
    console.log('✅ All ExpoModulesCore patches applied successfully');
  } else {
    console.log('❌ Some patches failed to apply');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { patchEXJSIUtilsMM, patchEXJSIUtilsH };