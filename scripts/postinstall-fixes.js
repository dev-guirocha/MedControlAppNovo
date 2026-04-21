#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function ensureExpoModuleAtProjectRoot(moduleName) {
  const projectRoot = path.join(__dirname, '..');
  const rootModulePath = path.join(projectRoot, 'node_modules', moduleName);
  const nestedModulePath = path.join(projectRoot, 'node_modules', 'expo', 'node_modules', moduleName);
  const rootPackageJsonPath = path.join(rootModulePath, 'package.json');
  const nestedPackageJsonPath = path.join(nestedModulePath, 'package.json');

  if (fs.existsSync(rootPackageJsonPath) || !fs.existsSync(nestedPackageJsonPath)) {
    return;
  }

  try {
    if (fs.existsSync(rootModulePath)) {
      fs.rmSync(rootModulePath, { recursive: true, force: true });
    }

    const relativeTarget = path.relative(path.dirname(rootModulePath), nestedModulePath);
    fs.symlinkSync(relativeTarget, rootModulePath, 'dir');
  } catch (error) {
    console.warn(`Failed to symlink ${moduleName} at project root, falling back to copy:`, error);

    try {
      fs.rmSync(rootModulePath, { recursive: true, force: true });
      fs.cpSync(nestedModulePath, rootModulePath, { recursive: true });
    } catch (copyError) {
      console.warn(`Failed to restore ${moduleName} at project root:`, copyError);
    }
  }
}

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

ensureExpoModuleAtProjectRoot('expo-modules-core');

const expoModulesCoreIOSDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'ios'
);
const expoModulesCoreAndroidDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'android'
);

const expoJavaScriptRuntimeHeader = path.join(expoModulesCoreIOSDir, 'JSI', 'EXJavaScriptRuntime.h');
updateFile(
  expoJavaScriptRuntimeHeader,
  `#if __building_module(ExpoModulesCore)
typedef void (^RCTPromiseResolveBlock)(id result);
typedef void (^RCTPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);
#else
#import <React/RCTBridgeModule.h>
#if __has_include(<React/RCTCallInvoker.h>)
#import <React/RCTCallInvoker.h>
#else
#import <ReactCommon/CallInvoker.h>
#endif
#endif

#import <Foundation/Foundation.h>
#import <ExpoModulesJSI/EXJavaScriptValue.h>
#import <ExpoModulesJSI/EXJavaScriptObject.h>

#ifdef __cplusplus
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>

namespace facebook::react {
class RuntimeScheduler;
}
`,
  `#if __building_module(ExpoModulesCore) || __building_module(ExpoModulesJSI)
typedef void (^RCTPromiseResolveBlock)(id result);
typedef void (^RCTPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);
#else
#import <React/RCTBridgeModule.h>
#endif

#import <Foundation/Foundation.h>
#import <ExpoModulesJSI/EXJavaScriptValue.h>
#import <ExpoModulesJSI/EXJavaScriptObject.h>

#ifdef __cplusplus
#include <memory>

namespace facebook::react {
class CallInvoker;
class RuntimeScheduler;
}
`
);

const expoJSIConversionsHeader = path.join(expoModulesCoreIOSDir, 'JSI', 'EXJSIConversions.h');
updateFile(
  expoJSIConversionsHeader,
  `#import <Foundation/Foundation.h>

#import <jsi/jsi.h>

#import <React/RCTBridgeModule.h>
#import <ReactCommon/CallInvoker.h>

using namespace facebook;
using namespace react;
`,
  `#import <Foundation/Foundation.h>

#include <memory>
#include <vector>

#import <jsi/jsi.h>

#import <React/RCTBridgeModule.h>

namespace facebook::react {
class CallInvoker;
}

namespace jsi = facebook::jsi;
namespace react = facebook::react;
`
);
updateFile(
  expoJSIConversionsHeader,
  'std::shared_ptr<CallInvoker> jsInvoker',
  'std::shared_ptr<react::CallInvoker> jsInvoker'
);

