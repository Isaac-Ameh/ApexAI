-- ApexStudy core: course model, learner model, assessment, study history.

create table if not exists courses (
  id serial primary key,
  user_id text not null,
  code text not null,
  title text not null,
  status text not null default 'ready',
  source_kind text not null default 'sample',
  source_name text,
  last_topic_id int,
  last_studied_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists courses_user_id_idx on courses (user_id);

create table if not exists chapters (
  id serial primary key,
  user_id text not null,
  course_id int not null references courses(id) on delete cascade,
  position int not null,
  title text not null
);
create index if not exists chapters_course_idx on chapters (course_id);

create table if not exists topics (
  id serial primary key,
  user_id text not null,
  course_id int not null references courses(id) on delete cascade,
  chapter_id int not null references chapters(id) on delete cascade,
  position int not null,
  title text not null,
  summary text not null default '',
  key_ideas_json text not null default '[]'
);
create index if not exists topics_course_idx on topics (course_id);
create index if not exists topics_chapter_idx on topics (chapter_id);

create table if not exists source_chunks (
  id serial primary key,
  user_id text not null,
  course_id int not null references courses(id) on delete cascade,
  topic_id int references topics(id) on delete set null,
  page int,
  content text not null
);
create index if not exists source_chunks_course_idx on source_chunks (course_id);
create index if not exists source_chunks_topic_idx on source_chunks (topic_id);

create table if not exists topic_mastery (
  user_id text not null,
  course_id int not null references courses(id) on delete cascade,
  topic_id int not null references topics(id) on delete cascade,
  mastery int not null default 0,
  attempts int not null default 0,
  correct int not null default 0,
  last_assessed_at timestamptz,
  primary key (user_id, topic_id)
);

create table if not exists messages (
  id serial primary key,
  user_id text not null,
  course_id int not null references courses(id) on delete cascade,
  topic_id int,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_course_idx on messages (course_id, id);

create table if not exists quiz_sessions (
  id serial primary key,
  user_id text not null,
  course_id int not null references courses(id) on delete cascade,
  kind text not null,
  topic_ids_json text not null default '[]',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id serial primary key,
  user_id text not null,
  course_id int not null references courses(id) on delete cascade,
  topic_id int not null references topics(id) on delete cascade,
  session_id int references quiz_sessions(id) on delete cascade,
  stem text not null,
  choices_json text not null,
  correct_index int not null,
  explanation text not null,
  difficulty text not null default 'recall',
  source_page int,
  created_at timestamptz not null default now()
);
create index if not exists questions_session_idx on questions (session_id);

create table if not exists answers (
  id serial primary key,
  user_id text not null,
  question_id int not null references questions(id) on delete cascade,
  course_id int not null,
  topic_id int not null,
  selected_index int not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists answers_course_idx on answers (course_id, created_at);
