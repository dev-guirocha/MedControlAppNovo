#import <UIKit/UIKit.h>

#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#elif __has_include("ExpoModulesCore-Swift.h")
#import "ExpoModulesCore-Swift.h"
#endif

#if __has_include(<Expo/Expo-Swift.h>)
#import <Expo/Expo-Swift.h>
#else
#import "Expo-Swift.h"
#endif

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong) UIWindow *window;

@end
