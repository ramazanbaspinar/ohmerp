using FluentValidation;
using OhmERP.Application.DTOs.District;

namespace OhmERP.Application.Validators.District;

public class UpdateDistrictValidator : AbstractValidator<UpdateDistrictRequest>
{
    public UpdateDistrictValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Ýlçe adý boþ býrakýlamaz!")
            .MaximumLength(100).WithMessage("Ýlçe adý en fazla 100 karakter olabilir.");

        RuleFor(x => x.CityId)
            .NotEmpty().WithMessage("Ýlçenin baðlý olduðu þehir boþ býrakýlamaz.");
    }
}
