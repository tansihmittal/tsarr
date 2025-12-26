import * as ort from "onnxruntime-web";

// YOLO class names (COCO dataset)
export const YOLO_CLASSES = [
  "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
  "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
  "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
  "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
  "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
  "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
  "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
  "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
  "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
  "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair dryer", "toothbrush",
];

export interface DetectionResult {
  bbox: [number, number, number, number]; // x, y, width, height
  confidence: number;
  class: number;
  className: string;
}

class YOLODetector {
  private session: ort.InferenceSession | null = null;
  private modelLoaded = false;
  private inputSize = 640;

  async loadModel() {
    if (this.modelLoaded) return;

    try {
      console.log("Loading YOLOv11 model...");
      this.session = await ort.InferenceSession.create("/models/yolo11n.onnx", {
        executionProviders: ["wasm"],
      });
      this.modelLoaded = true;
      console.log("YOLOv11 model loaded successfully");
    } catch (error) {
      console.error("Failed to load YOLOv11 model:", error);
      throw error;
    }
  }

  async detect(
    imageElement: HTMLImageElement,
    confidenceThreshold = 0.5
  ): Promise<DetectionResult[]> {
    if (!this.session) {
      throw new Error("Model not loaded. Call loadModel() first.");
    }

    const { tensor, originalWidth, originalHeight, scale, offsetX, offsetY } =
      this.preprocessImage(imageElement);

    try {
      console.log("Running inference...");
      const feeds: Record<string, ort.Tensor> = { images: tensor };
      const results = await this.session.run(feeds);

      // Get output - YOLOv11 output shape is [1, 84, 8400]
      const outputName = Object.keys(results)[0];
      const output = results[outputName];
      const outputData = output.data as Float32Array;
      const outputDims = output.dims as number[];

      console.log("Output shape:", outputDims);

      // Post-process results
      return this.postprocess(
        outputData,
        outputDims,
        originalWidth,
        originalHeight,
        scale,
        offsetX,
        offsetY,
        confidenceThreshold
      );
    } catch (error) {
      console.error("Detection failed:", error);
      return [];
    }
  }

  private preprocessImage(imageElement: HTMLImageElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    canvas.width = this.inputSize;
    canvas.height = this.inputSize;

    const originalWidth = imageElement.naturalWidth || imageElement.width;
    const originalHeight = imageElement.naturalHeight || imageElement.height;

    // Calculate scale and offsets for letterboxing
    const scale = Math.min(
      this.inputSize / originalWidth,
      this.inputSize / originalHeight
    );
    const scaledWidth = originalWidth * scale;
    const scaledHeight = originalHeight * scale;
    const offsetX = (this.inputSize - scaledWidth) / 2;
    const offsetY = (this.inputSize - scaledHeight) / 2;

    // Fill with gray (114, 114, 114 is YOLO standard)
    ctx.fillStyle = "rgb(114, 114, 114)";
    ctx.fillRect(0, 0, this.inputSize, this.inputSize);
    ctx.drawImage(imageElement, offsetX, offsetY, scaledWidth, scaledHeight);

    // Get image data
    const imageData = ctx.getImageData(0, 0, this.inputSize, this.inputSize);
    const pixels = imageData.data;

    // Create tensor data [1, 3, 640, 640] - CHW format, normalized to 0-1
    const tensorData = new Float32Array(3 * this.inputSize * this.inputSize);
    const pixelCount = this.inputSize * this.inputSize;

    for (let i = 0; i < pixelCount; i++) {
      const pixelIdx = i * 4;
      tensorData[i] = pixels[pixelIdx] / 255.0; // R
      tensorData[pixelCount + i] = pixels[pixelIdx + 1] / 255.0; // G
      tensorData[2 * pixelCount + i] = pixels[pixelIdx + 2] / 255.0; // B
    }

    const tensor = new ort.Tensor("float32", tensorData, [
      1,
      3,
      this.inputSize,
      this.inputSize,
    ]);

    return { tensor, originalWidth, originalHeight, scale, offsetX, offsetY };
  }

