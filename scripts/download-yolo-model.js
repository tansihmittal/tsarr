const https = require("https");
const fs = require("fs");
const path = require("path");

const modelUrl =
  "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.onnx";
const modelPath = path.join(
  __dirname,
  "..",
  "public",
  "models",
  "yolo11n.onnx"
);

console.log("Downloading YOLOv11n model...");
console.log("This may take a minute...\n");

function downloadFile(url, dest, redirectCount = 0) {
  if (redirectCount > 5) {
    console.error("Too many redirects");
    return;
  }

  const file = fs.createWriteStream(dest);

  https
    .get(url, (response) => {
      // Handle redirects (GitHub uses 302 redirects)
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`Redirecting to: ${redirectUrl.substring(0, 50)}...`);
        file.close();
        fs.unlinkSync(dest);
        downloadFile(redirectUrl, dest, redirectCount + 1);
        return;
      }

      if (response.statusCode !== 200) {
        console.error(`Failed to download: HTTP ${response.statusCode}`);
        file.close();
        fs.unlinkSync(dest);
        return;
      }

      const totalSize = parseInt(response.headers["content-length"], 10);
      let downloadedSize = 0;

      response.on("data", (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
          const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(1);
          const totalMB = (totalSize / 1024 / 1024).toFixed(1);
          process.stdout.write(
            `\rProgress: ${progress}% (${downloadedMB}MB / ${totalMB}MB)`
          );
        } else {
          const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(1);
          process.stdout.write(`\rDownloaded: ${downloadedMB}MB`);
        }
      });

      response.pipe(file);

      file.on("finish", () => {
        file.close();
        console.log("\n\n✅ YOLOv11n model downloaded successfully!");
        console.log(`   Location: ${dest}`);

        // Verify file size
        const stats = fs.statSync(dest);
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

        if (stats.size < 1000000) {
          console.warn(
            "\n⚠️  Warning: File seems too small. Download may have failed."
          );
        }
      });

      file.on("error", (err) => {
        fs.unlink(dest, () => {});
        console.error("\n❌ Error downloading model:", err.message);
      });
    })
    .on("error", (err) => {
      fs.unlink(dest, () => {});
      console.error("❌ Error:", err.message);
    });
}

downloadFile(modelUrl, modelPath);