const expoJSIUtilsHeader = path.join(expoModulesCoreIOSDir, 'JSI', 'EXJSIUtils.h');
updateFile(
  expoJSIUtilsHeader,
  `#import <functional>

#import <jsi/jsi.h>
#import <React/RCTBridgeModule.h>
#import <ReactCommon/TurboModuleUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <react/bridging/CallbackWrapper.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;
`,
  `#include <memory>

#import <jsi/jsi.h>
#import <React/RCTBridgeModule.h>

namespace facebook::react {
class CallInvoker;
class Promise;
class RuntimeScheduler;
}

namespace jsi = facebook::jsi;
namespace react = facebook::react;
`
);

const expoJSIConversionsImpl = path.join(expoModulesCoreIOSDir, 'JSI', 'EXJSIConversions.mm');
updateFile(
  expoJSIConversionsImpl,
  "#import <react/bridging/CallbackWrapper.h>\n",
  "#import <react/bridging/CallbackWrapper.h>\n#import <ReactCommon/CallInvoker.h>\n"
);
updateFile(
  expoJSIConversionsImpl,
  'std::shared_ptr<CallInvoker> jsInvoker',
  'std::shared_ptr<react::CallInvoker> jsInvoker'
);
updateFile(
  expoJSIConversionsImpl,
  'auto weakWrapper = CallbackWrapper::createWeak',
  'auto weakWrapper = react::CallbackWrapper::createWeak'
);
updateFile(
  expoJSIConversionsImpl,
  'react::react::CallbackWrapper::createWeak',
  'react::CallbackWrapper::createWeak'
);

const expoJSIUtilsImpl = path.join(expoModulesCoreIOSDir, 'JSI', 'EXJSIUtils.mm');
updateFile(
  expoJSIUtilsImpl,
  "#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>\n",
  "#import <ReactCommon/CallInvoker.h>\n#import <ReactCommon/TurboModuleUtils.h>\n#import <react/bridging/CallbackWrapper.h>\n#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>\n"
);
updateFile(
  expoJSIUtilsImpl,
  "#import <ReactCommon/CallInvoker.h>\n#import <ReactCommon/TurboModuleUtils.h>\n#import <ReactCommon/CallInvoker.h>\n#import <ReactCommon/TurboModuleUtils.h>\n",
  "#import <ReactCommon/CallInvoker.h>\n#import <ReactCommon/TurboModuleUtils.h>\n"
);
updateFile(
  expoJSIUtilsImpl,
  'std::shared_ptr<CallInvoker> jsInvoker, std::shared_ptr<Promise> promise',
  'std::shared_ptr<react::CallInvoker> jsInvoker, std::shared_ptr<react::Promise> promise'
);

const expoJavaScriptRuntimeImpl = path.join(expoModulesCoreIOSDir, 'JSI', 'EXJavaScriptRuntime.mm');
updateFile(
  expoJavaScriptRuntimeImpl,
  "#import <jsi/jsi.h>\n",
  "#import <jsi/jsi.h>\n#import <ReactCommon/TurboModuleUtils.h>\n#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>\n#import <react/renderer/runtimescheduler/RuntimeScheduler.h>\n"
);
updateFile(
  expoJavaScriptRuntimeImpl,
  'std::make_shared<RuntimeSchedulerCallInvoker>',
  'std::make_shared<react::RuntimeSchedulerCallInvoker>'
);
updateFile(
  expoJavaScriptRuntimeImpl,
  'std::shared_ptr<Promise> promise',
  'std::shared_ptr<react::Promise> promise'
);
updateFile(
  expoJavaScriptRuntimeImpl,
  'return createPromiseAsJSIValue(runtime, promiseSetup);',
  'return react::createPromiseAsJSIValue(runtime, promiseSetup);'
);
updateFile(
  expoJavaScriptRuntimeImpl,
  '_jsCallInvoker->invokeAsync(SchedulerPriority(priority), [block = std::move(block)]() {',
  '_jsCallInvoker->invokeAsync(react::SchedulerPriority(priority), [block = std::move(block)]() {'
);
updateFile(
  expoJavaScriptRuntimeImpl,
  '_jsCallInvoker->invokeAsync(react::SchedulerPriority(priority), [block = std::move(block)]() {',
  '_jsCallInvoker->invokeAsync(react::SchedulerPriority(priority), [block = std::move(block)](jsi::Runtime &) {'
);

