// Backend integration tests clear their database; never point them at student data.
process.env.DATABASE_PATH = ":memory:";
