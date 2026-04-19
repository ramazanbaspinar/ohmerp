using FluentValidation;
using OhmERP.Application.DTOs.City;

namespace OhmERP.Application.Validators.City;

public class CreateCityValidator : AbstractValidator<CreateCityRequest>
{
    public CreateCityValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Þehir adý boþ olamaz.")
            .MaximumLength(50).WithMessage("Þehir adý en fazla 50 karakter olabilir.");

        RuleFor(x => x.PlateCode)
            .NotEmpty().WithMessage("Plaka kodu boþ olamaz.")
            .Length(2).WithMessage("Plaka kodu tam olarak 2 karakter olmalýdýr (Örn: 38).");
    }
}
