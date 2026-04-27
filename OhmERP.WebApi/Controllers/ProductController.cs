using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OhmERP.Application.DTOs.Product;
using OhmERP.Application.Interfaces.Services;
using OhmERP.WebApi.Security;

namespace OhmERP.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [HasPermission("Product.View")]
    public async Task<IActionResult> GetAll()
    {
        var products = await _productService.GetAllAsync();
        return Ok(products);
    }

    [HttpGet("{id}")]
    [HasPermission("Product.View")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var product = await _productService.GetByIdAsync(id);
        return Ok(product);
    }

    [HttpPost]
    [HasPermission("Product.Create")]
    public async Task<IActionResult> Create(CreateProductRequest request)
    {
        var result = await _productService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [HasPermission("Product.Update")]
    public async Task<IActionResult> Update(Guid id, UpdateProductRequest request)
    {
        if (id != request.Id)
            return BadRequest("ID mismatch");

        var result = await _productService.UpdateAsync(request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [HasPermission("Product.Delete")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _productService.DeleteAsync(id);
        return NoContent();
    }
}
