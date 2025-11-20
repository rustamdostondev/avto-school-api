const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const knex = require('knex');

// Database configuration
const dbConfig = {
  client: 'postgresql',
  connection: 'postgresql://avto_school:CFIHcY2UlbthnCdZ4IP1x@157.173.121.179:5432/avto_school',
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

const db = knex(dbConfig);

// Simple Migration class
class SimpleMigration {
  constructor() {
    this.subjects = new Map(); // lesson_id -> subject_uuid
    this.tickets = new Map(); // bilet_id -> ticket_uuid
    this.files = new Map(); // photo_name -> file_uuid
    this.stats = {
      subjects: 0,
      tickets: 0,
      files: 0,
      questions: 0,
      answers: 0,
    };
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

  // Questions dan lesson'larni yig'ish
  collectLessonsFromQuestions(questionsData) {
    const lessons = [];

    Object.keys(questionsData).forEach((lessonKey) => {
      const lessonData = questionsData[lessonKey];
      if (lessonData.lesson_info) {
        // Duplicate'larni oldini olish
        const existingLesson = lessons.find((l) => l.id === lessonData.lesson_info.id);
        if (!existingLesson) {
          lessons.push(lessonData.lesson_info);
        }
      }
    });

    return lessons;
  }

  // Subjects yaratish
  async insertSubjects(trx, lessons) {
    const subjectsData = [];

    lessons.forEach((lesson, index) => {
      if (!this.subjects.has(lesson.id)) {
        const subjectId = this.generateUUID();
        this.subjects.set(lesson.id, subjectId);

        const nameJson = JSON.stringify(lesson.name);

        const timestamp = new Date(Date.now() + index * 1000);
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

  // Photo nomlarini yig'ish
  collectPhotoNames(questionsData) {
    const photoNames = new Set();

    Object.keys(questionsData).forEach((lessonKey) => {
      const lessonData = questionsData[lessonKey];
      if (lessonData.questions && lessonData.questions.data) {
        lessonData.questions.data.forEach((question) => {
          if (question.photo && question.photo !== 'null') {
            photoNames.add(question.photo);
          }
        });
      }
    });

    return Array.from(photoNames);
  }

  // Files yaratish
  async insertFiles(trx, photoNames) {
    if (!photoNames || photoNames.length === 0) return;

    const filesData = [];
    photoNames.forEach((photoName) => {
      if (!this.files.has(photoName)) {
        const fileId = this.generateUUID();
        this.files.set(photoName, fileId);

        filesData.push({
          id: fileId,
          type: 'image',
          name: photoName,
          size: 0,
          bucket_name: 'rulionline-photos',
          path: `/photos/${photoName}`,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    });

    if (filesData.length > 0) {
      await trx.batchInsert('files', filesData, 100);
      this.stats.files += filesData.length;
      console.log(`   📁 Inserted ${filesData.length} files`);
    }
  }

  // Bilet ID larini yig'ish
  collectBiletIds(questionsData) {
    const biletIds = new Set();

    Object.keys(questionsData).forEach((lessonKey) => {
      const lessonData = questionsData[lessonKey];
      if (lessonData.questions && lessonData.questions.data) {
        lessonData.questions.data.forEach((question) => {
          if (question.bilet_id) {
            biletIds.add(question.bilet_id);
          }
        });
      }
    });

    return Array.from(biletIds);
  }

  // Tickets yaratish
  async insertTickets(trx, biletIds) {
    if (!biletIds || biletIds.length === 0) return;

    const ticketsData = [];
    [...new Set(biletIds)].forEach((biletId) => {
      if (!this.tickets.has(biletId)) {
        const ticketId = this.generateUUID();
        this.tickets.set(biletId, ticketId);

        const timestamp = new Date(Date.now() + biletId * 1000);
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

  // Savollarni yig'ish
  collectAllQuestions(questionsData) {
    const allQuestions = [];

    Object.keys(questionsData).forEach((lessonKey) => {
      const lessonData = questionsData[lessonKey];
      const lessonId = lessonData.lesson_info?.id;

      if (lessonData.questions && lessonData.questions.data) {
        lessonData.questions.data.forEach((question) => {
          allQuestions.push({ question, lessonId });
        });
      }
    });

    return allQuestions;
  }

  // Questions va Answers yaratish
  async insertQuestionsAndAnswers(trx, questionsArray) {
    if (!questionsArray || questionsArray.length === 0) return;

    const questionsData = [];
    const answersData = [];

    questionsArray.forEach((item, index) => {
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

      const questionTimestamp = new Date(Date.now() + index * 1000);
      questionsData.push({
        id: questionId,
        ticket_id: ticketId,
        subject_id: subjectId,
        title: titleJson,
        file_id: fileId,
        is_deleted: false,
        created_at: questionTimestamp,
        updated_at: questionTimestamp,
      });

      // Answers data
      if (question.answers && question.answers.answer) {
        const answers = question.answers.answer;
        const correctIndex = question.answers.status || 1;

        const ozAnswers = answers.oz || [];
        const uzAnswers = answers.uz || [];
        const ruAnswers = answers.ru || [];

        const maxLength = Math.max(ozAnswers.length, uzAnswers.length, ruAnswers.length);

        for (let i = 0; i < maxLength; i++) {
          const answerId = this.generateUUID();
          const isCorrect = i + 1 === correctIndex;

          const titleJson = {
            oz: ozAnswers[i] || '',
            uz: uzAnswers[i] || '',
            ru: ruAnswers[i] || '',
          };

          const answerTimestamp = new Date(Date.now() + index * 1000);
          answersData.push({
            id: answerId,
            question_id: questionId,
            is_correct: isCorrect,
            title: titleJson,
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
