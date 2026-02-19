-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."catalog_type" AS ENUM('Artikel - Restricted Use', 'Bahan Ajar', 'Buku - Circulation (BI Corner)', 'Buku - Circulation (Dapat Dipinjam)', 'Buku - Elektronik (E-Book)', 'Buku - Elektronik (E-Book) Kindle', 'Buku - Elektronik (E-Book) Restricted', 'Buku - Elektronik (E-Book) Tel-U Press', 'Buku - LAC', 'Buku - Reference (Hanya Baca di Tempat)', 'Buku Rekreatif - Circulation', 'Buku Softskill - Circulation', 'Case Studies', 'Disertasi - Reference', 'E-Article', 'Institutional Content', 'Jurnal Internasional - Reference', 'Jurnal Nasional - Reference', 'Jurnal Terakreditasi DIKTI - Reference', 'Karya Ilmiah - Disertasi (S3) - Reference', 'Karya Ilmiah - Skripsi (S1) - Reference', 'Karya Ilmiah - TA (D3) - Reference', 'Karya Ilmiah - Thesis (S2) - Reference', 'Majalah - Reference', 'Majalah Bundling', 'Majalah Ilmiah - Reference', 'Majalah Populer - Reference', 'Modul Praktikum ( Electronic )', 'Proceeding ( Electronic )', 'e - Article Journal', 'ePoster', 'skripsi');--> statement-breakpoint
CREATE TABLE "catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"catalog_number" varchar(100),
	"catalog_type" "catalog_type",
	"classification_number" varchar(100),
	"subject" varchar(255),
	"author" text,
	"editor" text,
	"publisher" text,
	"shelf_number" varchar(100),
	"library_location" text,
	"publication_year" smallint,
	"total_copies" integer DEFAULT 0,
	"access_link" text
);
--> statement-breakpoint
CREATE INDEX "catalog_publication_year_idx" ON "catalog" USING btree ("publication_year" int2_ops);
*/