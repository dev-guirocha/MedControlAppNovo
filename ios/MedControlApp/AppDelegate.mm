#import "AppDelegate.h"

#import <Expo/ExpoReactNativeFactory.h>
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#elif __has_include("ExpoModulesCore-Swift.h")
#import "ExpoModulesCore-Swift.h"
#endif

#import <React/RCTLinkingManager.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

#if __has_include("MedControlApp-Swift.h")
#import "MedControlApp-Swift.h"
#elif __has_include(<MedControlApp/MedControlApp-Swift.h>)
#import <MedControlApp/MedControlApp-Swift.h>
#endif

@implementation AppDelegate {
  EXExpoAppDelegate *_expoAppDelegate;
  ReactNativeDelegate *_reactNativeDelegate;
  RCTReactNativeFactory *_reactNativeFactory;
}

- (BOOL)application:(UIApplication *)application willFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  _expoAppDelegate = [EXExpoAppDelegate new];
  return [_expoAppDelegate application:application willFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  _reactNativeDelegate = [ReactNativeDelegate new];
  _reactNativeDelegate.dependencyProvider = [RCTAppDependencyProvider new];
  _reactNativeFactory = [[EXReactNativeFactory alloc] initWithDelegate:_reactNativeDelegate];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  [_reactNativeFactory startReactNativeWithModuleName:@"main"
                                             inWindow:self.window
                                        launchOptions:launchOptions];

  return [_expoAppDelegate application:application didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [_expoAppDelegate application:application openURL:url options:options] ||
      [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  BOOL linkingHandled = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [_expoAppDelegate application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || linkingHandled;
}

- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)(void))completionHandler
{
  [_expoAppDelegate application:application handleEventsForBackgroundURLSession:identifier completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  [_expoAppDelegate application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [_expoAppDelegate application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [_expoAppDelegate application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end
