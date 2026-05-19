using System.Text.Json;
using DispensaApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace DispensaApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<FamilyGroup> FamilyGroups => Set<FamilyGroup>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    private static JsonDocument ParseJson(string s) => JsonDocument.Parse(s);

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.FirebaseUid).IsUnique();

        b.Entity<FamilyGroup>().HasIndex(g => g.InviteCode).IsUnique();

        b.Entity<FamilyMember>()
            .HasIndex(m => new { m.FamilyGroupId, m.UserId }).IsUnique();

        b.Entity<FamilyMember>()
            .HasOne(m => m.FamilyGroup).WithMany(g => g.Members)
            .HasForeignKey(m => m.FamilyGroupId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<FamilyMember>()
            .HasOne(m => m.User).WithMany(u => u.FamilyMemberships)
            .HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<Product>()
            .HasOne(p => p.FamilyGroup).WithMany(g => g.Products)
            .HasForeignKey(p => p.FamilyGroupId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<ActivityLog>()
            .HasOne(a => a.FamilyGroup).WithMany(g => g.ActivityLogs)
            .HasForeignKey(a => a.FamilyGroupId).OnDelete(DeleteBehavior.Cascade);

        // Value converter lets InMemory (tests) and Npgsql store JsonDocument as a string/jsonb column.
        // JsonDocument.Parse has optional params, so we wrap it to satisfy expression-tree constraints.
        var jsonConverter = new ValueConverter<JsonDocument, string>(
            v => v.RootElement.GetRawText(),
            v => ParseJson(v));
        b.Entity<ActivityLog>().Property(a => a.Details).HasConversion(jsonConverter);
    }
}