const testingJSCallInvokerHeader = path.join(expoModulesCoreIOSDir, 'JSI', 'TestUtils', 'TestingJSCallInvoker.h');
updateFile(
  testingJSCallInvokerHeader,
  '      func();',
  '      func(*strongRuntime);'
);
updateFile(
  testingJSCallInvokerHeader,
  '    if (!runtime.lock()) {',
  '    auto strongRuntime = runtime.lock();\n    if (!strongRuntime) {'
);
updateFile(
  testingJSCallInvokerHeader,
  '    func();',
  '    func(*strongRuntime);'
);

const bridgelessJSCallInvokerHeader = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo',
  'node_modules',
  'expo-modules-core',
  'common',
  'cpp',
  'JSI',
  'BridgelessJSCallInvoker.h'
);
updateFile(
  bridgelessJSCallInvokerHeader,
  '    runtimeExecutor_([func = std::move(func)](jsi::Runtime &runtime) { func(); });',
  '    runtimeExecutor_([func = std::move(func)](jsi::Runtime &runtime) { func(runtime); });'
);

const expoSwiftUIViewPropsHeader = path.join(expoModulesCoreIOSDir, 'Core', 'Views', 'SwiftUI', 'SwiftUIViewProps.h');
updateFile(
  expoSwiftUIViewPropsHeader,
  'this->collapsableChildren = false;',
  'this->collapsable = false;'
);

const expoSwiftUIVirtualViewImpl = path.join(expoModulesCoreIOSDir, 'Core', 'Views', 'SwiftUI', 'SwiftUIVirtualViewObjC.mm');
updateFile(
  expoSwiftUIVirtualViewImpl,
  'facebook::react::facebook::react::EventQueue::UpdateMode::unstable_Immediate',
  'facebook::react::EventQueue::UpdateMode::unstable_Immediate'
);
updateFile(
  expoSwiftUIVirtualViewImpl,
  ', EventQueue::UpdateMode::unstable_Immediate',
  ', facebook::react::EventQueue::UpdateMode::unstable_Immediate'
);
updateFile(
  expoSwiftUIVirtualViewImpl,
  'ComponentName componentName = ComponentName { flavor->c_str() };',
  'react::ComponentName componentName = flavor->c_str();'
);
updateFile(
  expoSwiftUIVirtualViewImpl,
  'ComponentHandle componentHandle = reinterpret_cast<ComponentHandle>(componentName);',
  'react::ComponentHandle componentHandle = reinterpret_cast<react::ComponentHandle>(componentName);'
);
updateFile(
  expoSwiftUIVirtualViewImpl,
  'return ComponentDescriptorProvider {',
  'return react::ComponentDescriptorProvider {'
);
updateFile(
  expoSwiftUIVirtualViewImpl,
  'std::static_pointer_cast<const ViewProps>(props)',
  'std::static_pointer_cast<const react::ViewProps>(props)'
);
updateFile(
  expoSwiftUIVirtualViewImpl,
  'std::dynamic_pointer_cast<const ViewEventEmitter>(eventEmitter)',
  'std::dynamic_pointer_cast<const react::ViewEventEmitter>(eventEmitter)'
);

const rnfbAppModuleImpl = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-firebase',
  'app',
  'ios',
  'RNFBApp',
  'RNFBAppModule.m'
);
updateFile(
  rnfbAppModuleImpl,
  '#import <Firebase/Firebase.h>',
  '@import FirebaseCore;'
);

