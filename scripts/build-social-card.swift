// Native, code-generated brand card; no external images or fonts are downloaded.
import AppKit
let width=1200, height=630
let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:width,pixelsHigh:height,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current=NSGraphicsContext(bitmapImageRep:bitmap)
NSColor(calibratedRed:0.961,green:0.949,blue:0.922,alpha:1).setFill()
NSBezierPath(rect:NSRect(x:0,y:0,width:CGFloat(width),height:CGFloat(height))).fill()
let ink=NSColor(calibratedRed:0.141,green:0.141,blue:0.129,alpha:1)
let bronze=NSColor(calibratedRed:0.522,green:0.451,blue:0.369,alpha:1)
func draw(_ text:String,_ x:CGFloat,_ y:CGFloat,_ size:CGFloat,_ serif:Bool,_ color:NSColor){(text as NSString).draw(at:NSPoint(x:x,y:y),withAttributes:[.font:serif ? (NSFont(name:"Georgia",size:size) ?? NSFont.systemFont(ofSize:size)) : NSFont.systemFont(ofSize:size),.foregroundColor:color])}
draw("Founders & Builders",70,520,30,true,ink)
draw("Nothing great is ever",70,355,67,true,ink)
draw("built overnight.",70,268,67,true,ink)
draw("Or alone.",70,174,72,true,bronze)
draw("A living network for shared work.",73,74,24,false,ink)
bronze.setFill();NSBezierPath(ovalIn:NSRect(x:1040,y:75,width:20,height:20)).fill()
NSGraphicsContext.restoreGraphicsState()
let data=bitmap.representation(using:.png,properties:[:])!
try data.write(to:URL(fileURLWithPath:"social-card.png"))
print("Generated 1200 × 630 social-card.png")
