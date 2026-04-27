-- partial unique index는 ON CONFLICT 추론에 못 쓰임 → 비partial 인덱스로 교체.
-- 헤드라인을 자연 키로 사용 (같은 사건 중복 적재 방지).

drop index if exists news_embeddings_url_uniq;

create unique index if not exists news_embeddings_headline_uniq
  on news_embeddings (headline);
