using FluentValidation;
using OhmERP.Application.DTOs.ItemCategory;

namespace OhmERP.Application.Validators.ItemCategory;

public class UpdateItemCategoryRequestValidator : AbstractValidator<UpdateItemCategoryRequest>
{
    public UpdateItemCategoryRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Kategori kodu boş bırakılamaz.")
            .MaximumLength(100).WithMessage("Kategori kodu en fazla 100 karakter olabilir.")
            .Matches("^[A-Z0-9_-]+$").WithMessage("Sistem kodlarında Türkçe karakter (Ş, Ğ, Ç, Ö, Ü, İ, ı) ve boşluk kullanılamaz. Sadece büyük harf, rakam ve alt çizgi (_) giriniz. (Örn: SATIS_MUDURU)");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Kategori adı boş bırakılamaz.")
            .MaximumLength(100).WithMessage("Kategori adı en fazla 100 karakter olabilir.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Açıklama alanı en fazla 500 karakter olabilir.");


    }
}
