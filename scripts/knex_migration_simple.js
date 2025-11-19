const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const knex = require('knex');

/**
 * Enhanced Migration Script with Proper Ordering Logic
 *
 * This script ensures that when data is queried with ORDER BY created_at ASC:
 * 1. All records have sequential timestamps (1 second apart)
 * 2. Array elements (answers) maintain their original order through order_index
 * 3. All collections are sorted before insertion to ensure consistency
 * 4. First elements of JSON arrays will appear first when queried with ASC ordering
 */

// Database configuration
const dbConfig = {
  client: 'postgresql',
  connection: 'postgresql://postgres:130230@localhost:5432/avto_school',
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
};

// Ma'lumotlar fayli - faqat lesson exams
const DATA_FILE = './data/all_questions.json';

// Knex instance yaratish
const db = knex(dbConfig);

// Simple Migration class
class SimpleMigration {
  constructor() {
    this.subjects = new Map(); // lesson_id -> subject_uuid
    this.tickets = new Map(); // bilet_id -> ticket_uuid
    this.files = new Map(); // photo_name -> file_uuid
    this.baseTimestamp = new Date(); // Base timestamp for proper ordering
    this.orderCounter = 0; // Counter for sequential ordering
    this.stats = {
      subjects: 0,
      tickets: 0,
      files: 0,
      questions: 0,
      answers: 0,
    };
  }

  // Get next sequential timestamp for proper ASC ordering
  getNextTimestamp() {
    const timestamp = new Date(this.baseTimestamp.getTime() + this.orderCounter * 1000);
    this.orderCounter++;
    return timestamp;
  }

  // UUID generator
  generateUUID() {
    return uuidv4();
  }

