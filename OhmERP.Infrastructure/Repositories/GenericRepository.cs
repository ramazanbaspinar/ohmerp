using Microsoft.EntityFrameworkCore;
using OhmERP.Application.DTOs.Common;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Domain.Common;
using OhmERP.Infrastructure.Contexts;
using System.Linq.Expressions;

namespace OhmERP.Infrastructure.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity
{
    protected readonly OhmERPDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(OhmERPDbContext context)
    {
        _context = context;
        _dbSet = _context.Set<T>();
    }

    public async Task AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
    }

    public async Task AddRangeAsync(IEnumerable<T> entities)
    {
        await _dbSet.AddRangeAsync(entities);
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<PagedResult<T>> GetPagedAsync(int pageNumber, int pageSize, Expression<Func<T, bool>>? predicate = null, Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null)
    {
        IQueryable<T> query = _dbSet;

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        var totalCount = await query.CountAsync();

        if (orderBy != null)
        {
            query = orderBy(query);
        }

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<PagedResult<T>> GetPagedWithQueryAsync(int pageNumber, int pageSize, Func<IQueryable<T>, IQueryable<T>>? queryModifier = null, Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null)
    {
        IQueryable<T> query = _dbSet;

        if (queryModifier != null)
        {
            query = queryModifier(query);
        }

        var totalCount = await query.CountAsync();

        if (orderBy != null)
        {
            query = orderBy(query);
        }

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<List<T>> FindWithQueryAsync(Func<IQueryable<T>, IQueryable<T>>? queryModifier = null, Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null)
    {
        IQueryable<T> query = _dbSet;

        if (queryModifier != null)
        {
            query = queryModifier(query);
        }

        if (orderBy != null)
        {
            query = orderBy(query);
        }

        return await query.ToListAsync();
    }

    public void Update(T entity)
    {
        _dbSet.Update(entity);
    }

    public void Remove(T entity)
    {
        if (entity is AuditableEntity auditableEntity)
        {
            auditableEntity.IsDeleted = true;
            _dbSet.Update(entity);
        }
        else
        {
            _dbSet.Remove(entity);
        }
    }

    public void RemoveRange(IEnumerable<T> entities)
    {
        if (entities.Any() && entities.First() is AuditableEntity)
        {
            foreach (var entity in entities)
            {
                var auditableEntity = (AuditableEntity)(object)entity;
                auditableEntity.IsDeleted = true;
                _dbSet.Update(entity);
            }
        }
        else
        {
            _dbSet.RemoveRange(entities);
        }
    }
}