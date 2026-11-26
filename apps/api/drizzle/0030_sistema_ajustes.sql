CREATE TABLE "sistema_ajustes" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"respaldo_activo" boolean DEFAULT true NOT NULL,
	"respaldo_hora" text DEFAULT '03:00' NOT NULL,
	"respaldo_dias_retencion" integer DEFAULT 14 NOT NULL,
	"muestras_dias_retencion" integer DEFAULT 180 NOT NULL
);
