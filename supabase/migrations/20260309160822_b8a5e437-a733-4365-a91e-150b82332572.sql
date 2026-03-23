ALTER TABLE birds DROP CONSTRAINT birds_pareja_id_fkey;
ALTER TABLE birds ADD CONSTRAINT birds_pareja_id_fkey FOREIGN KEY (pareja_id) REFERENCES birds(id) ON DELETE SET NULL;

ALTER TABLE birds DROP CONSTRAINT birds_padre_id_fkey;
ALTER TABLE birds ADD CONSTRAINT birds_padre_id_fkey FOREIGN KEY (padre_id) REFERENCES birds(id) ON DELETE SET NULL;

ALTER TABLE birds DROP CONSTRAINT birds_madre_id_fkey;
ALTER TABLE birds ADD CONSTRAINT birds_madre_id_fkey FOREIGN KEY (madre_id) REFERENCES birds(id) ON DELETE SET NULL;