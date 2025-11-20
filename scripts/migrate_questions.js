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
      const subjectsArr = subjectsData.map((subject, index) => {
        const timestamp = new Date(Date.now() + index * 1000);
        const id = uuidv4();
        return {
          id,
          name: JSON.stringify(subject.name),
          is_deleted: false,
          created_at: timestamp,
          updated_at: timestamp,
          pure_subject_id: subject.id,
        };
      });

      const all_questionsArr = Object.values(data)
        .map((par_question) => {
          return par_question.questions.data.map((question) => ({
            ...question,
            subject_id: par_question.lesson_info.id,
          }));
        })
        .flat()
        .sort((a, b) => a.id - b.id);

      const ticketsArr = Array.from(new Set(all_questionsArr.map((question) => question.bilet_id)))
        .sort((a, b) => a - b)
        .map((ticketId) => {
          const timestamp = new Date(Date.now() + ticketId * 1000);
          const id = uuidv4();
          return {
            id,
            name: `Bilet ${ticketId}`,
            is_deleted: false,
            created_at: timestamp,
            updated_at: timestamp,
            pure_ticket_id: ticketId,
          };
        });

      const filesArr = Array.from(new Set(all_questionsArr.map((question) => question.photo)))
        .sort((a, b) => a - b)
        .filter((photoName) => photoName !== null)
        .map((photoName, index) => {
          const timestamp = new Date(Date.now() + index * 1000);
          const id = uuidv4();
          return {
            id,
            type: 'image/png',
            name: photoName,
            size: 0,
            bucket_name: 'images',
            path: `/images/photos/${photoName}`,
            is_deleted: false,
            created_at: timestamp,
            updated_at: timestamp,
          };
        });

      let answersArr = [];
      const questionsArr = all_questionsArr.map((question) => {
        const questionTimestamp = new Date(Date.now() + question.id * 1000);
        const questionId = uuidv4();

        const ticketId = ticketsArr.find(
          (ticket) => ticket.pure_ticket_id == question.bilet_id,
        )?.id;
        const subjectId = subjectsArr.find(
          (subject) => subject.pure_subject_id == question.subject_id,
        )?.id;

        const fileId = filesArr.find((file) => file.name == question.photo)?.id || null;

        if (!ticketId || !subjectId) {
          throw new Error(`Question ${question.id} not migrated`);
        }

        // Answers data
        if (question.answers && question.answers.answer) {
          const answers = question.answers.answer;
          const correctIndex = question.answers.status || 1;

          const ozAnswers = answers.oz || [];
          const uzAnswers = answers.uz || [];
          const ruAnswers = answers.ru || [];

          const maxLength = Math.max(ozAnswers.length, uzAnswers.length, ruAnswers.length);

          for (let i = 0; i < maxLength; i++) {
            const answerId = uuidv4();
            const isCorrect = i + 1 === correctIndex;

            const titleJson = {
              oz: ozAnswers[i] || '',
              uz: uzAnswers[i] || '',
              ru: ruAnswers[i] || '',
            };

            const answerTimestamp = new Date(Date.now() + i * 1000);
            answersArr.push({
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

        const titleJson = JSON.stringify(question.question);

        return {
          id: questionId,
          ticket_id: ticketId,
          subject_id: subjectId,
          title: titleJson,
          file_id: fileId,
          is_deleted: false,
          created_at: questionTimestamp,
          updated_at: questionTimestamp,
        };
      });

      const subject = subjectsArr.map((subject) => {
        delete subject.pure_subject_id;
        return subject;
      });

      const ticket = ticketsArr.map((ticket) => {
        delete ticket.pure_ticket_id;
        return ticket;
      });

      const file = filesArr.map((file) => {
        return file;
      });

      const answer = answersArr.map((answer) => {
        return answer;
      });

      const question = questionsArr.map((question) => {
        return question;
      });

      await trx.batchInsert('subjects', subject);
      await trx.batchInsert('tickets', ticket);
      await trx.batchInsert('files', file);
      await trx.batchInsert('questions', question);
      await trx.batchInsert('answers', answer);
    });
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
