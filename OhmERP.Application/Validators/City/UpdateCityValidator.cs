using FluentValidation;
using OhmERP.Application.DTOs.City;

namespace OhmERP.Application.Validators.City;

public class UpdateCityValidator : AbstractValidator<UpdateCityRequest>
{
    public UpdateCityValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Şehir adı boş olamaz.")
            .MaximumLength(50).WithMessage("Şehir adı en fazla 50 karakter olabilir.");

        RuleFor(x => x.PlateCode)
            .NotEmpty().WithMessage("Plaka kodu boş olamaz.")
            .Length(2).WithMessage("Plaka kodu tam olarak 2 karakter olmalıdır (Örn: 38).");
    }
}