  // Database connection test
  async testConnection() {
    try {
      await db.raw('SELECT 1');
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  // Questions dan lesson'larni yig'ish - sorted for proper ordering
  collectLessonsFromQuestions(questionsData) {
    const lessons = [];

    // Sort lesson keys to ensure consistent ordering
    const sortedLessonKeys = Object.keys(questionsData).sort();

    sortedLessonKeys.forEach((lessonKey) => {
      const lessonData = questionsData[lessonKey];
      if (lessonData.lesson_info) {
        // Duplicate'larni oldini olish
        const existingLesson = lessons.find((l) => l.id === lessonData.lesson_info.id);
        if (!existingLesson) {
          lessons.push(lessonData.lesson_info);
        }
      }
    });

    // Sort lessons by ID for consistent ordering
    return lessons.sort((a, b) => a.id - b.id);
  }

  // Subjects yaratish with proper ordering
  async insertSubjects(trx, lessons) {
    const subjectsData = [];

    lessons.forEach((lesson) => {
      if (!this.subjects.has(lesson.id)) {
        const subjectId = this.generateUUID();
        this.subjects.set(lesson.id, subjectId);

        const nameJson = {
          uz: lesson.name,
          oz: lesson.name,
          ru: lesson.name,
        };

        const timestamp = this.getNextTimestamp();
        subjectsData.push({
          id: subjectId,
          name: nameJson,
          is_deleted: false,
          created_at: timestamp,
          updated_at: timestamp,
        });
      }
    });

    if (subjectsData.length > 0) {
      await trx.batchInsert('subjects', subjectsData, 100);
      this.stats.subjects += subjectsData.length;
      console.log(`   📚 Inserted ${subjectsData.length} subjects`);
    }
  }

  // Photo nomlarini yig'ish - sorted for proper ordering
  collectPhotoNames(questionsData) {
    const photoNames = new Set();

    // Sort lesson keys to ensure consistent ordering
    const sortedLessonKeys = Object.keys(questionsData).sort();

    sortedLessonKeys.forEach((lessonKey) => {
      const lessonData = questionsData[lessonKey];
      if (lessonData.questions && lessonData.questions.data) {
        lessonData.questions.data.forEach((question) => {
          if (question.photo && question.photo !== 'null') {
            photoNames.add(question.photo);
          }
        });
      }
    });

    // Return sorted array for consistent ordering
    return Array.from(photoNames).sort();
  }

  // Files yaratish with proper ordering
  async insertFiles(trx, photoNames) {
    if (!photoNames || photoNames.length === 0) return;

    const filesData = [];
    photoNames.forEach((photoName) => {
      if (!this.files.has(photoName)) {
        const fileId = this.generateUUID();
        this.files.set(photoName, fileId);

        const timestamp = this.getNextTimestamp();
        filesData.push({
          id: fileId,
          type: 'image',
          name: photoName,
          size: 0,
          bucket_name: 'rulionline-photos',
          path: `/photos/${photoName}`,
          is_deleted: false,
          created_at: timestamp,
          updated_at: timestamp,
        });
      }
    });

    if (filesData.length > 0) {
      await trx.batchInsert('files', filesData, 100);
      this.stats.files += filesData.length;
      console.log(`   📁 Inserted ${filesData.length} files`);
    }
  }

  // Bilet ID larini yig'ish - sorted for proper ordering
  collectBiletIds(questionsData) {
    const biletIds = new Set();

    // Sort lesson keys to ensure consistent ordering
    const sortedLessonKeys = Object.keys(questionsData).sort();

    sortedLessonKeys.forEach((lessonKey) => {
      const lessonData = questionsData[lessonKey];
      if (lessonData.questions && lessonData.questions.data) {
        lessonData.questions.data.forEach((question) => {
          if (question.bilet_id) {
            biletIds.add(question.bilet_id);
          }
        });
      }
    });

    // Return sorted array for consistent ordering
    return Array.from(biletIds).sort((a, b) => a - b);
  }

  // Tickets yaratish with proper ordering
  async insertTickets(trx, biletIds) {
    if (!biletIds || biletIds.length === 0) return;

    const ticketsData = [];
    // biletIds is already sorted, so we maintain order
    biletIds.forEach((biletId) => {
      if (!this.tickets.has(biletId)) {
        const ticketId = this.generateUUID();
        this.tickets.set(biletId, ticketId);

        const timestamp = this.getNextTimestamp();
        ticketsData.push({
          id: ticketId,
          name: `Bilet ${biletId}`,
          is_deleted: false,
          created_at: timestamp,
          updated_at: timestamp,
        });
      }
    });

    if (ticketsData.length > 0) {
      await trx.batchInsert('tickets', ticketsData, 100);
      this.stats.tickets += ticketsData.length;
      console.log(`   🎫 Inserted ${ticketsData.length} tickets`);
    }
  }

  // Savollarni yig'ish - sorted for proper ordering
  collectAllQuestions(questionsData) {
    const allQuestions = [];

    // Sort lesson keys to ensure consistent ordering
    const sortedLessonKeys = Object.keys(questionsData).sort();

    sortedLessonKeys.forEach((lessonKey) => {
      const lessonData = questionsData[lessonKey];
      const lessonId = lessonData.lesson_info?.id;

      if (lessonData.questions && lessonData.questions.data) {
        // Sort questions by bilet_id and then by question order for consistent ordering
        const sortedQuestions = lessonData.questions.data.sort((a, b) => {
          if (a.bilet_id !== b.bilet_id) {
            return a.bilet_id - b.bilet_id;
          }
          // If same bilet_id, maintain original order or sort by question content
          return 0;
        });

        sortedQuestions.forEach((question) => {
          allQuestions.push({ question, lessonId });
        });
      }
    });

    return allQuestions;
  }

  // Questions va Answers yaratish with proper ordering
  async insertQuestionsAndAnswers(trx, questionsArray) {
    if (!questionsArray || questionsArray.length === 0) return;

    const questionsData = [];
    const answersData = [];

    questionsArray.forEach((item) => {
      const { question, lessonId } = item;
      const questionId = this.generateUUID();

      // Question data
      const ticketId = this.tickets.get(question.bilet_id);
      let subjectId = this.subjects.get(lessonId);

      // Agar subjectId null bo'lsa, birinchi mavjud subject dan foydalanamiz
      if (!subjectId && this.subjects.size > 0) {
        subjectId = Array.from(this.subjects.values())[0];
      }

      const fileId = this.files.get(question.photo) || null;

      const titleJson = {
        oz: question.question.oz || '',
        uz: question.question.uz || '',
        ru: question.question.ru || '',
      };

      const questionTimestamp = this.getNextTimestamp();
      questionsData.push({
        id: questionId,
        ticket_id: ticketId,
        subject_id: subjectId,
        title: titleJson,
        file_id: fileId,
        correct_answer_index: question.answers.status || 1,
        is_deleted: false,
        created_at: questionTimestamp,
        updated_at: questionTimestamp,
      });

      // Answers data - ensure proper ordering for array elements
      if (question.answers && question.answers.answer) {
        const answers = question.answers.answer;
        const correctIndex = question.answers.status || 1;

        const ozAnswers = answers.oz || [];
        const uzAnswers = answers.uz || [];
        const ruAnswers = answers.ru || [];

        const maxLength = Math.max(ozAnswers.length, uzAnswers.length, ruAnswers.length);

        // Create answers in order (0, 1, 2, 3...) to maintain array element order
        for (let i = 0; i < maxLength; i++) {
          const answerId = this.generateUUID();
          const isCorrect = i + 1 === correctIndex;

          const titleJson = {
            oz: ozAnswers[i] || '',
            uz: uzAnswers[i] || '',
            ru: ruAnswers[i] || '',
          };

          const answerTimestamp = this.getNextTimestamp();
          answersData.push({
            id: answerId,
            question_id: questionId,
            is_correct: isCorrect,
            title: titleJson,
            order_index: i + 1, // Add order index for proper array ordering
            is_deleted: false,
            created_at: answerTimestamp,
            updated_at: answerTimestamp,
          });
        }
      }
    });

    // Batch insert questions
    if (questionsData.length > 0) {
      await trx.batchInsert('questions', questionsData, 100);
      this.stats.questions += questionsData.length;
      console.log(`   ❓ Inserted ${questionsData.length} questions`);
    }

    // Batch insert answers
    if (answersData.length > 0) {
      await trx.batchInsert('answers', answersData, 500);
      this.stats.answers += answersData.length;
      console.log(`   ✅ Inserted ${answersData.length} answers`);
    }
  }

  // Test query to demonstrate proper ordering
  async testOrderedQuery() {
    try {
      console.log('\n🔍 Testing ordered queries...');

      // Test subjects ordering
      const subjects = await db('subjects')
        .select('id', 'name', 'created_at')
        .orderBy('created_at', 'asc')
        .limit(5);

      console.log('📚 First 5 subjects (ASC by created_at):');
      subjects.forEach((subject, index) => {
        console.log(`   ${index + 1}. ${subject.name.uz} - ${subject.created_at}`);
      });

      // Test questions with answers ordering
      const questionsWithAnswers = await db('questions')
        .select('questions.id', 'questions.title', 'questions.created_at')
        .join('answers', 'questions.id', 'answers.question_id')
        .select(
          'answers.title as answer_title',
          'answers.order_index',
          'answers.created_at as answer_created_at',
        )
        .orderBy('questions.created_at', 'asc')
        .orderBy('answers.order_index', 'asc')
        .limit(10);

      console.log('\n❓ First 5 questions with ordered answers (ASC):');
      let currentQuestionId = null;
      let questionCount = 0;

      questionsWithAnswers.forEach((row) => {
        if (row.id !== currentQuestionId && questionCount < 5) {
          currentQuestionId = row.id;
          questionCount++;
          console.log(`   Q${questionCount}: ${row.title.uz}`);
        }
        if (questionCount <= 5 && row.id === currentQuestionId) {
          console.log(`     A${row.order_index}: ${row.answer_title.uz}`);
        }
      });
    } catch (error) {
      console.log('⚠️  Test queries skipped (tables may not exist yet)');
    }
  }

  // Asosiy migration jarayoni
  async processAll() {
    console.log('🚀 Starting Simple Migration - All Questions...\n');

    try {
      // Database connection test
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Database connection failed');
      }

      // Ma'lumotlarni o'qish
      console.log('📖 Reading questions data...');
      if (!fs.existsSync(DATA_FILE)) {
        throw new Error('❌ all_questions.json file not found!');
      }

      const questionsData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log('✅ Questions data loaded successfully');

      // Transaction ichida barcha operatsiyalarni bajarish
      await db.transaction(async (trx) => {
        console.log('🔄 Starting database transaction...\n');

        // 1. Questions dan lesson'larni yig'ish va Subjects yaratish
        console.log('📚 Processing subjects from questions...');
        const lessons = this.collectLessonsFromQuestions(questionsData);
        await this.insertSubjects(trx, lessons);

        // 2. Photo nomlarini yig'ish va Files yaratish
        console.log('📁 Processing files...');
        const photoNames = this.collectPhotoNames(questionsData);
        await this.insertFiles(trx, photoNames);

        // 3. Bilet ID larini yig'ish va Tickets yaratish
        console.log('🎫 Processing tickets...');
        const biletIds = this.collectBiletIds(questionsData);
        await this.insertTickets(trx, biletIds);

        // 4. Savollarni yig'ish va Questions + Answers yaratish
        console.log('❓ Processing questions and answers...');
        const allQuestions = this.collectAllQuestions(questionsData);
        await this.insertQuestionsAndAnswers(trx, allQuestions);

        console.log('\n✅ Transaction completed successfully!');
      });

      // Statistics
      console.log('\n📊 Migration Summary:');
      console.log('========================');
      console.log(`Subjects: ${this.stats.subjects}`);
      console.log(`Files: ${this.stats.files}`);
      console.log(`Tickets: ${this.stats.tickets}`);
      console.log(`Questions: ${this.stats.questions}`);
      console.log(`Answers: ${this.stats.answers}`);

      // Test the ordering
      await this.testOrderedQuery();

      console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('🔄 Transaction rolled back automatically');
      throw error;
    } finally {
      // Database connection ni yopish
      await db.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Main function
async function main() {
  try {
    console.log('🎯 Rulionline Simple Migration - All Questions');
    console.log('====================================================\n');

    const migration = new SimpleMigration();
    await migration.processAll();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Script ishga tushirish
if (require.main === module) {
  main();
}

module.exports = { SimpleMigration };
