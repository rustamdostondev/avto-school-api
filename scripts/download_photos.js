const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'https://api.rulionline.uz/storage/';
const PHOTOS_DIR = './photos';
const DATA_DIR = './data';

// JSON files to process
const JSON_FILES = ['all_questions.json', 'all_medium_controls.json', 'all_lesson_exams.json'];

// Statistics
let stats = {
  totalPhotos: 0,
  downloaded: 0,
  skipped: 0,
  errors: 0,
  duplicates: 0,
};

// Create photos directory if it doesn't exist
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  console.log(`📁 Created directory: ${PHOTOS_DIR}`);
}

// Function to download a single file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;

    const file = fs.createWriteStream(filepath);

    protocol
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);

          file.on('finish', () => {
            file.close();
            resolve(true);
          });

          file.on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete partial file
            reject(err);
          });
        } else {
          file.close();
          fs.unlink(filepath, () => {}); // Delete empty file
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(filepath, () => {}); // Delete partial file
        reject(err);
      });
  });
}

// Function to extract photo filenames from JSON data
function extractPhotos(data, photos = new Set()) {
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      data.forEach((item) => extractPhotos(item, photos));
    } else {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'photo' && value && typeof value === 'string' && value !== 'null') {
          photos.add(value);
        } else {
          extractPhotos(value, photos);
        }
      }
    }
  }
  return photos;
}

// Function to process a single JSON file
async function processJsonFile(filename) {
  const filepath = path.join(DATA_DIR, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File not found: ${filepath}`);
    return [];
  }

  console.log(`📖 Processing: ${filename}`);

  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const photos = extractPhotos(data);

    console.log(`   Found ${photos.size} unique photos in ${filename}`);
    return Array.from(photos);
  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
    return [];
  }
}

// Function to download photos with progress tracking
async function downloadPhotos(photoList) {
  const total = photoList.length;
  let current = 0;

  console.log(`\n🚀 Starting download of ${total} photos...\n`);

  // Process photos in batches to avoid overwhelming the server
  const BATCH_SIZE = 5;

  for (let i = 0; i < photoList.length; i += BATCH_SIZE) {
    const batch = photoList.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (photo) => {
      current++;
      const url = BASE_URL + photo;
      const filepath = path.join(PHOTOS_DIR, photo);

      // Check if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`⏭️  [${current}/${total}] Skipped (exists): ${photo}`);
        stats.skipped++;
        return;
      }

      try {
        await downloadFile(url, filepath);
        console.log(`✅ [${current}/${total}] Downloaded: ${photo}`);
        stats.downloaded++;
      } catch (error) {
        console.error(`❌ [${current}/${total}] Failed: ${photo} - ${error.message}`);
        stats.errors++;
      }
    });

    await Promise.all(promises);

    // Small delay between batches to be respectful to the server
    if (i + BATCH_SIZE < photoList.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Main function
async function main() {
  console.log('🎯 Rulionline Photo Downloader');
  console.log('================================\n');

  // Collect all photos from all JSON files
  const allPhotos = new Set();

  for (const filename of JSON_FILES) {
    const photos = await processJsonFile(filename);
    photos.forEach((photo) => allPhotos.add(photo));
  }

  const uniquePhotos = Array.from(allPhotos);
  stats.totalPhotos = uniquePhotos.length;

  console.log(`\n📊 Summary:`);
  console.log(`   Total unique photos found: ${stats.totalPhotos}`);

  if (stats.totalPhotos === 0) {
    console.log('❌ No photos found to download.');
    return;
  }

  // Download all photos
  await downloadPhotos(uniquePhotos);

  // Final statistics
  console.log('\n📈 Download Statistics:');
  console.log('========================');
  console.log(`Total photos found: ${stats.totalPhotos}`);
  console.log(`Successfully downloaded: ${stats.downloaded}`);
  console.log(`Skipped (already exists): ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(
    `Success rate: ${((stats.downloaded / (stats.totalPhotos - stats.skipped)) * 100).toFixed(1)}%`,
  );

  // Create a summary file
  const summary = {
    timestamp: new Date().toISOString(),
    statistics: stats,
    photos_directory: PHOTOS_DIR,
    base_url: BASE_URL,
    processed_files: JSON_FILES,
  };

  fs.writeFileSync('./download_summary.json', JSON.stringify(summary, null, 2));
  console.log('\n💾 Download summary saved to: download_summary.json');

  if (stats.errors > 0) {
    console.log('\n⚠️  Some photos failed to download. Check the error messages above.');
    console.log('   You can run this script again to retry failed downloads.');
  } else {
    console.log('\n🎉 All photos downloaded successfully!');
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { downloadFile, extractPhotos, processJsonFile };
