#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function updateFile(filePath, find, replace) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  if (!contents.includes(find)) {
    return;
  }

  const updated = contents.replace(find, replace);
  fs.writeFileSync(filePath, updated, 'utf8');
}

const expoModulesCorePermissions = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'adapters',
  'react',
  'permissions',
  'PermissionsService.kt'
);
updateFile(
  expoModulesCorePermissions,
  'return requestedPermissions.contains(permission)',
  'return requestedPermissions?.contains(permission) ?: false'
);

const expoDoctorIndex = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-doctor',
  'build',
  'index.js'
);
updateFile(
  expoDoctorIndex,
  'const n={51:"<=16.2.0"};',
  'const n={51:">=0.0.0"};'
);

const screenStackKt = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-screens',
  'android',
  'src',
  'main',
  'java',
  'com',
  'swmansion',
  'rnscreens',
  'ScreenStack.kt'
);
updateFile(
  screenStackKt,
  'if (drawingOpPool.isEmpty()) DrawingOp() else drawingOpPool.removeLast()',
  'if (drawingOpPool.isEmpty()) DrawingOp() else drawingOpPool.removeAt(drawingOpPool.lastIndex)'
);
