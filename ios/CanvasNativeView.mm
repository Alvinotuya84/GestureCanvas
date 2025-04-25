#import "CanvasNativeView.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

@implementation CanvasNativeView {
    UIImageView *_imageView;
}

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        _imageView = [[UIImageView alloc] initWithFrame:self.bounds];
        _imageView.contentMode = UIViewContentModeScaleAspectFit;
        _imageView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
        [self addSubview:_imageView];
    }
    return self;
}

- (void)setCanvasImage:(UIImage *)canvasImage {
    _canvasImage = canvasImage;
    _imageView.image = canvasImage;
}

- (void)updateWithBase64Image:(NSString *)base64String {
    if (!base64String || [base64String length] == 0) {
        return;
    }
    
    // Extract the data part from data URL format
    NSString *dataString = base64String;
    if ([base64String hasPrefix:@"data:image"]) {
        NSRange range = [base64String rangeOfString:@"base64,"];
        if (range.location != NSNotFound) {
            dataString = [base64String substringFromIndex:range.location + range.length];
        }
    }
    
    NSData *imageData = [[NSData alloc] initWithBase64EncodedString:dataString options:NSDataBase64DecodingIgnoreUnknownCharacters];
    if (imageData) {
        UIImage *image = [UIImage imageWithData:imageData];
        if (image) {
            self.canvasImage = image;
        }
    }
}

@end

@implementation CanvasViewManager

RCT_EXPORT_MODULE(CanvasView)

- (UIView *)view {
    return [[CanvasNativeView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(canvasImage, UIImage)

RCT_EXPORT_METHOD(updateWithBase64Image:(nonnull NSNumber *)reactTag imageData:(NSString *)base64String) {
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        CanvasNativeView *view = (CanvasNativeView *)viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[CanvasNativeView class]]) {
            return;
        }
        [view updateWithBase64Image:base64String];
    }];
}

@end
