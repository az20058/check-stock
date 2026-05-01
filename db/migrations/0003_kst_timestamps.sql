-- timestamptz → timestamp(no TZ)로 변환, KST wall-clock 저장.
-- 배치는 KST 컨텍스트로 돌고, Supabase Studio·앱에서 KST로 그대로 표시되도록 한다.
-- 기존 row는 AT TIME ZONE 'Asia/Seoul'로 환산.
--
-- 주의: news_embeddings는 ivfflat 벡터 인덱스가 있어 ALTER TYPE 시 인덱스 재빌드가 일어나며
-- Supabase의 maintenance_work_mem(32MB) 한계를 넘는다.
-- → 인덱스를 먼저 drop하고, 데이터가 충분히 커진 뒤(>1000 row) 재생성하기로 한다.
-- 현재 180 row 기준 seq scan으로도 1ms 미만이므로 RAG retrieve 성능에 무영향.

begin;

-- 1. briefing_runs (벡터 인덱스 없음, 단순 ALTER)
alter table briefing_runs
  alter column started_at type timestamp using (started_at at time zone 'Asia/Seoul'),
  alter column started_at set default (now() at time zone 'Asia/Seoul'),
  alter column finished_at type timestamp using (finished_at at time zone 'Asia/Seoul');

-- 2. news_embeddings: 벡터 인덱스 drop 후 ALTER (재생성은 보류)
drop index if exists news_embeddings_embedding_idx;

alter table news_embeddings
  alter column published_at type timestamp using (published_at at time zone 'Asia/Seoul'),
  alter column created_at type timestamp using (created_at at time zone 'Asia/Seoul'),
  alter column created_at set default (now() at time zone 'Asia/Seoul');

-- 3. match_news RPC: 컬럼 타입은 timestamp(no TZ)로 바뀌었지만
--    함수 return type을 그대로 timestamptz로 두고 SELECT에서 cast하면
--    create or replace로 처리 가능 (drop/recreate 불필요).
--    SELECT의 (published_at at time zone 'Asia/Seoul')는 KST wall-clock을 UTC instant로 변환.
create or replace function match_news(
  query_embedding vector(1024),
  match_count int default 5,
  filter_ticker text default null,
  filter_days int default 7
) returns table (
  id uuid,
  headline text,
  summary text,
  url text,
  source text,
  ticker text,
  published_at timestamptz,
  similarity float
) language sql stable as $$
  select
    id,
    headline,
    summary,
    url,
    source,
    ticker,
    (published_at at time zone 'Asia/Seoul')::timestamptz as published_at,
    1 - (embedding <=> query_embedding) as similarity
  from news_embeddings
  where (filter_ticker is null or ticker = filter_ticker)
    and published_at > (now() at time zone 'Asia/Seoul') - (filter_days || ' days')::interval
  order by embedding <=> query_embedding
  limit match_count;
$$;

commit;
