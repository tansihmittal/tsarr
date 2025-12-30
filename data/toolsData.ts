export interface ToolData {
  slug: string;
  title: string;
  shortDesc: string;
  description: string;
  longDescription: string;
  metaDescription: string;
  href: string;
  category: string;
  features: string[];
  useCases: string[];
  keywords: string[];
}

export const toolsData: ToolData[] = [
  {
    slug: "screenshot-editor",
    title: "Screenshot Editor",
    shortDesc: "Frames, backgrounds, annotations",
    description: "Transform screenshots with professional frames, custom backgrounds, and annotations. Perfect for documentation, tutorials, and social media.",
    longDescription: "The Screenshot Editor is a powerful tool for transforming ordinary screenshots into polished, professional visuals. Add macOS, Windows, or browser-style frames to give your screenshots context. Choose from beautiful gradient backgrounds or use solid colors. Add annotations like arrows, shapes, text, and blur effects to highlight important areas. Export in multiple formats including PNG, SVG, JPEG, and WebP at up to 4x resolution for crisp, high-quality output.",
    metaDescription: "Free online screenshot editor with frames, backgrounds, and annotations. Transform screenshots into professional visuals. No login required.",
    href: "/editor",
    category: "Image Editing",
    features: [
      "macOS, Windows, and browser-style frames",
      "Custom gradient and solid color backgrounds",
      "Annotations: arrows, shapes, text, blur, highlights",
      "Adjustable padding, shadows, and border radius",
      "Export to PNG, SVG, JPEG, WebP at up to 4x resolution",
      "Paste directly from clipboard",
      "No watermarks, completely free"
    ],
    useCases: [
      "Creating documentation and tutorials",
      "Social media posts and marketing materials",
      "Bug reports and issue tracking",
      "Product demos and presentations",
      "Blog posts and articles",
      "App store screenshots"
    ],
    keywords: ["screenshot editor", "screenshot tool", "image frames", "screenshot beautifier", "screenshot maker", "free screenshot editor"]
  },
  {
    slug: "code-screenshots",
    title: "Code Screenshots",
    shortDesc: "Syntax highlighting, 20+ themes",
    description: "Create beautiful code images with syntax highlighting. Support for 20+ themes and all major programming languages.",
    longDescription: "Create stunning code screenshots with professional syntax highlighting. Choose from over 20 carefully crafted themes including popular options like Dracula, One Dark, GitHub, and more. Support for all major programming languages ensures your code looks perfect. Add window chrome for that authentic IDE look, customize fonts, and export at high resolution for sharing on social media, documentation, or presentations.",
    metaDescription: "Create beautiful code screenshots with syntax highlighting. 20+ themes, all languages supported. Free online tool, no login required.",
    href: "/code",
    category: "Image Editing",
    features: [
      "20+ syntax highlighting themes",
      "Support for all major programming languages",
      "Customizable window chrome and title bar",
      "Line numbers and line highlighting",
      "Custom fonts and font sizes",
      "Adjustable padding and background",
      "High-resolution export options"
    ],
    useCases: [
      "Sharing code snippets on social media",
      "Technical blog posts and tutorials",
      "Documentation and README files",
      "Presentations and slides",
      "Code reviews and discussions",
      "Educational content"
    ],
    keywords: ["code screenshot", "code to image", "syntax highlighting", "code beautifier", "carbon alternative", "code snippet image"]
  },
  {
    slug: "text-behind-image",
    title: "Text Behind Image",
    shortDesc: "AI background removal effects",
    description: "Create depth effects with AI-powered background removal. Place text behind subjects for stunning visual compositions.",
    longDescription: "Create eye-catching visuals with the Text Behind Image effect. Using AI-powered background removal, this tool automatically separates the subject from the background, allowing you to place text between layers for a stunning depth effect. Perfect for social media graphics, posters, and marketing materials. Customize typography, colors, and positioning to create unique compositions that stand out.",
    metaDescription: "Create text behind image effects with AI background removal. Free online tool for stunning visual compositions. No login required.",
    href: "/text-behind-image",
    category: "Image Editing",
    features: [
      "AI-powered automatic background removal",
      "Place text between foreground and background layers",
      "Customizable typography and fonts",
      "Adjustable text positioning and size",
      "Multiple text layers support",
      "High-resolution export",
      "Works with any image"
    ],
    useCases: [
      "Social media graphics and posts",
      "Marketing materials and ads",
      "Posters and flyers",
      "YouTube thumbnails",
      "Album covers and artwork",
      "Personal branding content"
    ],
    keywords: ["text behind image", "background removal", "depth effect", "text effect", "AI background remover", "layered text"]
  },
  {
    slug: "video-captions",
    title: "Video Captions",
    shortDesc: "Auto-transcription, subtitles",
    description: "Add stylish captions and subtitles to videos with automatic transcription. Multiple caption styles and animations.",
    longDescription: "Add professional captions and subtitles to your videos with ease. The Video Captions tool features automatic transcription powered by AI, so you can generate captions from speech automatically. Choose from multiple caption styles, customize fonts and colors, and position captions exactly where you want them. Export videos with burned-in captions or download SRT files for use in other applications.",
    metaDescription: "Add captions and subtitles to videos with auto-transcription. Multiple styles, custom fonts. Free online video caption tool.",
    href: "/captions",
    category: "Video",
    features: [
      "AI-powered automatic transcription",
      "Multiple caption styles and templates",
      "Customizable fonts, colors, and sizes",
      "Precise timing controls",
      "Word-by-word highlighting option",
      "SRT/VTT export for subtitles",
      "Burn captions directly into video"
    ],
    useCases: [
      "Social media video content",
      "YouTube videos and shorts",
      "Educational and training videos",
      "Podcast video clips",
      "Marketing and promotional videos",
      "Accessibility compliance"
    ],
    keywords: ["video captions", "subtitle generator", "auto transcription", "add subtitles", "caption maker", "video subtitles"]
  },
  {
    slug: "tweet-editor",
    title: "Tweet Editor",
    shortDesc: "Tweet screenshots",
    description: "Design tweet screenshots for social media. Customize appearance, add verification badges, and more.",
    longDescription: "Create realistic tweet screenshots for social media, presentations, and content creation. Customize every aspect including profile pictures, usernames, verification badges, and engagement metrics. Choose between light and dark modes, adjust styling, and export high-quality images. Perfect for creating mockups, educational content, or sharing memorable tweets.",
    metaDescription: "Create tweet screenshots with custom profiles and verification badges. Free online tweet maker tool. No login required.",
    href: "/tweet",
    category: "Social Media",
    features: [
      "Customizable profile picture and username",
      "Verification badge options",
      "Editable engagement metrics",
      "Light and dark mode themes",
      "Custom tweet content and formatting",
      "Timestamp customization",
      "High-resolution export"
    ],
    useCases: [
      "Social media content creation",
      "Presentations and slides",
      "Educational materials",
      "Marketing mockups",
      "Meme creation",
      "Portfolio showcases"
    ],
    keywords: ["tweet screenshot", "fake tweet generator", "tweet maker", "twitter screenshot", "tweet mockup", "social media mockup"]
  },
  {
    slug: "carousel-editor",
    title: "Carousel Editor",
    shortDesc: "Multi-slide carousels",
    description: "Create multi-slide carousels for Instagram, LinkedIn, and other platforms. Professional templates included.",
    longDescription: "Design engaging multi-slide carousels for Instagram, LinkedIn, and other social platforms. Start with professional templates or create from scratch. Add text, images, and graphics to each slide. Maintain consistent branding across all slides with shared styles and colors. Export individual slides or batch download all at once in the perfect dimensions for each platform.",
    metaDescription: "Create social media carousels for Instagram and LinkedIn. Professional templates, easy editing. Free online carousel maker.",
    href: "/carousel",
    category: "Social Media",
    features: [
      "Multiple slide support",
      "Professional templates",
      "Custom branding and colors",
      "Text and image layers",
      "Platform-specific dimensions",
      "Batch export all slides",
      "Drag and drop reordering"
    ],
    useCases: [
      "Instagram carousel posts",
      "LinkedIn document posts",
      "Educational slide content",
      "Product showcases",
      "Step-by-step tutorials",
      "Portfolio presentations"
    ],
    keywords: ["carousel maker", "instagram carousel", "linkedin carousel", "social media slides", "carousel creator", "slide maker"]
  },
  {
    slug: "aspect-ratio-converter",
    title: "Aspect Ratio Converter",
    shortDesc: "Convert aspect ratios",
    description: "Convert images to any aspect ratio with smart cropping. Presets for all social media platforms.",
    longDescription: "Quickly convert images to any aspect ratio with intelligent cropping. Choose from presets optimized for Instagram, Twitter, Facebook, YouTube, and more, or enter custom dimensions. The smart crop feature automatically focuses on the most important part of your image. Preview changes in real-time and export in high quality.",
    metaDescription: "Convert images to any aspect ratio with smart cropping. Presets for all social media platforms. Free online tool.",
    href: "/aspect-ratio",
    category: "Image Conversion",
    features: [
      "Presets for all major social platforms",
      "Custom aspect ratio input",
      "Smart crop with focal point detection",
      "Real-time preview",
      "Batch processing support",
      "High-quality output",
      "Multiple export formats"
    ],
    useCases: [
      "Social media image optimization",
      "Website and blog images",
      "Print preparation",
      "Video thumbnail creation",
      "Profile picture cropping",
      "Banner and header images"
    ],
    keywords: ["aspect ratio converter", "image cropper", "resize image", "crop tool", "social media image size", "image dimensions"]
  },
  {
    slug: "image-resizer",
    title: "Image Resizer",
    shortDesc: "Resize by dimensions",
    description: "Resize images by exact dimensions or percentage. Maintain aspect ratio or stretch to fit.",
    longDescription: "Resize images to exact dimensions or by percentage with precision control. Choose to maintain the original aspect ratio or stretch to fit specific dimensions. Preview changes before exporting and choose from multiple output formats. Perfect for preparing images for websites, social media, or print.",
    metaDescription: "Resize images by exact dimensions or percentage. Maintain aspect ratio or stretch. Free online image resizer tool.",
    href: "/resize",
    category: "Image Conversion",
    features: [
      "Resize by exact pixel dimensions",
      "Resize by percentage",
      "Maintain or ignore aspect ratio",
      "Quality control slider",
      "Real-time preview",
      "Multiple output formats",
      "Batch resizing support"
    ],
    useCases: [
      "Website image optimization",
      "Email attachment size reduction",
      "Social media image preparation",
      "Print-ready image sizing",
      "Thumbnail generation",
      "Bulk image processing"
    ],
    keywords: ["image resizer", "resize image", "reduce image size", "image dimensions", "scale image", "photo resizer"]
  },
  {
    slug: "image-converter",
    title: "Image Converter",
    shortDesc: "PNG, JPG, WebP, AVIF",
    description: "Convert between PNG, JPEG, WebP, AVIF, GIF, BMP, and ICO formats with quality control.",
    longDescription: "Convert images between all popular formats including PNG, JPEG, WebP, AVIF, GIF, BMP, and ICO. Adjust quality settings to balance file size and image quality. Strip metadata for privacy or preserve it as needed. Process multiple images at once with batch conversion.",
    metaDescription: "Convert images between PNG, JPEG, WebP, AVIF, GIF, BMP, ICO. Quality control, batch processing. Free online converter.",
    href: "/convert",
    category: "Image Conversion",
    features: [
      "Support for 7+ image formats",
      "Quality control slider",
      "Metadata strip option",
      "Batch conversion",
      "File size preview",
      "Drag and drop upload",
      "Fast processing"
    ],
    useCases: [
      "Converting images for web optimization",
      "Creating WebP versions for faster loading",
      "Converting screenshots to different formats",
      "Preparing images for specific platforms",
      "Reducing file sizes for email",
      "Creating favicon ICO files"
    ],
    keywords: ["image converter", "convert png to jpg", "webp converter", "avif converter", "image format converter", "photo converter"]
  },
  {
    slug: "clipboard-saver",
    title: "Clipboard Saver",
    shortDesc: "Paste and download",
    description: "Paste images directly from clipboard and download in any format. Quick and simple.",
    longDescription: "The fastest way to save images from your clipboard. Simply paste (Ctrl+V or Cmd+V) and your image appears instantly. Choose your preferred format and download immediately. Perfect for quickly saving screenshots, copied images, or any visual content from your clipboard.",
    metaDescription: "Paste images from clipboard and download in any format. Quick and simple clipboard to image tool. Free, no login required.",
    href: "/clipboard",
    category: "Utilities",
    features: [
      "Instant paste from clipboard",
      "Multiple export formats",
      "One-click download",
      "No upload required",
      "Works with any copied image",
      "Fast and lightweight",
      "Privacy-focused (local processing)"
    ],
    useCases: [
      "Saving screenshots quickly",
      "Converting clipboard images",
      "Extracting images from documents",
      "Quick image format conversion",
      "Saving images from web pages",
      "Rapid workflow integration"
    ],
    keywords: ["clipboard to image", "paste image", "save clipboard", "screenshot saver", "clipboard download", "paste and save"]
  },
  {
    slug: "video-converter",
    title: "Video Converter",
    shortDesc: "MP4, WebM, GIF",
    description: "Convert videos to MP4, WebM, AVI, MOV, and GIF with custom settings for quality and size.",
    longDescription: "Convert videos between popular formats including MP4, WebM, AVI, MOV, and GIF. Adjust quality settings, resolution, and frame rate to optimize for your needs. Extract audio tracks or create GIFs from video clips. All processing happens in your browser for privacy and speed.",
    metaDescription: "Convert videos to MP4, WebM, AVI, MOV, GIF. Adjust quality and resolution. Free online video converter, no upload required.",
    href: "/video-convert",
    category: "Video",
    features: [
      "Support for 5+ video formats",
      "Quality and resolution control",
      "Frame rate adjustment",
      "Audio extraction option",
      "Video to GIF conversion",
      "Trim and cut clips",
      "Browser-based processing"
    ],
    useCases: [
      "Converting videos for web playback",
      "Creating GIFs from video clips",
      "Reducing video file sizes",
      "Extracting audio from videos",
      "Format compatibility conversion",
      "Social media video preparation"
    ],
    keywords: ["video converter", "convert mp4", "video to gif", "webm converter", "video format converter", "online video converter"]
  },
  {
    slug: "chart-maker",
    title: "Chart Maker",
    shortDesc: "Bar, line, pie charts",
    description: "Create bar, line, pie, and other charts for presentations. Export as images or SVG.",
    longDescription: "Create professional charts and graphs for presentations, reports, and documents. Choose from bar charts, line charts, pie charts, and more. Customize colors, labels, and styling to match your brand. Import data directly or enter manually. Export as high-resolution images or scalable SVG files.",
    metaDescription: "Create bar, line, pie charts for presentations. Custom colors, data import, SVG export. Free online chart maker tool.",
    href: "/chart",
    category: "Data Visualization",
    features: [
      "Multiple chart types (bar, line, pie, etc.)",
      "Custom colors and styling",
      "Data import from CSV",
      "Manual data entry",
      "Legend and label customization",
      "SVG and PNG export",
      "Responsive design"
    ],
    useCases: [
      "Business presentations",
      "Reports and documents",
      "Blog posts and articles",
      "Social media infographics",
      "Educational materials",
      "Data storytelling"
    ],
    keywords: ["chart maker", "graph creator", "bar chart", "pie chart", "line chart", "data visualization", "chart generator"]
  },
  {
    slug: "map-maker",
    title: "Map Maker",
    shortDesc: "Choropleth, bubble maps",
    description: "Create choropleth, bubble, marker, and flow maps. Visualize geographic data beautifully.",
    longDescription: "Visualize geographic data with beautiful, customizable maps. Create choropleth maps to show data density, bubble maps for point data, marker maps for locations, and flow maps for movement patterns. Import your data, customize colors and styling, and export high-resolution images for presentations and reports.",
    metaDescription: "Create choropleth, bubble, marker, and flow maps. Visualize geographic data beautifully. Free online map maker tool.",
    href: "/map",
    category: "Data Visualization",
    features: [
      "Multiple map types (choropleth, bubble, marker, flow)",
      "Custom color scales",
      "Data import support",
      "Interactive preview",
      "Country and region selection",
      "High-resolution export",
      "Legend customization"
    ],
    useCases: [
      "Geographic data visualization",
      "Business analytics presentations",
      "Research and academic papers",
      "News and journalism graphics",
      "Marketing territory maps",
      "Travel and location content"
    ],
    keywords: ["map maker", "choropleth map", "data map", "geographic visualization", "map creator", "bubble map"]
  },
  {
    slug: "3d-globe",
    title: "3D Globe",
    shortDesc: "Globe visualizations",
    description: "Create interactive 3D globe visualizations with points, arcs, and custom styling.",
    longDescription: "Create stunning 3D globe visualizations for presentations and data storytelling. Add points to mark locations, draw arcs to show connections between places, and customize the globe's appearance with different textures and colors. Perfect for showing global data, travel routes, or international connections.",
    metaDescription: "Create 3D globe visualizations with points and arcs. Interactive, customizable. Free online globe maker tool.",
    href: "/globe",
    category: "Data Visualization",
    features: [
      "Interactive 3D globe rendering",
      "Add points and markers",
      "Draw arcs between locations",
      "Custom globe textures",
      "Color and style customization",
      "Animation support",
      "High-resolution export"
    ],
    useCases: [
      "Global data visualization",
      "Travel route mapping",
      "International business presentations",
      "Network and connection visualization",
      "Educational geography content",
      "Portfolio and creative projects"
    ],
    keywords: ["3d globe", "globe visualization", "world map 3d", "interactive globe", "globe maker", "earth visualization"]
  },
  {
    slug: "polaroid-generator",
    title: "Polaroid Generator",
    shortDesc: "Vintage photo effects",
    description: "Transform images into vintage polaroid-style photos with customizable captions and effects.",
    longDescription: "Give your photos a nostalgic, vintage feel with the Polaroid Generator. Transform any image into a classic polaroid-style photo complete with the iconic white border. Add handwritten-style captions, apply vintage color filters, and adjust the aging effects. Perfect for creating memorable, shareable images with a retro aesthetic.",
    metaDescription: "Transform images into vintage polaroid photos. Add captions, apply filters. Free online polaroid generator tool.",
    href: "/polaroid",
    category: "Image Editing",
    features: [
      "Classic polaroid frame styling",
      "Customizable captions",
      "Vintage color filters",
      "Aging and texture effects",
      "Multiple polaroid styles",
      "Batch processing",
      "High-resolution export"
    ],
    useCases: [
      "Social media nostalgia posts",
      "Wedding and event photos",
      "Scrapbooking and memory keeping",
      "Creative photo projects",
      "Gift and card creation",
      "Vintage-themed content"
    ],
    keywords: ["polaroid generator", "polaroid maker", "vintage photo", "retro photo effect", "polaroid frame", "instant photo"]
  },
  {
    slug: "watermark-remover",
    title: "Watermark Remover",
    shortDesc: "AI inpainting",
    description: "Remove watermarks from images using AI-powered inpainting. Clean results in seconds.",
    longDescription: "Remove unwanted watermarks from images using advanced AI-powered inpainting technology. Simply brush over the watermark area and the AI will intelligently fill in the background, producing clean, natural-looking results. Works with text watermarks, logos, and other overlays. All processing happens locally in your browser for privacy.",
    metaDescription: "Remove watermarks from images with AI inpainting. Clean results in seconds. Free online watermark remover tool.",
    href: "/watermark-remover",
    category: "AI Tools",
    features: [
      "AI-powered inpainting",
      "Brush selection tool",
      "Multiple pass refinement",
      "Works with text and logo watermarks",
      "Local browser processing",
      "High-quality output",
      "No image upload to servers"
    ],
    useCases: [
      "Cleaning up stock photos",
      "Removing unwanted overlays",
      "Restoring old photos",
      "Preparing images for presentations",
      "Content creation",
      "Personal photo editing"
    ],
    keywords: ["watermark remover", "remove watermark", "AI inpainting", "photo cleanup", "watermark eraser", "image restoration"]
  },
  {
    slug: "text-to-speech",
    title: "Text to Speech",
    shortDesc: "Kokoro, KittenTTS",
    description: "Convert text to natural-sounding speech with Kokoro 82M or KittenTTS. Multiple voices available.",
    longDescription: "Convert text to natural-sounding speech using state-of-the-art AI models. Choose from Kokoro 82M for high-quality synthesis or KittenTTS for faster processing. Multiple voice options available with adjustable speed and pitch. Export as MP3 or WAV files. Perfect for creating voiceovers, audiobooks, or accessibility content.",
    metaDescription: "Convert text to natural speech with AI. Multiple voices, adjustable speed. Free online text to speech tool.",
    href: "/tts",
    category: "AI Tools",
    features: [
      "Multiple AI voice models",
      "Various voice options",
      "Adjustable speed and pitch",
      "MP3 and WAV export",
      "Long text support",
      "Batch processing",
      "Browser-based processing"
    ],
    useCases: [
      "Creating voiceovers",
      "Audiobook production",
      "Accessibility content",
      "Video narration",
      "Language learning",
      "Podcast content"
    ],
    keywords: ["text to speech", "tts", "voice generator", "speech synthesis", "ai voice", "text reader"]
  },
  {
    slug: "image-text-editor",
    title: "Image Text Editor",
    shortDesc: "OCR text editing",
    description: "Edit any text in images with AI-powered OCR detection. Change fonts, colors, and content.",
    longDescription: "Edit text directly within images using AI-powered OCR (Optical Character Recognition). The tool automatically detects text in your images, allowing you to select, edit, and replace it while maintaining the original styling. Change fonts, colors, and content seamlessly. Perfect for correcting typos, translating text, or customizing images.",
    metaDescription: "Edit text in images with AI OCR detection. Change fonts, colors, content. Free online image text editor tool.",
    href: "/image-text-editor",
    category: "AI Tools",
    features: [
      "AI-powered OCR text detection",
      "In-place text editing",
      "Font matching technology",
      "Color picker for text",
      "Multiple text region support",
      "Undo/redo functionality",
      "High-quality output"
    ],
    useCases: [
      "Correcting typos in images",
      "Translating text in graphics",
      "Customizing templates",
      "Updating outdated information",
      "Localizing marketing materials",
      "Meme customization"
    ],
    keywords: ["image text editor", "edit text in image", "ocr editor", "photo text editor", "change text in picture", "image text changer"]
  },
  {
    slug: "bubble-blaster",
    title: "Bubble Blaster",
    shortDesc: "Remove speech bubbles",
    description: "Remove text from manga and comic speech bubbles instantly. Perfect for translations.",
    longDescription: "Automatically detect and remove text from manga and comic speech bubbles. The AI identifies speech bubbles and cleanly removes the text while preserving the bubble shape and background. Perfect for fan translations, scanlation projects, or creating clean templates. Batch process multiple pages for efficient workflow.",
    metaDescription: "Remove text from manga speech bubbles automatically. AI-powered, batch processing. Free online bubble blaster tool.",
    href: "/bubble-blaster",
    category: "AI Tools",
    features: [
      "Automatic speech bubble detection",
      "Clean text removal",
      "Preserves bubble shapes",
      "Batch page processing",
      "Manga-optimized AI",
      "Multiple language support",
      "High-quality output"
    ],
    useCases: [
      "Manga fan translations",
      "Scanlation projects",
      "Comic localization",
      "Creating clean templates",
      "Webtoon editing",
      "Educational manga content"
    ],
    keywords: ["bubble blaster", "manga text remover", "speech bubble cleaner", "comic text remover", "scanlation tool", "manga editor"]
  }
];
