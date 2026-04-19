using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Infrastructure.Contexts;

namespace OhmERP.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly OhmERPDbContext _context;

    public UnitOfWork(OhmERPDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}