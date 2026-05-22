using ImpexioAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace ImpexioAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        // These are your 3 tables
        public DbSet<CbmRecord> CbmRecords { get; set; }
        public DbSet<CbmContainerSummary> CbmContainerSummaries { get; set; }
        public DbSet<CbmItem> CbmItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // CbmRecord table
            modelBuilder.Entity<CbmRecord>(entity =>
            {
                entity.ToTable("CbmRecords");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CbmNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CbmDate).IsRequired();
                entity.Property(e => e.DayBook).HasMaxLength(100);
                entity.Property(e => e.ListingNo).HasMaxLength(100);
                entity.Property(e => e.Exporter).HasMaxLength(200);
                entity.Property(e => e.PreparedBy).HasMaxLength(150);
                entity.Property(e => e.Signatory).HasMaxLength(150);
                entity.Property(e => e.Remarks).HasMaxLength(500);
            });

            // CbmContainerSummary table
            modelBuilder.Entity<CbmContainerSummary>(entity =>
            {
                entity.ToTable("CbmContainerSummaries");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ContainerType).IsRequired().HasMaxLength(10);
                entity.Property(e => e.Cbm).HasColumnType("decimal(10,3)");
                entity.Property(e => e.Mt).HasColumnType("decimal(10,3)");

                // Relationship: CbmContainerSummary belongs to CbmRecord
                entity.HasOne(e => e.CbmRecord)
                      .WithMany(r => r.Containers)
                      .HasForeignKey(e => e.CbmRecordId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // CbmItem table
            modelBuilder.Entity<CbmItem>(entity =>
            {
                entity.ToTable("CbmItems");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CalcType).IsRequired().HasMaxLength(5);
                entity.Property(e => e.Description).HasMaxLength(300);
                entity.Property(e => e.Length).HasColumnType("decimal(10,2)");
                entity.Property(e => e.Width).HasColumnType("decimal(10,2)");
                entity.Property(e => e.Height).HasColumnType("decimal(10,2)");
                entity.Property(e => e.Result).HasColumnType("decimal(14,6)");

                // Relationship: CbmItem belongs to CbmRecord
                entity.HasOne(e => e.CbmRecord)
                      .WithMany(r => r.Items)
                      .HasForeignKey(e => e.CbmRecordId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}