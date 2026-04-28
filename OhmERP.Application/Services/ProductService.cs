using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Transactions;
using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
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
    private readonly IWebHostEnvironment _env;

    public ProductService(
        IGenericRepository<Product> productRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        INumeratorService numeratorService,
        IGenericRepository<TechnicalParameter> technicalParameterRepository,
        IWebHostEnvironment env)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _numeratorService = numeratorService;
        _technicalParameterRepository = technicalParameterRepository;
        _env = env;
    }

    private async Task<string> SaveBase64ImageAsync(string base64Data)
    {
        if (string.IsNullOrEmpty(base64Data)) return string.Empty;

        if (!base64Data.StartsWith("data:image/png;base64,") && 
            !base64Data.StartsWith("data:image/jpeg;base64,") && 
            !base64Data.StartsWith("data:image/webp;base64,"))
        {
            throw new BusinessException("Desteklenmeyen resim formatı tespit edildi. Sistem güvenliği gereği işlem reddedildi.");
        }

        var parts = base64Data.Split(',');
        var base64String = parts.Length > 1 ? parts[1] : parts[0];

        if (base64String.Length > 14000000) 
        {
            throw new BusinessException("Resim boyutu çok büyük. Maksimum 10MB yüklenebilir.");
        }

        var bytes = Convert.FromBase64String(base64String);
        if (bytes.Length < 4) throw new BusinessException("Bozuk dosya formatı tespit edildi.");

        string extension = ".png";
        if (base64Data.StartsWith("data:image/jpeg")) extension = ".jpg";
        else if (base64Data.StartsWith("data:image/webp")) extension = ".webp";

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "uploads", "products");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        await File.WriteAllBytesAsync(filePath, bytes);

        return $"/uploads/products/{fileName}";
    }

    private void DeleteImageFile(string imagePath)
    {
        if (string.IsNullOrEmpty(imagePath)) return;
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var filePath = Path.Combine(webRoot, imagePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(filePath))
        {
            try { File.Delete(filePath); } catch { }
        }
    }

    public async Task<List<ProductDto>> GetAllAsync()
    {
        var products = await _productRepository.FindWithQueryAsync(query => query);
        return _mapper.Map<List<ProductDto>>(products);
    }

    public async Task<ProductDto> GetByIdAsync(Guid id)
    {
        var products = await _productRepository.FindWithQueryAsync(query => 
            query.Include(p => p.InnerDetail)
                 .Include(p => p.Operations)
                 .Include(p => p.Images)
                 .Where(p => p.Id == id));
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

        if (request.HasInnerProduct && request.InnerDetail != null)
        {
            product.InnerDetail = _mapper.Map<ProductInnerDetail>(request.InnerDetail);
        }

        if (request.Operations.Any())
        {
            product.Operations = _mapper.Map<List<ProductOperation>>(request.Operations);
        }
        
        if (request.Images.Count > 20)
        {
            throw new BusinessException("Sistem standartları gereği bir ürüne maksimum 20 resim eklenebilir.");
        }

        if (request.Images.Any())
        {
            var images = new List<ProductImage>();
            foreach(var imgReq in request.Images)
            {
                var img = _mapper.Map<ProductImage>(imgReq);
                if (!string.IsNullOrEmpty(imgReq.ImageData) && imgReq.ImageData.StartsWith("data:image"))
                {
                    img.ImagePath = await SaveBase64ImageAsync(imgReq.ImageData);
                }
                else if (!string.IsNullOrEmpty(imgReq.ImagePath))
                {
                    img.ImagePath = imgReq.ImagePath;
                }
                images.Add(img);
            }
            product.Images = images;
        }

        await _productRepository.AddAsync(product);
        await _unitOfWork.SaveChangesAsync();

        scope.Complete();

        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> UpdateAsync(UpdateProductRequest request)
    {
        using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

        var existingProducts = await _productRepository.FindWithQueryAsync(query => 
            query.Include(p => p.InnerDetail)
                 .Include(p => p.Operations)
                 .Include(p => p.Images)
                 .Where(p => p.Id == request.Id));
        var existingProduct = existingProducts.FirstOrDefault();
        
        if (existingProduct == null) throw new BusinessException("Kayıt bulunamadı.");

        _mapper.Map(request, existingProduct);
        if (request.HasInnerProduct && request.InnerDetail != null)
        {
            if (existingProduct.InnerDetail == null)
            {
                var newInner = _mapper.Map<ProductInnerDetail>(request.InnerDetail);
                newInner.Id = Guid.Empty;
                existingProduct.InnerDetail = newInner;
            }
            else
            {
                _mapper.Map(request.InnerDetail, existingProduct.InnerDetail);
            }
        }
        else
        {
            existingProduct.InnerDetail = null;
        }

        existingProduct.Operations.Clear();
        foreach (var op in _mapper.Map<List<ProductOperation>>(request.Operations))
        {
            op.Id = Guid.Empty;
            existingProduct.Operations.Add(op);
        }

        if (request.Images.Count > 20)
        {
            throw new BusinessException("Sistem standartları gereği bir ürüne maksimum 20 resim eklenebilir.");
        }

        var newPaths = request.Images.Select(x => x.ImagePath).Where(x => !string.IsNullOrEmpty(x)).ToList();
        var deletedImages = existingProduct.Images.Where(x => !newPaths.Contains(x.ImagePath)).ToList();
        foreach(var deletedImage in deletedImages)
        {
            DeleteImageFile(deletedImage.ImagePath);
        }

        existingProduct.Images.Clear();
        foreach (var imgReq in request.Images)
        {
            var img = _mapper.Map<ProductImage>(imgReq);
            img.Id = Guid.Empty;
            if (!string.IsNullOrEmpty(imgReq.ImageData) && imgReq.ImageData.StartsWith("data:image"))
            {
                img.ImagePath = await SaveBase64ImageAsync(imgReq.ImageData);
            }
            else
            {
                img.ImagePath = imgReq.ImagePath ?? string.Empty;
            }
            existingProduct.Images.Add(img);
        }

        await _unitOfWork.SaveChangesAsync();

        scope.Complete();

        return _mapper.Map<ProductDto>(existingProduct);
    }

    public async Task DeleteAsync(Guid id)
    {
        using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

        var existingProducts = await _productRepository.FindWithQueryAsync(query => 
            query.Include(p => p.InnerDetail)
                 .Include(p => p.Operations)
                 .Include(p => p.Images)
                 .Where(p => p.Id == id));
        var existingProduct = existingProducts.FirstOrDefault();
        if (existingProduct == null) throw new BusinessException("Kayıt bulunamadı.");

        foreach(var img in existingProduct.Images)
        {
            DeleteImageFile(img.ImagePath);
        }

        _productRepository.Remove(existingProduct);
        await _unitOfWork.SaveChangesAsync();

        scope.Complete();
    }
}
