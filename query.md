# Database Queries Documentation

## Schema

### Animes Table
```sql
CREATE TABLE animes (
  id SERIAL PRIMARY KEY,
  mal_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  image_url TEXT NOT NULL,
  episodes INTEGER NOT NULL
);
```

### Episodes Table
```sql
CREATE TABLE episodes (
  id SERIAL PRIMARY KEY,
  anime_id INTEGER NOT NULL,
  number INTEGER NOT NULL,
  iframe_url TEXT NOT NULL
);
```

## Common Queries

### Fetch All Animes
```sql
SELECT * FROM animes;
```

### Get Single Anime
```sql
SELECT * FROM animes WHERE id = $1;
```

### Get Episodes for Anime
```sql
SELECT * FROM episodes WHERE anime_id = $1 ORDER BY number ASC;
```

### Get Single Episode
```sql
SELECT * FROM episodes WHERE id = $1;
```

### Create Anime
```sql
INSERT INTO animes (mal_id, title, synopsis, image_url, episodes)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
```

### Create Episode
```sql
INSERT INTO episodes (anime_id, number, iframe_url)
VALUES ($1, $2, $3)
RETURNING *;
```

### Update Anime
```sql
UPDATE animes
SET mal_id = $1, title = $2, synopsis = $3, image_url = $4, episodes = $5
WHERE id = $6
RETURNING *;
```
