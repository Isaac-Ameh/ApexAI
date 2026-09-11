-- Retrieval architecture: documents, hierarchical chunk metadata, embeddings.
-- Vectors are stored as JSON so the same schema works on PGLite (preview)
-- and Neon (production). A later pgvector store can read the same rows.

create table if not exists source_documents (
  id serial primary key,
  user_id text not null,
  course_id int not null references courses(id) on delete cascade,
  kind text not null default 'upload',
  name text not null,
  page_count int,
  created_at timestamptz not null default now()
);
create index if not exists source_documents_course_idx on source_documents (course_id);

alter table source_chunks add column if not exists document_id int;
alter table source_chunks add column if not exists chapter_id int;
alter table source_chunks add column if not exists heading text;
alter table source_chunks add column if not exists chunk_index int;
alter table source_chunks add column if not exists chunk_uid text;
alter table source_chunks add column if not exists token_estimate int;

create unique index if not exists source_chunks_uid_idx on source_chunks (chunk_uid);

create table if not exists chunk_embeddings (
  chunk_id int not null references source_chunks(id) on delete cascade,
  user_id text not null,
  course_id int not null references courses(id) on delete cascade,
  provider text not null,
  model text not null,
  dimensions int not null,
  vector_json text not null,
  created_at timestamptz not null default now(),
  primary key (chunk_id, provider, model)
);
create index if not exists chunk_embeddings_course_idx on chunk_embeddings (course_id);
