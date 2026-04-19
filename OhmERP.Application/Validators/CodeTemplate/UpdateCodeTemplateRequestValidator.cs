using FluentValidation;
using OhmERP.Application.DTOs.CodeTemplate;

namespace OhmERP.Application.Validators.CodeTemplate;

public class UpdateCodeTemplateRequestValidator : AbstractValidator<UpdateCodeTemplateRequest>
{
    public UpdateCodeTemplateRequestValidator()
    {
        RuleFor(x => x.Prefix).MaximumLength(20).WithMessage("Prefix alanı en fazla 20 karakter olabilir.");
        RuleFor(x => x.Suffix).MaximumLength(20).WithMessage("Suffix alanı en fazla 20 karakter olabilir.");
        RuleFor(x => x.Padding).GreaterThan(0).WithMessage("Padding 0'dan büyük olmalıdır.");
        RuleFor(x => x.DateFormat).MaximumLength(20).WithMessage("Tarih formatı en fazla 20 karakter olabilir.");
        RuleFor(x => x.CurrentNumber).GreaterThanOrEqualTo(0).WithMessage("Geçerli numara 0'dan küçük olamaz.");
    }
}
