using OhmERP.Application.DTOs.Common;
using OhmERP.Domain.Common;
using System.Linq.Expressions;

namespace OhmERP.Application.Interfaces.Repositories;

public interface IGenericRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<PagedResult<T>> GetPagedAsync(int pageNumber, int pageSize, Expression<Func<T, bool>>? predicate = null, Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null);
    Task<PagedResult<T>> GetPagedWithQueryAsync(int pageNumber, int pageSize, Func<IQueryable<T>, IQueryable<T>>? queryModifier = null, Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null);
    Task<List<T>> FindWithQueryAsync(Func<IQueryable<T>, IQueryable<T>>? queryModifier = null, Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null);
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);
    void Update(T entity);
    void Remove(T entity);
    void RemoveRange(IEnumerable<T> entities);
}