  private postprocess(
    output: Float32Array,
    dims: number[],
    originalWidth: number,
    originalHeight: number,
    scale: number,
    offsetX: number,
    offsetY: number,
    confidenceThreshold: number
  ): DetectionResult[] {
    const results: DetectionResult[] = [];

    // YOLOv11 output: [1, 84, 8400] - need to transpose to [1, 8400, 84]
    // 84 = 4 (bbox) + 80 (classes)
    const numClasses = 80;
    const numDetections = dims[2]; // 8400
    const numFeatures = dims[1]; // 84

    console.log(`Processing ${numDetections} detections...`);

    for (let i = 0; i < numDetections; i++) {
      // Extract bbox (cx, cy, w, h) - transposed access
      const cx = output[0 * numDetections + i];
      const cy = output[1 * numDetections + i];
      const w = output[2 * numDetections + i];
      const h = output[3 * numDetections + i];

      // Find best class and its score
      let bestClass = 0;
      let bestScore = 0;
      for (let c = 0; c < numClasses; c++) {
        const score = output[(4 + c) * numDetections + i];
        if (score > bestScore) {
          bestScore = score;
          bestClass = c;
        }
      }

      if (bestScore < confidenceThreshold) continue;

      // Convert from letterboxed coordinates to original image coordinates
      const x1 = (cx - w / 2 - offsetX) / scale;
      const y1 = (cy - h / 2 - offsetY) / scale;
      const bboxW = w / scale;
      const bboxH = h / scale;

      // Clamp to image bounds
      const finalX = Math.max(0, Math.min(x1, originalWidth));
      const finalY = Math.max(0, Math.min(y1, originalHeight));
      const finalW = Math.min(bboxW, originalWidth - finalX);
      const finalH = Math.min(bboxH, originalHeight - finalY);

      if (finalW > 0 && finalH > 0) {
        results.push({
          bbox: [finalX, finalY, finalW, finalH],
          confidence: bestScore,
          class: bestClass,
          className: YOLO_CLASSES[bestClass] || "unknown",
        });
      }
    }

    console.log(`Found ${results.length} detections above threshold`);

    // Apply NMS
    return this.applyNMS(results, 0.45);
  }

  private applyNMS(
    detections: DetectionResult[],
    iouThreshold: number
  ): DetectionResult[] {
    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);

    const keep: DetectionResult[] = [];

    for (const detection of detections) {
      let shouldKeep = true;

      for (const kept of keep) {
        if (detection.class === kept.class) {
          const iou = this.calculateIoU(detection.bbox, kept.bbox);
          if (iou > iouThreshold) {
            shouldKeep = false;
            break;
          }
        }
      }

      if (shouldKeep) {
        keep.push(detection);
      }
    }

    console.log(`After NMS: ${keep.length} detections`);
    return keep;
  }

  private calculateIoU(
    box1: [number, number, number, number],
    box2: [number, number, number, number]
  ): number {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;

    const x1_max = x1 + w1;
    const y1_max = y1 + h1;
    const x2_max = x2 + w2;
    const y2_max = y2 + h2;

    const intersectX1 = Math.max(x1, x2);
    const intersectY1 = Math.max(y1, y2);
    const intersectX2 = Math.min(x1_max, x2_max);
    const intersectY2 = Math.min(y1_max, y2_max);

    const intersectArea =
      Math.max(0, intersectX2 - intersectX1) *
      Math.max(0, intersectY2 - intersectY1);
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;
    const unionArea = box1Area + box2Area - intersectArea;

    return unionArea > 0 ? intersectArea / unionArea : 0;
  }

  // Create mask from bounding boxes
  createMaskFromDetections(
    detections: DetectionResult[],
    width: number,
    height: number
  ): ImageData {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = width;
    canvas.height = height;

    // Fill with black (text shows here)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Draw white for detected objects (image shows here)
    ctx.fillStyle = "#ffffff";
    for (const detection of detections) {
      const [x, y, w, h] = detection.bbox;
      // Add some padding for better effect
      const padding = Math.min(w, h) * 0.05;
      ctx.fillRect(x - padding, y - padding, w + padding * 2, h + padding * 2);
    }

    return ctx.getImageData(0, 0, width, height);
  }
}

export const yoloDetector = new YOLODetector();
