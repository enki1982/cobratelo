-- Añadir columna alertas_enviadas a tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS alertas_enviadas timestamptz;
