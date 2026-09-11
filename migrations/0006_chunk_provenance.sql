-- Universal provenance from the canonical injection IR. `page` remains for
-- legacy PDF behavior; locator_json carries page, slide, section, or text.
alter table source_chunks add column if not exists locator_json text;
alter table source_chunks add column if not exists block_order int;
alter table source_chunks add column if not exists block_type text;

create index if not exists source_chunks_document_block_idx
  on source_chunks (document_id, block_order);