const rnfbStorageModuleImpl = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-firebase',
  'storage',
  'ios',
  'RNFBStorage',
  'RNFBStorageModule.m'
);
updateFile(
  rnfbStorageModuleImpl,
  '#import <Firebase/Firebase.h>',
  '@import FirebaseCore;\n@import FirebaseStorage;'
);
updateFile(
  rnfbStorageModuleImpl,
  '#import <FirebaseCore/FirebaseCore.h>\n#import <FirebaseStorage/FirebaseStorage.h>',
  '@import FirebaseCore;\n@import FirebaseStorage;'
);

const rnfbStorageCommonImpl = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-firebase',
  'storage',
  'ios',
  'RNFBStorage',
  'RNFBStorageCommon.m'
);
updateFile(
  rnfbStorageCommonImpl,
  '#import <Firebase/Firebase.h>',
  '@import FirebaseCore;\n@import FirebaseStorage;'
);
updateFile(
  rnfbStorageCommonImpl,
  '#import <FirebaseCore/FirebaseCore.h>\n#import <FirebaseStorage/FirebaseStorage.h>',
  '@import FirebaseCore;\n@import FirebaseStorage;'
);

const rnfbMessagingFiles = [
  ['RNFBMessaging+NSNotificationCenter.m'],
  ['RNFBMessaging+FIRMessagingDelegate.h'],
  ['RNFBMessagingSerializer.h'],
  ['RNFBMessaging+AppDelegate.m'],
  ['RNFBMessagingModule.m'],
];

for (const [filename] of rnfbMessagingFiles) {
  const filePath = path.join(
    __dirname,
    '..',
    'node_modules',
    '@react-native-firebase',
    'messaging',
    'ios',
    'RNFBMessaging',
    filename
  );
  updateFile(
    filePath,
    '#import <Firebase/Firebase.h>',
    '#import <FirebaseMessaging/FirebaseMessaging.h>'
  );
  updateFile(
    filePath,
    '@import FirebaseCore;\n@import FirebaseMessaging;',
    '#import <FirebaseMessaging/FirebaseMessaging.h>'
  );
}
updateFile(
  expoSwiftUIVirtualViewImpl,
  'std::static_pointer_cast<const ViewEventEmitter>(eventEmitter)',
  'std::static_pointer_cast<const react::ViewEventEmitter>(eventEmitter)'
);

const expoFabricViewObjCImpl = path.join(expoModulesCoreIOSDir, 'Fabric', 'ExpoFabricViewObjC.mm');
updateFile(
  expoFabricViewObjCImpl,
  'facebook::react::facebook::react::EventQueue::UpdateMode::unstable_Immediate',
  'facebook::react::EventQueue::UpdateMode::unstable_Immediate'
);
updateFile(
  expoFabricViewObjCImpl,
  ', EventQueue::UpdateMode::unstable_Immediate',
  ', facebook::react::EventQueue::UpdateMode::unstable_Immediate'
);

const expoViewShadowNodeCpp = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'common',
  'cpp',
  'fabric',
  'ExpoViewShadowNode.cpp'
);
updateFile(
  expoViewShadowNodeCpp,
  `  if (viewProps.collapsableChildren) {
    traits_.set(react::ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  } else {
    traits_.unset(react::ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  }

  if (YGNodeStyleGetDisplay(&yogaNode_) == YGDisplayContents) {
    auto it = viewProps.propsMap.find("disableForceFlatten");
    bool disableForceFlatten = (it != viewProps.propsMap.end()) ? it->second.getBool() : false;
    
    if (disableForceFlatten) {
      traits_.unset(react::ShadowNodeTraits::Trait::ForceFlattenView);
    }
  }
`,
  `  if (!viewProps.collapsable) {
    traits_.set(react::ShadowNodeTraits::Trait::FormsStackingContext);
  } else {
    traits_.unset(react::ShadowNodeTraits::Trait::FormsStackingContext);
  }
`
);

