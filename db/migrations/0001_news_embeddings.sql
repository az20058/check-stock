-- pgvector + news_embeddings + match_news RPC
-- Supabase SQL editor에 전체 붙여넣고 실행.

create extension if not exists vector;

create table if not exists news_embeddings (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  ticker text,
  headline text not null,
  summary text,
  url text,
  published_at timestamptz not null,
  embedding vector(1024) not null,
  created_at timestamptz default now()
);

-- 같은 헤드라인은 한 번만 (Supabase upsert ON CONFLICT 대상)
create unique index if not exists news_embeddings_headline_uniq
  on news_embeddings (headline);

-- 메타데이터 필터용
create index if not exists news_embeddings_ticker_pub_idx
  on news_embeddings (ticker, published_at desc);

create index if not exists news_embeddings_pub_idx
  on news_embeddings (published_at desc);

-- 벡터 유사도 검색용 (ivfflat: lists는 데이터 늘면 sqrt(N) 정도로 조정)
create index if not exists news_embeddings_embedding_idx
  on news_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- top-k 검색 RPC. supabase-js 에서 .rpc('match_news', {...}) 로 호출.
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
    id, headline, summary, url, source, ticker, published_at,
    1 - (embedding <=> query_embedding) as similarity
  from news_embeddings
  where (filter_ticker is null or ticker = filter_ticker)
    and published_at > now() - (filter_days || ' days')::interval
  order by embedding <=> query_embedding
  limit match_count;
$$;
