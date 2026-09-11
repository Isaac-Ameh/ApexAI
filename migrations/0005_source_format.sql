-- Record the original source format on each injected document.
-- Locator identity lives on chunks later; format is enough for Phase 1.
alter table source_documents add column if not exists format text;
