// NativeGestureCanvasProvider.mm
#import "NativeGestureCanvasProvider.h"
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>
#import "NativeGestureCanvas.h" // Our C++ module header

@implementation NativeGestureCanvasProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::static_pointer_cast<facebook::react::TurboModule>(
    std::make_shared<facebook::react::NativeGestureCanvas>(params.jsInvoker)
  );
}

@end
