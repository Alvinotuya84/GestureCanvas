#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>

@interface CanvasNativeView : UIView

@property (nonatomic, strong) UIImage *canvasImage;
- (void)updateWithBase64Image:(NSString *)base64String;

@end

@interface CanvasViewManager : RCTViewManager
@end
