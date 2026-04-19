using FluentValidation;
using OhmERP.Application.DTOs.Item;

namespace OhmERP.Application.Validators.Item;

public class UpdateItemRequestValidator : AbstractValidator<UpdateItemRequest>
{
    public UpdateItemRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Malzeme kodu zorunludur.")
            .MaximumLength(100).WithMessage("Malzeme kodu en fazla 100 karakter olabilir.")
            .Matches("^[A-Z0-9_-]+$").WithMessage("Sistem kodlarında Türkçe karakter (Ş, Ğ, Ç, Ö, Ü, İ, ı) ve boşluk kullanılamaz. Sadece büyük harf, rakam ve alt çizgi (_) giriniz. (Örn: SATIS_MUDURU)");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Malzeme adı zorunludur.")
            .MaximumLength(200).WithMessage("Malzeme adı en fazla 200 karakter olabilir.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Kategori seçimi zorunludur.");

        RuleFor(x => x.UnitOfMeasureId)
            .NotEmpty().WithMessage("Ölçü birimi seçimi zorunludur.");

        RuleFor(x => x.TaxRate)
            .GreaterThanOrEqualTo(0).WithMessage("KDV oranı 0'dan küçük olamaz.");

        RuleFor(x => x.CriticalStockLevel)
            .GreaterThanOrEqualTo(0).WithMessage("Kritik stok seviyesi 0'dan küçük olamaz.");

        RuleFor(x => x.Barcode)
            .MaximumLength(50).WithMessage("Barkod en fazla 50 karakter olabilir.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Açıklama en fazla 500 karakter olabilir.");


    }
}
