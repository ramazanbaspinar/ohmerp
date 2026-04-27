using System;
using System.Collections.Generic;

namespace OhmERP.Application.DTOs.Product;

public class UpdateProductRequest : CreateProductRequest
{
    public Guid Id { get; set; }
}
