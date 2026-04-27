using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OhmERP.Application.DTOs.Product;

namespace OhmERP.Application.Interfaces.Services;

public interface IProductService
{
    Task<ProductDto> GetByIdAsync(Guid id);
    Task<List<ProductDto>> GetAllAsync();
    Task<ProductDto> CreateAsync(CreateProductRequest request);
    Task<ProductDto> UpdateAsync(UpdateProductRequest request);
    Task DeleteAsync(Guid id);
}