const expoViewComponentDescriptorCpp = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-modules-core',
  'common',
  'cpp',
  'fabric',
  'ExpoViewComponentDescriptor.cpp'
);
updateFile(
  expoViewComponentDescriptorCpp,
  'facebook::yoga::StyleLength::points',
  'facebook::yoga::StyleSizeLength::points'
);

const reactLifecycleDelegateKt = path.join(
  expoModulesCoreAndroidDir,
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'kotlin',
  'ReactLifecycleDelegate.kt'
);
updateFile(
  reactLifecycleDelegateKt,
  '  fun onUserLeaveHint(activity: Activity) {',
  '  override fun onUserLeaveHint(activity: Activity) {'
);

const expoDevMenuFabContentKt = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-dev-menu',
  'android',
  'src',
  'debug',
  'java',
  'expo',
  'modules',
  'devmenu',
  'fab',
  'FloatingActionButtonContent.kt'
);
updateFile(
  expoDevMenuFabContentKt,
  "import androidx.compose.foundation.background\n",
  "import androidx.compose.foundation.background\nimport androidx.compose.foundation.text.BasicText\n"
);
updateFile(
  expoDevMenuFabContentKt,
  "import com.composeunstyled.Text\n",
  ""
);
updateFile(
  expoDevMenuFabContentKt,
  `        Text(
          text = "Tools",
          color = Color.Black,
          fontSize = 11.sp,
          fontWeight = FontWeight.SemiBold
        )
`,
  `        BasicText(
          text = "Tools",
          style = androidx.compose.ui.text.TextStyle(
            color = Color.Black,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold
          )
        )
`
);

const expoDevLauncherProfileKt = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-dev-launcher',
  'android',
  'src',
  'debug',
  'java',
  'expo',
  'modules',
  'devlauncher',
  'compose',
  'routes',
  'Profile.kt'
);
updateFile(
  expoDevLauncherProfileKt,
  'import androidx.compose.ui.draw.dropShadow\n',
  'import androidx.compose.ui.draw.shadow\n'
);
updateFile(
  expoDevLauncherProfileKt,
  'import androidx.compose.ui.graphics.shadow.Shadow\n',
  ''
);
updateFile(
  expoDevLauncherProfileKt,
  'import androidx.compose.ui.unit.DpOffset\n',
  ''
);
updateFile(
  expoDevLauncherProfileKt,
  `        modifier = Modifier
          .size(44.dp)
          .dropShadow(
            shape = shape,
            shadow = Shadow(
              radius = 10.dp,
              offset = DpOffset(0.dp, 5.dp),
              color = Color.Black.copy(alpha = 0.05f)
            )
          )
          .dropShadow(
            shape = shape,
            shadow = Shadow(
              radius = 25.dp,
              offset = DpOffset(0.dp, 15.dp),
              color = Color.Black.copy(alpha = 0.12f)
            )
          )
          .background(
`,
  `        modifier = Modifier
          .size(44.dp)
          .shadow(
            elevation = 12.dp,
            shape = shape,
            ambientColor = Color.Black.copy(alpha = 0.08f),
            spotColor = Color.Black.copy(alpha = 0.12f)
          )
          .background(
`
);

