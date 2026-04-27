using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Transactions;
using AutoMapper;
using OhmERP.Application.DTOs.Product;
using OhmERP.Application.Interfaces.Repositories;
using OhmERP.Application.Interfaces.Services;
using OhmERP.Domain.Entities;
using OhmERP.Domain.Enums;
using OhmERP.Domain.Exceptions;

namespace OhmERP.Application.Services;

public class ProductService : IProductService
{
    private readonly IGenericRepository<Product> _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly INumeratorService _numeratorService;
    private readonly IGenericRepository<TechnicalParameter> _technicalParameterRepository;

    public ProductService(
        IGenericRepository<Product> productRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        INumeratorService numeratorService,
        IGenericRepository<TechnicalParameter> technicalParameterRepository)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _numeratorService = numeratorService;
        _technicalParameterRepository = technicalParameterRepository;
    }

    public async Task<List<ProductDto>> GetAllAsync()
    {
        var products = await _productRepository.FindWithQueryAsync(query => query);
        return _mapper.Map<List<ProductDto>>(products);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id)
    {
        var products = await _productRepository.FindWithQueryAsync(query => query.Where(p => p.Id == id));
        var product = products.FirstOrDefault();
        if (product == null) throw new BusinessException("Kayıt bulunamadı.");
        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest request)
    {
        using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

        var productCode = await _numeratorService.GenerateNextCodeAsync(DocumentType.Product);
        
        var product = _mapper.Map<Product>(request);
        product.Code = productCode;
        
        // Calculate Ohm for Outer Product
        product.OhmValue = await CalculateOhmAsync(request.VoltParameterId, request.WattParameterId);

        if (request.HasInnerProduct && request.InnerDetail != null)
        {
            product.InnerDetail = _mapper.Map<ProductInnerDetail>(request.InnerDetail);
            // Calculate Ohm for Inner Product
            product.InnerDetail.InnerOhmValue = await CalculateOhmAsync(request.InnerDetail.InnerVoltParameterId, request.InnerDetail.InnerWattParameterId);
        }

        if (request.Operations.Any())
        {
            product.Operations = _mapper.Map<List<ProductOperation>>(request.Operations);
        }
        
        if (request.Images.Any())
        {
            product.Images = _mapper.Map<List<ProductImage>>(request.Images);
        }

        await _productRepository.AddAsync(product);
        await _unitOfWork.SaveChangesAsync();

        scope.Complete();

        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> UpdateAsync(UpdateProductRequest request)
    {
        using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

        var existingProducts = await _productRepository.FindWithQueryAsync(query => query.Where(p => p.Id == request.Id));
        var existingProduct = existingProducts.FirstOrDefault();
        
        if (existingProduct == null) throw new BusinessException("Kayıt bulunamadı.");

        _mapper.Map(request, existingProduct);
        
        // Recalculate Ohm Value
        existingProduct.OhmValue = await CalculateOhmAsync(request.VoltParameterId, request.WattParameterId);

        // Update Inner Detail
        if (request.HasInnerProduct && request.InnerDetail != null)
        {
            if (existingProduct.InnerDetail == null)
            {
                existingProduct.InnerDetail = _mapper.Map<ProductInnerDetail>(request.InnerDetail);
            }
            else
            {
                _mapper.Map(request.InnerDetail, existingProduct.InnerDetail);
            }
            existingProduct.InnerDetail.InnerOhmValue = await CalculateOhmAsync(request.InnerDetail.InnerVoltParameterId, request.InnerDetail.InnerWattParameterId);
        }
        else
        {
            existingProduct.InnerDetail = null;
        }

        // Simplistic operation and image update for this example (in a real scenario, merge strategy needed)
        existingProduct.Operations = _mapper.Map<List<ProductOperation>>(request.Operations);
        existingProduct.Images = _mapper.Map<List<ProductImage>>(request.Images);

        _productRepository.Update(existingProduct);
        await _unitOfWork.SaveChangesAsync();

        scope.Complete();

        return _mapper.Map<ProductDto>(existingProduct);
    }

    public async Task DeleteAsync(Guid id)
    {
        using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

        var existingProducts = await _productRepository.FindWithQueryAsync(query => query.Where(p => p.Id == id));
        var existingProduct = existingProducts.FirstOrDefault();
        if (existingProduct == null) throw new BusinessException("Kayıt bulunamadı.");

        _productRepository.Remove(existingProduct);
        await _unitOfWork.SaveChangesAsync();

        scope.Complete();
    }
    
    private async Task<decimal> CalculateOhmAsync(Guid voltId, Guid wattId)
    {
        var voltParam = await _technicalParameterRepository.GetByIdAsync(voltId);
        var wattParam = await _technicalParameterRepository.GetByIdAsync(wattId);
        
        if (voltParam == null || wattParam == null || wattParam.NumericValue == 0)
        {
            return 0; // Or throw depending on requirements
        }
        
        // Math.Round(((Volt * Volt) / Watt) * 1.1, 1)
        var result = ((voltParam.NumericValue * voltParam.NumericValue) / wattParam.NumericValue) * 1.1m;
        return Math.Round(result, 1);
    }
}
