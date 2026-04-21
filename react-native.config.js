// Explicit RN config to help autolinking detect the Android package name on RN 0.76
// See: https://reactnative.dev/docs/native-modules-android#autolinking and RN Gradle plugin autolinking
module.exports = {
  project: {
    android: {
      // Must match applicationId in android/app/build.gradle and package in AndroidManifest
      packageName: 'dev.guirocha.MedControlApp',
    },
  },
  dependencies: {
    '@react-native-firebase/app': {
      platforms: {
        ios: null,
      },
    },
    '@react-native-firebase/messaging': {
      platforms: {
        ios: null,
      },
    },
    '@react-native-firebase/storage': {
      platforms: {
        ios: null,
      },
    },
  },
};