const expoDevLauncherDateFormatKt = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-dev-launcher',
  'android',
  'src',
  'debug',
  'java',
  'expo',
  'modules',
  'devlauncher',
  'compose',
  'utils',
  'DateFormat.kt'
);
updateFile(
  expoDevLauncherDateFormatKt,
  `import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.format
import kotlinx.datetime.format.DateTimeComponents.Formats.ISO_DATE_TIME_OFFSET
import kotlinx.datetime.format.MonthNames
import kotlinx.datetime.toLocalDateTime
import kotlin.time.ExperimentalTime
`,
  `import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.util.Locale
`
);
updateFile(
  expoDevLauncherDateFormatKt,
  `object DateFormat {
  val updateDateFormat = LocalDateTime.Format {
    monthName(MonthNames.ENGLISH_ABBREVIATED)
    chars(" ")
    day()
    chars(", ")
    year()
    chars(", ")
    time(
      LocalTime.Format {
        amPmHour()
        chars(":")
        minute()
        amPmMarker("AM", "PM")
      }
    )
  }

  @OptIn(ExperimentalTime::class)
  fun formatUpdateDate(date: String?): String {
    return date ?.let {
      ISO_DATE_TIME_OFFSET
        .parse(it)
        .toInstantUsingOffset()
        .toLocalDateTime(TimeZone.currentSystemDefault())
        .format(updateDateFormat)
    } ?: "Unknown time"
  }
}
`,
  `object DateFormat {
  private val updateDateFormat =
    DateTimeFormatter.ofPattern("MMM d, yyyy, h:mma", Locale.ENGLISH)

  fun formatUpdateDate(date: String?): String {
    if (date == null) {
      return "Unknown time"
    }

    return try {
      OffsetDateTime.parse(date).format(updateDateFormat)
    } catch (_: DateTimeParseException) {
      "Unknown time"
    }
  }
}
`
);

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
updateFile(
  expoDoctorIndex,
  '"ios","android","plugins","icon","scheme","userInterfaceStyle"',
  '"ios","android","plugins","icon","userInterfaceStyle"'
);

const expoRouterSplashUtils = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-router',
  'build',
  'utils',
  'splash.js'
);
updateFile(
  expoRouterSplashUtils,
  'async function hideAsync() {\n    hide();\n}',
  'async function hideAsync() {\n    return;\n}'
);
updateFile(
  expoRouterSplashUtils,
  `async function preventAutoHideAsync() {
    if (!SplashModule) {
        return;
    }
    return SplashModule.preventAutoHideAsync();
}`,
  `async function preventAutoHideAsync() {
    return false;
}`
);
updateFile(
  expoRouterSplashUtils,
  `async function _internal_preventAutoHideAsync() {
    // The internal function might be missing if an app is using an older version of the SplashModule
    if (!SplashModule || !SplashModule.internalPreventAutoHideAsync) {
        return false;
    }
    if (!_initializedErrorHandler) {
        // Append error handling to ensure any uncaught exceptions result in the splash screen being hidden.
        // This prevents the splash screen from floating over error screens.
        if (ErrorUtils?.getGlobalHandler) {
            const originalHandler = ErrorUtils.getGlobalHandler();
            ErrorUtils.setGlobalHandler((error, isFatal) => {
                hide();
                originalHandler(error, isFatal);
            });
        }
        _initializedErrorHandler = true;
    }
    return SplashModule.internalPreventAutoHideAsync();
}`,
  `async function _internal_preventAutoHideAsync() {
    return false;
}`
);
updateFile(
  expoRouterSplashUtils,
  `async function _internal_maybeHideAsync() {
    // The internal function might be missing if an app is using an older version of the SplashModule
    if (!SplashModule || !SplashModule.internalMaybeHideAsync) {
        return false;
    }
    return SplashModule.internalMaybeHideAsync();
}`,
  `async function _internal_maybeHideAsync() {
    return false;
}`
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

const imageDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native',
  'Libraries',
  'Image'
);

const imageNativePath = path.join(imageDir, 'Image.native.js');
if (!fs.existsSync(imageNativePath)) {
  try {
    const shimContent = `const Platform = require('../Utilities/Platform');\n\nif (Platform.OS === 'android') {\n  module.exports = require('./Image.android');\n} else {\n  module.exports = require('./Image.ios');\n}`;
    fs.writeFileSync(imageNativePath, shimContent, 'utf8');
  } catch (error) {
    console.warn('Failed to create Image.native.js shim:', error);
  }
}
