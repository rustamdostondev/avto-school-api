const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const knex = require('knex');

// Database configuration
const db = knex({
  client: 'postgresql',
  connection: 'postgresql://avto_school:CFIHcY2UlbthnCdZ4IP1x@157.173.121.179:5432/avto_school',
  pool: { min: 2, max: 10 },
});

const DATA_FILE = './data/all_questions.json';
const DATA_FILE2 = './data/lessons.json';

// Simple migration with transaction
async function migrateQuestions() {
  try {
    // Load data
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const subjectsData = JSON.parse(fs.readFileSync(DATA_FILE2, 'utf8'));

    // Start transaction
    await db.transaction(async (trx) => {
      const subjects = subjectsData.map((subject, index) => {
        const timestamp = new Date(Date.now() + index * 1000);
        const id = uuidv4();
        return {
          id,
          name: JSON.stringify(subject.name),
          is_deleted: false,
          created_at: timestamp,
          updated_at: timestamp,
        };
      });

      if (subjects.length > 0) {
        await trx.batchInsert('subjects', subjects, 100);
        console.log(`   ✅ Inserted ${subjects.length} subjects\n`);
      }

      // Step 2: Insert Files (no duplicates)
      console.log('📁 Inserting files...');
      const filesMap = new Map();
      const files = [];

      Object.values(data).forEach((lesson) => {
        lesson.questions?.data?.forEach((q) => {
          if (q.photo && q.photo !== 'null' && !filesMap.has(q.photo)) {
            const id = uuidv4();
            filesMap.set(q.photo, id);

            files.push({
              id,
              type: 'image',
              name: q.photo,
              size: 0,
              bucket_name: 'rulionline-photos',
              path: `/photos/${q.photo}`,
              is_deleted: false,
              created_at: timestamp,
              updated_at: timestamp,
            });
          }
        });
      });

      if (files.length > 0) {
        await trx.batchInsert('files', files, 100);
        console.log(`   ✅ Inserted ${files.length} files\n`);
      }

      // Step 3: Insert Tickets (no duplicates)
      console.log('🎫 Inserting tickets...');
      const ticketsMap = new Map();
      const tickets = [];

      Object.values(data).forEach((lesson) => {
        lesson.questions?.data?.forEach((q) => {
          if (q.bilet_id && !ticketsMap.has(q.bilet_id)) {
            const id = uuidv4();
            const timestamp = new Date(Date.now() + q.bilet_id * 1000);

            ticketsMap.set(q.bilet_id, id);
            tickets.push({
              id,
              name: `Bilet ${q.bilet_id}`,
              is_deleted: false,
              created_at: timestamp,
              updated_at: timestamp,
            });
          }
        });
      });

      if (tickets.length > 0) {
        await trx.batchInsert('tickets', tickets, 100);
        console.log(`   ✅ Inserted ${tickets.length} tickets\n`);
      }

      // Step 4: Insert Questions and Answers
      console.log('❓ Inserting questions and answers...');
      const questions = [];
      const answers = [];
      let questionIndex = 0;

      Object.values(data).forEach((lesson) => {
        const subjectId = subjectsMap.get(lesson.lesson_info?.id);

        lesson.questions?.data?.forEach((q) => {
          const questionId = uuidv4();
          const timestamp = new Date(Date.now() + questionIndex * 1000);

          // Insert question
          questions.push({
            id: questionId,
            ticket_id: ticketsMap.get(q.bilet_id) || null,
            subject_id: subjectId || null,
            title: {
              oz: q.question?.oz || '',
              uz: q.question?.uz || '',
              ru: q.question?.ru || '',
            },
            file_id: filesMap.get(q.photo) || null,
            is_deleted: false,
            created_at: timestamp,
            updated_at: timestamp,
          });

          // Insert answers
          if (q.answers?.answer) {
            const correctIndex = q.answers.status || 1;
            const ozAnswers = q.answers.answer.oz || [];
            const uzAnswers = q.answers.answer.uz || [];
            const ruAnswers = q.answers.answer.ru || [];
            const maxLength = Math.max(ozAnswers.length, uzAnswers.length, ruAnswers.length);

            for (let i = 0; i < maxLength; i++) {
              answers.push({
                id: uuidv4(),
                question_id: questionId,
                is_correct: i + 1 === correctIndex,
                title: {
                  oz: ozAnswers[i] || '',
                  uz: uzAnswers[i] || '',
                  ru: ruAnswers[i] || '',
                },
                is_deleted: false,
                created_at: timestamp,
                updated_at: timestamp,
              });
            }
          }

          questionIndex++;
        });
      });

      if (questions.length > 0) {
        await trx.batchInsert('questions', questions, 100);
        console.log(`   ✅ Inserted ${questions.length} questions`);
      }

      if (answers.length > 0) {
        await trx.batchInsert('answers', answers, 500);
        console.log(`   ✅ Inserted ${answers.length} answers\n`);
      }

      console.log('✅ Transaction completed!\n');
    });

    // Summary
    console.log('📊 Migration Summary:');
    console.log('========================');
    console.log('✅ All data migrated successfully!');
    console.log('🎉 Migration completed!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('🔄 Transaction rolled back\n');
    throw error;
  } finally {
    await db.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  migrateQuestions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrateQuestions };
