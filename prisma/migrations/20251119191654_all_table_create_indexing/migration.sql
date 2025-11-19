-- DropIndex
DROP INDEX "public"."users_auth_method_idx";

-- CreateIndex
CREATE INDEX "answers_question_id_idx" ON "answers"("question_id");

-- CreateIndex
CREATE INDEX "answers_is_deleted_idx" ON "answers"("is_deleted");

-- CreateIndex
CREATE INDEX "download_history_user_id_idx" ON "download_history"("user_id");

-- CreateIndex
CREATE INDEX "download_history_is_deleted_idx" ON "download_history"("is_deleted");

-- CreateIndex
CREATE INDEX "exams_user_id_idx" ON "exams"("user_id");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "exams_is_deleted_idx" ON "exams"("is_deleted");

-- CreateIndex
CREATE INDEX "files_is_deleted_idx" ON "files"("is_deleted");

-- CreateIndex
CREATE INDEX "jobs_user_id_idx" ON "jobs"("user_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "one_time_codes_email_idx" ON "one_time_codes"("email");

-- CreateIndex
CREATE INDEX "one_time_codes_expiredAt_idx" ON "one_time_codes"("expiredAt");

-- CreateIndex
CREATE INDEX "one_time_codes_isDeleted_idx" ON "one_time_codes"("isDeleted");

-- CreateIndex
CREATE INDEX "permissions_is_deleted_idx" ON "permissions"("is_deleted");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "processing_steps_user_id_idx" ON "processing_steps"("user_id");

-- CreateIndex
CREATE INDEX "processing_steps_job_id_idx" ON "processing_steps"("job_id");

-- CreateIndex
CREATE INDEX "processing_steps_is_deleted_idx" ON "processing_steps"("is_deleted");

-- CreateIndex
CREATE INDEX "questions_ticket_id_idx" ON "questions"("ticket_id");

-- CreateIndex
CREATE INDEX "questions_subject_id_idx" ON "questions"("subject_id");

-- CreateIndex
CREATE INDEX "questions_is_deleted_idx" ON "questions"("is_deleted");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_is_deleted_idx" ON "refresh_tokens"("is_deleted");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_is_deleted_idx" ON "role_permissions"("is_deleted");

-- CreateIndex
CREATE INDEX "roles_is_deleted_idx" ON "roles"("is_deleted");

-- CreateIndex
CREATE INDEX "saved_questions_user_id_idx" ON "saved_questions"("user_id");

-- CreateIndex
CREATE INDEX "saved_questions_is_deleted_idx" ON "saved_questions"("is_deleted");

-- CreateIndex
CREATE INDEX "subjects_is_deleted_idx" ON "subjects"("is_deleted");

-- CreateIndex
CREATE INDEX "tickets_is_deleted_idx" ON "tickets"("is_deleted");

-- CreateIndex
CREATE INDEX "user_permissions_user_id_idx" ON "user_permissions"("user_id");

-- CreateIndex
CREATE INDEX "user_permissions_is_deleted_idx" ON "user_permissions"("is_deleted");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_is_deleted_idx" ON "user_roles"("is_deleted");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_session_id_idx" ON "user_sessions"("session_id");

-- CreateIndex
CREATE INDEX "user_sessions_is_deleted_idx" ON "user_sessions"("is_deleted");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_deleted_idx" ON "users"("is_deleted");
