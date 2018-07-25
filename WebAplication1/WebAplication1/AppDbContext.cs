using Microsoft.EntityFrameworkCore;

namespace WebAplication1
{
    internal class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options)
        {
            
        }
        public DbSet<Customer> Customers { get; set; }
    }
}