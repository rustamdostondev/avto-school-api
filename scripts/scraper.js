const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// API configuration
const BASE_URL = "https://api.rulionline.uz/api";
const BEARER_TOKEN = "3986630|1UTeVkFVVQnWAF6O2eNDoowQZuXD2F70r6EPNRD9bbe5e532";

// Common headers for all requests
const HEADERS = {
  Accept: "application/json",
  Authorization: `Bearer ${BEARER_TOKEN}`,
  "Sec-Fetch-Site": "same-site",
  "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Fetch-Mode": "cors",
  Origin: "https://rulionline.uz",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15",
  Referer: "https://rulionline.uz/",
  Connection: "keep-alive",
  "Sec-Fetch-Dest": "empty",
  Priority: "u=3, i",
};

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: HEADERS,
  timeout: 30000,
});

// Utility function to create directories
async function ensureDir(dirPath) {
  await fs.ensureDir(dirPath);
}

// Utility function to save data to JSON file
async function saveToFile(data, filename) {
  const dataDir = path.join(__dirname, "data");
  await ensureDir(dataDir);
  const filePath = path.join(dataDir, filename);
  await fs.writeJson(filePath, data, { spaces: 2 });
  console.log(`✅ Saved ${filename}`);
}

// Function to add delay between requests
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch all lessons
async function fetchLessons() {
  try {
    console.log("📚 Fetching lessons...");
    const response = await api.get("/lesson");
    const lessons = response.data;
    await saveToFile(lessons, "lessons.json");
    return lessons;
  } catch (error) {
    console.error("❌ Error fetching lessons:", error.message);
    return null;
  }
}

// Fetch questions for a specific lesson
async function fetchLessonQuestions(lessonId) {
  try {
    console.log(`❓ Fetching questions for lesson ${lessonId}...`);
    const response = await api.get(`/lesson/${lessonId}/question?random=null`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Error fetching questions for lesson ${lessonId}:`,
      error.message
    );
    return null;
  }
}

// Fetch all questions for all lessons
async function fetchAllQuestions(lessons) {
  if (!lessons || !Array.isArray(lessons)) {
    console.log("⚠️ No lessons data available for fetching questions");
    return;
  }

  const allQuestions = {};

  for (const lesson of lessons) {
    const lessonId = lesson.id;
    const questions = await fetchLessonQuestions(lessonId);

    if (questions) {
      allQuestions[`lesson_${lessonId}`] = {
        lesson_info: lesson,
        questions: questions,
      };
    }

    // Add delay to avoid overwhelming the server
    await delay(1000);
  }

  await saveToFile(allQuestions, "all_questions.json");
  return allQuestions;
}

// Fetch lesson exam data
async function fetchLessonExam(examId) {
  try {
    console.log(`📝 Fetching lesson exam ${examId}...`);
    const response = await api.get(`/lesson_exam/${examId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching lesson exam ${examId}:`, error.message);
    return null;
  }
}

// Fetch all lesson exams (trying different IDs)
async function fetchAllLessonExams() {
  const allExams = {};
  const maxExamId = 50; // Adjust this based on your needs

  console.log("📝 Fetching all lesson exams...");

  for (let examId = 1; examId <= maxExamId; examId++) {
    const exam = await fetchLessonExam(examId);

    if (exam) {
      allExams[`exam_${examId}`] = exam;
      console.log(`✅ Found exam ${examId}`);
    }

    // Add delay to avoid overwhelming the server
    await delay(500);
  }

  await saveToFile(allExams, "all_lesson_exams.json");
  return allExams;
}

// Fetch medium control data
async function fetchMediumControl(controlId) {
  try {
    console.log(`🎯 Fetching medium control ${controlId}...`);
    const response = await api.get(`/medium_control/${controlId}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Error fetching medium control ${controlId}:`,
      error.message
    );
    return null;
  }
}

// Fetch all medium controls (trying different IDs)
async function fetchAllMediumControls() {
  const allControls = {};
  const maxControlId = 50; // Adjust this based on your needs

  console.log("🎯 Fetching all medium controls...");

  for (let controlId = 1; controlId <= maxControlId; controlId++) {
    const control = await fetchMediumControl(controlId);

    if (control) {
      allControls[`control_${controlId}`] = control;
      console.log(`✅ Found medium control ${controlId}`);
    }

    // Add delay to avoid overwhelming the server
    await delay(500);
  }

  await saveToFile(allControls, "all_medium_controls.json");
  return allControls;
}

// Main function to orchestrate all data fetching
async function main() {
  console.log("🚀 Starting data collection from rulionline.uz API...\n");

  try {
    // Create data directory
    await ensureDir(path.join(__dirname, "data"));

    // Fetch lessons first
    const lessons = await fetchLessons();
    await delay(1000);

    // Fetch all questions for lessons
    if (lessons) {
      await fetchAllQuestions(lessons);
      await delay(2000);
    }

    // Fetch all lesson exams
    await fetchAllLessonExams();
    await delay(2000);

    // Fetch all medium controls
    await fetchAllMediumControls();

    console.log("\n🎉 Data collection completed!");
    console.log('📁 All data saved in the "data" directory');

    // Create summary
    const summary = {
      timestamp: new Date().toISOString(),
      files_created: [
        "lessons.json",
        "all_questions.json",
        "all_lesson_exams.json",
        "all_medium_controls.json",
      ],
      description: "Complete data export from rulionline.uz API",
    };

    await saveToFile(summary, "export_summary.json");
  } catch (error) {
    console.error("💥 Fatal error during data collection:", error.message);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n⏹️ Process interrupted by user");
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  fetchLessons,
  fetchLessonQuestions,
  fetchAllQuestions,
  fetchLessonExam,
  fetchAllLessonExams,
  fetchMediumControl,
  fetchAllMediumControls,
};
