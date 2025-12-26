# YOLO Model Setup

This directory contains the YOLO model files needed for object detection in the text-behind-image editor.

## Automatic Download

The YOLOv11n model should download automatically when you run the download script:

```bash
npm run download-yolo
```

## Manual Download

If automatic download fails, you can manually download the model:

1. Download YOLOv11n ONNX model from: https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.onnx
2. Place it in this directory as `yolo11n.onnx`

## Model Info

- **Model**: YOLOv11n (nano version for faster inference)
- **Format**: ONNX
- **Size**: ~5MB (22% smaller than v8)
- **Classes**: 80 COCO classes (person, car, bicycle, etc.)
- **Input**: 640x640 RGB images
- **Output**: Bounding boxes with confidence scores
- **Improvements**: Better accuracy and faster inference than YOLOv8

## Usage

The model is automatically loaded when you enable object detection in the text-behind-image editor. It detects objects like people, cars, animals, etc., and creates masks so text appears behind these objects.