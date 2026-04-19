using FluentValidation;
using OhmERP.Application.DTOs.UnitOfMeasure;

namespace OhmERP.Application.Validators.UnitOfMeasure;

public class CreateUnitOfMeasureRequestValidator : AbstractValidator<CreateUnitOfMeasureRequest>
{
    public CreateUnitOfMeasureRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Birim kodu boş bırakılamaz.")
            .MaximumLength(100).WithMessage("Birim kodu en fazla 100 karakter olabilir.")
            .Matches("^[A-Z0-9_-]+$").WithMessage("Sistem kodlarında Türkçe karakter (Ş, Ğ, Ç, Ö, Ü, İ, ı) ve boşluk kullanılamaz. Sadece büyük harf, rakam ve alt çizgi (_) giriniz. (Örn: SATIS_MUDURU)");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Birim adı boş bırakılamaz.")
            .MaximumLength(50).WithMessage("Birim adı en fazla 50 karakter olabilir.");

        RuleFor(x => x.Description)
            .MaximumLength(200).WithMessage("Açıklama alanı en fazla 200 karakter olabilir.");
    }
}
