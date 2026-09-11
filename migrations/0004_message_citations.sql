-- Persist retrieved source citations with tutor messages so [Source] tags
-- can open the actual excerpt instead of being re-derived from the text.
alter table messages add column if not exists citations_json text;
